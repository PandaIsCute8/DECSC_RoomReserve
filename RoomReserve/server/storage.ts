// Following javascript_database blueprint
import { 
  users, 
  rooms, 
  reservations,
  roomReviews,
  type User, 
  type InsertUser,
  type Room,
  type InsertRoom,
  type Reservation,
  type InsertReservation,
  type ReservationWithDetails,
  type RoomWithCurrentStatus,
  type RoomReview,
  type InsertRoomReview
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc, avg, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  getUserByResetToken(tokenHash: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  savePasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;

  // Room methods
  getRoom(id: string): Promise<Room | undefined>;
  getAllRooms(): Promise<Room[]>;
  getRoomsWithStatus(date: string, time: string): Promise<RoomWithCurrentStatus[]>;
  createRoom(room: InsertRoom): Promise<Room>;

  // Reservation methods
  getReservation(id: string): Promise<Reservation | undefined>;
  getReservationWithDetails(id: string): Promise<ReservationWithDetails | undefined>;
  getUserReservations(userId: string): Promise<ReservationWithDetails[]>;
  getAllReservationsWithDetails(): Promise<ReservationWithDetails[]>;
  getRoomReservations(roomId: string, date: string): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservationStatus(id: string, status: string, checkedInAt?: Date): Promise<Reservation | undefined>;
  deleteReservation(id: string): Promise<boolean>;
  checkForConflicts(roomId: string, date: string, startTime: string, endTime: string): Promise<boolean>;
  getActiveReservationCountForDate(userId: string, date: string): Promise<number>;

  // Reviews
  createRoomReview(review: InsertRoomReview): Promise<RoomReview>;
  getRoomReviews(roomId: string): Promise<(RoomReview & { user: User })[]>;
  getRoomAverageRating(roomId: string): Promise<number | null>;

  // Hotspots / Recommendations
  getHotspots(date: string, time: string): Promise<Array<{ building: string; floor: number; occupied: number; total: number }>>;
  getRecommendations(purpose: string | undefined, groupSize: number | undefined, date: string, time: string): Promise<RoomWithCurrentStatus[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user || undefined;
  }

  async getUserByResetToken(tokenHash: string): Promise<User | undefined> {
    try {
      // First, try to find user with matching token (without expiration check to see if it exists)
      const [userWithToken] = await db
        .select()
        .from(users)
        .where(
          and(
            sql`${users.resetToken} IS NOT NULL`,
            eq(users.resetToken, tokenHash)
          )
        );
      
      if (userWithToken) {
        // Check expiration manually to get better error info
        const now = new Date();
        const expiresAt = userWithToken.resetTokenExpiresAt;
        const expiresAtDate = expiresAt ? new Date(expiresAt) : null;
        const isExpired = expiresAtDate ? expiresAtDate <= now : true;
        const timeDiffMinutes = expiresAtDate ? (expiresAtDate.getTime() - now.getTime()) / 1000 / 60 : null;
        
        console.log("getUserByResetToken: Found user with token", {
          userId: userWithToken.id,
          email: userWithToken.email,
          expiresAt: expiresAt?.toISOString(),
          expiresAtDate: expiresAtDate?.toISOString(),
          now: now.toISOString(),
          isExpired,
          timeDiffMinutes: timeDiffMinutes?.toFixed(2),
          tokenHashPrefix: tokenHash.substring(0, 16),
          storedTokenPrefix: userWithToken.resetToken?.substring(0, 16),
          tokensMatch: userWithToken.resetToken === tokenHash
        });
        
        if (!isExpired && expiresAt) {
          return userWithToken;
        } else if (isExpired) {
          console.log("getUserByResetToken: Token expired", {
            expiresAt: expiresAtDate?.toISOString(),
            now: now.toISOString(),
            minutesExpired: timeDiffMinutes ? Math.abs(timeDiffMinutes) : null
          });
        }
      }
      
      // If we get here, either no user found or token expired
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            sql`${users.resetToken} IS NOT NULL`,
            eq(users.resetToken, tokenHash),
            sql`${users.resetTokenExpiresAt} IS NOT NULL`,
            sql`${users.resetTokenExpiresAt} > NOW()`
          )
        );
      
      if (!user) {
        // Debug: Check if there are any users with reset tokens
        const usersWithTokens = await db
          .select({ id: users.id, email: users.email, resetToken: users.resetToken, resetTokenExpiresAt: users.resetTokenExpiresAt })
          .from(users)
          .where(sql`${users.resetToken} IS NOT NULL`)
          .limit(5);
        
        // Also check if token exists but expired
        const expiredTokens = await db
          .select({ id: users.id, email: users.email, resetToken: users.resetToken, resetTokenExpiresAt: users.resetTokenExpiresAt })
          .from(users)
          .where(
            and(
              sql`${users.resetToken} IS NOT NULL`,
              eq(users.resetToken, tokenHash),
              sql`${users.resetTokenExpiresAt} IS NOT NULL`,
              sql`${users.resetTokenExpiresAt} <= NOW()`
            )
          )
          .limit(1);
        
        console.log("getUserByResetToken: No matching user found", {
          tokenHashPrefix: tokenHash.substring(0, 16),
          usersWithTokensCount: usersWithTokens.length,
          expiredTokensCount: expiredTokens.length,
          sampleTokens: usersWithTokens.map(u => ({
            email: u.email,
            tokenPrefix: u.resetToken?.substring(0, 16),
            expiresAt: u.resetTokenExpiresAt,
            isExpired: u.resetTokenExpiresAt ? new Date(u.resetTokenExpiresAt) <= new Date() : null
          })),
          expiredTokenInfo: expiredTokens.length > 0 ? {
            email: expiredTokens[0].email,
            expiresAt: expiredTokens[0].resetTokenExpiresAt,
            now: new Date().toISOString()
          } : null
        });
      }
      
      return user || undefined;
    } catch (error) {
      console.error("getUserByResetToken error:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      })
      .where(eq(users.id, userId));
  }

  async savePasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const result = await db
      .update(users)
      .set({
        resetToken: tokenHash,
        resetTokenExpiresAt: expiresAt,
      })
      .where(eq(users.id, userId))
      .returning({ resetToken: users.resetToken, resetTokenExpiresAt: users.resetTokenExpiresAt });
    
    console.log("savePasswordResetToken: Token saved", {
      userId,
      tokenHashPrefix: tokenHash.substring(0, 16),
      savedTokenPrefix: result[0]?.resetToken?.substring(0, 16),
      savedExpiresAt: result[0]?.resetTokenExpiresAt?.toISOString(),
      matches: result[0]?.resetToken === tokenHash
    });
  }

  // Room methods
  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getAllRooms(): Promise<Room[]> {
    return db.select().from(rooms).where(eq(rooms.isActive, true));
  }

  async getRoomsWithStatus(date: string, time: string): Promise<RoomWithCurrentStatus[]> {
    const allRooms = await this.getAllRooms();
    const roomsWithStatus: RoomWithCurrentStatus[] = [];

    for (const room of allRooms) {
      // Get current reservation for this room at the given time
      const roomReservations = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.roomId, room.id),
            eq(reservations.date, date),
            lte(reservations.startTime, time),
            gte(reservations.endTime, time),
            sql`${reservations.status} IN ('confirmed', 'checked_in')`
          )
        );

      const currentReservation = roomReservations[0] || undefined;
      
      // Find next available time
      const futureReservations = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.roomId, room.id),
            eq(reservations.date, date),
            gte(reservations.startTime, time),
            sql`${reservations.status} IN ('confirmed', 'checked_in')`
          )
        )
        .orderBy(reservations.startTime);

      const nextAvailableTime = futureReservations[0]?.endTime;

      roomsWithStatus.push({
        ...room,
        currentReservation,
        nextAvailableTime,
      });
    }

    return roomsWithStatus;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  // Reservation methods
  async getReservation(id: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async getReservationWithDetails(id: string): Promise<ReservationWithDetails | undefined> {
    const result = await db
      .select()
      .from(reservations)
      .leftJoin(users, eq(reservations.userId, users.id))
      .leftJoin(rooms, eq(reservations.roomId, rooms.id))
      .where(eq(reservations.id, id));

    if (!result[0] || !result[0].users || !result[0].rooms) {
      return undefined;
    }

    return {
      ...result[0].reservations,
      user: result[0].users,
      room: result[0].rooms,
    };
  }

  async getUserReservations(userId: string): Promise<ReservationWithDetails[]> {
    const result = await db
      .select()
      .from(reservations)
      .leftJoin(users, eq(reservations.userId, users.id))
      .leftJoin(rooms, eq(reservations.roomId, rooms.id))
      .where(eq(reservations.userId, userId))
      .orderBy(reservations.date, reservations.startTime);

    return result
      .filter((r) => r.users && r.rooms)
      .map((r) => ({
        ...r.reservations,
        user: r.users!,
        room: r.rooms!,
      }));
  }

  async getAllReservationsWithDetails(): Promise<ReservationWithDetails[]> {
    const result = await db
      .select()
      .from(reservations)
      .leftJoin(users, eq(reservations.userId, users.id))
      .leftJoin(rooms, eq(reservations.roomId, rooms.id))
      .orderBy(reservations.date, reservations.startTime);

    return result
      .filter((r) => r.users && r.rooms)
      .map((r) => ({
        ...r.reservations,
        user: r.users!,
        room: r.rooms!,
      }));
  }

  async getRoomReservations(roomId: string, date: string): Promise<Reservation[]> {
    return db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.roomId, roomId),
          eq(reservations.date, date)
        )
      )
      .orderBy(reservations.startTime);
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    // Calculate check-in deadline (15 minutes after start time)
    const [hours, minutes] = insertReservation.startTime.split(':').map(Number);
    const checkInDeadline = new Date(`${insertReservation.date}T${insertReservation.startTime}:00`);
    checkInDeadline.setMinutes(checkInDeadline.getMinutes() + 15);

    const [reservation] = await db
      .insert(reservations)
      .values({
        ...insertReservation,
        status: "confirmed",
        checkInDeadline,
      })
      .returning();
    
    return reservation;
  }

  async updateReservationStatus(
    id: string, 
    status: string, 
    checkedInAt?: Date
  ): Promise<Reservation | undefined> {
    const updateData: any = { status };
    if (checkedInAt) {
      updateData.checkedInAt = checkedInAt;
    }

    const [reservation] = await db
      .update(reservations)
      .set(updateData)
      .where(eq(reservations.id, id))
      .returning();
    
    return reservation || undefined;
  }

  async deleteReservation(id: string): Promise<boolean> {
    const result = await db
      .delete(reservations)
      .where(eq(reservations.id, id))
      .returning();
    
    return result.length > 0;
  }

  async getActiveReservationCountForDate(userId: string, date: string): Promise<number> {
    const result = await db
      .select({ value: count().as("value") })
      .from(reservations)
      .where(
        and(
          eq(reservations.userId, userId),
          eq(reservations.date, date),
          sql`${reservations.status} IN ('confirmed', 'checked_in')`
        )
      );

    const value = result[0]?.value;
    if (value === undefined || value === null) return 0;
    // Handle both bigint and number types from database
    return typeof value === 'bigint' ? Number(value) : Number(value);
  }

  async checkForConflicts(
    roomId: string, 
    date: string, 
    startTime: string, 
    endTime: string
  ): Promise<boolean> {
    const conflicts = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.roomId, roomId),
          eq(reservations.date, date),
          sql`${reservations.status} IN ('confirmed', 'checked_in')`,
          sql`(
            (${reservations.startTime} < ${endTime} AND ${reservations.endTime} > ${startTime})
          )`
        )
      );

    return conflicts.length > 0;
  }

  // Reviews
  async createRoomReview(review: InsertRoomReview): Promise<RoomReview> {
    const [row] = await db.insert(roomReviews).values(review).returning();
    return row;
  }

  async getRoomReviews(roomId: string): Promise<(RoomReview & { user: User })[]> {
    const rows = await db
      .select()
      .from(roomReviews)
      .leftJoin(users, eq(roomReviews.userId, users.id))
      .where(eq(roomReviews.roomId, roomId))
      .orderBy(desc(roomReviews.createdAt));

    return rows
      .filter(r => r.users)
      .map(r => ({ ...r.room_reviews!, user: r.users! }));
  }

  async getRoomAverageRating(roomId: string): Promise<number | null> {
    const rows = await db
      .select({ value: avg(roomReviews.rating).as("avg") })
      .from(roomReviews)
      .where(eq(roomReviews.roomId, roomId));
    const val = (rows[0] as any)?.value as number | null;
    return val ?? null;
  }

  // Hotspots and Recommendations
  async getHotspots(date: string, time: string) {
    const allRooms = await this.getAllRooms();
    const roomsWith = await this.getRoomsWithStatus(date, time);
    const map = new Map<string, { building: string; floor: number; occupied: number; total: number }>();
    // Only count each unique room (building, floor, name) once in total
    const uniqueRoomKeys = new Set<string>();
    for (const room of allRooms) {
      const roomKey = `${room.building}-${room.floor}-${room.name}`;
      if (!uniqueRoomKeys.has(roomKey)) {
        uniqueRoomKeys.add(roomKey);
        const key = `${room.building}-${room.floor}`;
        if (!map.has(key)) map.set(key, { building: room.building, floor: room.floor, occupied: 0, total: 0 });
        const bucket = map.get(key)!;
        bucket.total += 1;
      }
    }
    for (const r of roomsWith) {
      const key = `${r.building}-${r.floor}`;
      const bucket = map.get(key)!;
      if (r.currentReservation) bucket.occupied += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.occupied / b.total - a.occupied / a.total);
  }

  async getRecommendations(purpose: string | undefined, groupSize: number | undefined, date: string, time: string): Promise<RoomWithCurrentStatus[]> {
    const roomsWith = await this.getRoomsWithStatus(date, time);
    // Score rooms: prefer available, capacity close to groupSize, basic amenity preference if purpose suggests
    const wantQuiet = purpose ? /study|review|quiet/i.test(purpose) : false;
    const wantCollab = purpose ? /tambay|group|collab|meeting/i.test(purpose) : false;

    return roomsWith
      .map(r => {
        let score = 0;
        if (!r.currentReservation) score += 100; // available now
        if (typeof groupSize === 'number' && groupSize > 0) {
          const diff = Math.abs((r.capacity || 0) - groupSize);
          score += Math.max(0, 50 - diff);
        }
        const amenities = (r.amenities || []) as string[];
        if (wantQuiet && amenities.some(a => /Air Conditioning|Whiteboard|Smart TV/i.test(a))) score += 10;
        if (wantCollab && amenities.some(a => /WiFi|Projector|Smart TV/i.test(a))) score += 10;
        return { room: r, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(x => x.room);
  }
}

export const storage = new DatabaseStorage();
