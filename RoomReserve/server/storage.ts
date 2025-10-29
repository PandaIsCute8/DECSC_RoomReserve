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
  createUser(user: InsertUser): Promise<User>;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
    for (const room of allRooms) {
      const key = `${room.building}-${room.floor}`;
      if (!map.has(key)) map.set(key, { building: room.building, floor: room.floor, occupied: 0, total: 0 });
      const bucket = map.get(key)!;
      bucket.total += 1;
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
