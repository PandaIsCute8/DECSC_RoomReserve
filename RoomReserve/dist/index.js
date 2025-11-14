var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertReservationSchema: () => insertReservationSchema,
  insertRoomReviewSchema: () => insertRoomReviewSchema,
  insertRoomSchema: () => insertRoomSchema,
  insertUserSchema: () => insertUserSchema,
  reservationStatusEnum: () => reservationStatusEnum,
  reservations: () => reservations,
  reservationsRelations: () => reservationsRelations,
  roomReviews: () => roomReviews,
  roomReviewsRelations: () => roomReviewsRelations,
  rooms: () => rooms,
  roomsRelations: () => roomsRelations,
  selectReservationSchema: () => selectReservationSchema,
  selectRoomReviewSchema: () => selectRoomReviewSchema,
  selectRoomSchema: () => selectRoomSchema,
  selectUserSchema: () => selectUserSchema,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
var reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "checked_in",
  "cancelled",
  "no_show"
]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  studentId: text("student_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var rooms = pgTable(
  "rooms",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    building: text("building").notNull().default("JGSOM"),
    floor: integer("floor").notNull(),
    capacity: integer("capacity").notNull(),
    amenities: text("amenities").array().notNull().default(sql`ARRAY[]::text[]`),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true)
  },
  (t) => ({
    roomsUniqueByLocationAndName: unique("rooms_unique_building_floor_name").on(
      t.building,
      t.floor,
      t.name
    )
  })
);
var reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  // ISO date string YYYY-MM-DD
  startTime: text("start_time").notNull(),
  // HH:MM format
  endTime: text("end_time").notNull(),
  // HH:MM format
  purpose: text("purpose"),
  status: reservationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  checkInDeadline: timestamp("check_in_deadline"),
  // 15 minutes after start time
  checkedInAt: timestamp("checked_in_at")
});
var roomReviews = pgTable("room_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  // 1-5
  comment: text("comment"),
  context: text("context"),
  // e.g., "study", "tambay", etc.
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations)
}));
var roomsRelations = relations(rooms, ({ many }) => ({
  reservations: many(reservations),
  reviews: many(roomReviews)
}));
var reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id]
  }),
  room: one(rooms, {
    fields: [reservations.roomId],
    references: [rooms.id]
  })
}));
var roomReviewsRelations = relations(roomReviews, ({ one }) => ({
  user: one(users, { fields: [roomReviews.userId], references: [users.id] }),
  room: one(rooms, { fields: [roomReviews.roomId], references: [rooms.id] })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  resetToken: true,
  resetTokenExpiresAt: true
});
var insertRoomSchema = createInsertSchema(rooms).omit({
  id: true
});
var insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
  checkInDeadline: true,
  checkedInAt: true,
  status: true
}).extend({
  // Add validation for time format and advance booking
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
});
var insertRoomReviewSchema = createInsertSchema(roomReviews).omit({
  id: true,
  createdAt: true
}).extend({
  rating: z.number().int().min(1).max(5),
  context: z.string().optional(),
  comment: z.string().max(2e3).optional()
});
var selectUserSchema = createSelectSchema(users);
var selectRoomSchema = createSelectSchema(rooms);
var selectReservationSchema = createSelectSchema(reservations);
var selectRoomReviewSchema = createSelectSchema(roomReviews);

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { config } from "dotenv";
config();
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, gte, lte, sql as sql2, desc, avg, count } from "drizzle-orm";
var DatabaseStorage = class {
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async getUserByStudentId(studentId) {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user || void 0;
  }
  async getUserByResetToken(tokenHash) {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.resetToken, tokenHash),
        sql2`${users.resetTokenExpiresAt} > NOW()`
      )
    );
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUserPassword(userId, passwordHash) {
    await db.update(users).set({
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null
    }).where(eq(users.id, userId));
  }
  async savePasswordResetToken(userId, tokenHash, expiresAt) {
    await db.update(users).set({
      resetToken: tokenHash,
      resetTokenExpiresAt: expiresAt
    }).where(eq(users.id, userId));
  }
  // Room methods
  async getRoom(id) {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || void 0;
  }
  async getAllRooms() {
    return db.select().from(rooms).where(eq(rooms.isActive, true));
  }
  async getRoomsWithStatus(date, time) {
    const allRooms = await this.getAllRooms();
    const roomsWithStatus = [];
    for (const room of allRooms) {
      const roomReservations = await db.select().from(reservations).where(
        and(
          eq(reservations.roomId, room.id),
          eq(reservations.date, date),
          lte(reservations.startTime, time),
          gte(reservations.endTime, time),
          sql2`${reservations.status} IN ('confirmed', 'checked_in')`
        )
      );
      const currentReservation = roomReservations[0] || void 0;
      const futureReservations = await db.select().from(reservations).where(
        and(
          eq(reservations.roomId, room.id),
          eq(reservations.date, date),
          gte(reservations.startTime, time),
          sql2`${reservations.status} IN ('confirmed', 'checked_in')`
        )
      ).orderBy(reservations.startTime);
      const nextAvailableTime = futureReservations[0]?.endTime;
      roomsWithStatus.push({
        ...room,
        currentReservation,
        nextAvailableTime
      });
    }
    return roomsWithStatus;
  }
  async createRoom(insertRoom) {
    const [room] = await db.insert(rooms).values(insertRoom).returning();
    return room;
  }
  // Reservation methods
  async getReservation(id) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || void 0;
  }
  async getReservationWithDetails(id) {
    const result = await db.select().from(reservations).leftJoin(users, eq(reservations.userId, users.id)).leftJoin(rooms, eq(reservations.roomId, rooms.id)).where(eq(reservations.id, id));
    if (!result[0] || !result[0].users || !result[0].rooms) {
      return void 0;
    }
    return {
      ...result[0].reservations,
      user: result[0].users,
      room: result[0].rooms
    };
  }
  async getUserReservations(userId) {
    const result = await db.select().from(reservations).leftJoin(users, eq(reservations.userId, users.id)).leftJoin(rooms, eq(reservations.roomId, rooms.id)).where(eq(reservations.userId, userId)).orderBy(reservations.date, reservations.startTime);
    return result.filter((r) => r.users && r.rooms).map((r) => ({
      ...r.reservations,
      user: r.users,
      room: r.rooms
    }));
  }
  async getAllReservationsWithDetails() {
    const result = await db.select().from(reservations).leftJoin(users, eq(reservations.userId, users.id)).leftJoin(rooms, eq(reservations.roomId, rooms.id)).orderBy(reservations.date, reservations.startTime);
    return result.filter((r) => r.users && r.rooms).map((r) => ({
      ...r.reservations,
      user: r.users,
      room: r.rooms
    }));
  }
  async getRoomReservations(roomId, date) {
    return db.select().from(reservations).where(
      and(
        eq(reservations.roomId, roomId),
        eq(reservations.date, date)
      )
    ).orderBy(reservations.startTime);
  }
  async createReservation(insertReservation) {
    const [hours, minutes] = insertReservation.startTime.split(":").map(Number);
    const checkInDeadline = /* @__PURE__ */ new Date(`${insertReservation.date}T${insertReservation.startTime}:00`);
    checkInDeadline.setMinutes(checkInDeadline.getMinutes() + 15);
    const [reservation] = await db.insert(reservations).values({
      ...insertReservation,
      status: "confirmed",
      checkInDeadline
    }).returning();
    return reservation;
  }
  async updateReservationStatus(id, status, checkedInAt) {
    const updateData = { status };
    if (checkedInAt) {
      updateData.checkedInAt = checkedInAt;
    }
    const [reservation] = await db.update(reservations).set(updateData).where(eq(reservations.id, id)).returning();
    return reservation || void 0;
  }
  async deleteReservation(id) {
    const result = await db.delete(reservations).where(eq(reservations.id, id)).returning();
    return result.length > 0;
  }
  async getActiveReservationCountForDate(userId, date) {
    const result = await db.select({ value: count().as("value") }).from(reservations).where(
      and(
        eq(reservations.userId, userId),
        eq(reservations.date, date),
        sql2`${reservations.status} IN ('confirmed', 'checked_in')`
      )
    );
    const value = result[0]?.value;
    if (value === void 0 || value === null) return 0;
    return typeof value === "bigint" ? Number(value) : Number(value);
  }
  async checkForConflicts(roomId, date, startTime, endTime) {
    const conflicts = await db.select().from(reservations).where(
      and(
        eq(reservations.roomId, roomId),
        eq(reservations.date, date),
        sql2`${reservations.status} IN ('confirmed', 'checked_in')`,
        sql2`(
            (${reservations.startTime} < ${endTime} AND ${reservations.endTime} > ${startTime})
          )`
      )
    );
    return conflicts.length > 0;
  }
  // Reviews
  async createRoomReview(review) {
    const [row] = await db.insert(roomReviews).values(review).returning();
    return row;
  }
  async getRoomReviews(roomId) {
    const rows = await db.select().from(roomReviews).leftJoin(users, eq(roomReviews.userId, users.id)).where(eq(roomReviews.roomId, roomId)).orderBy(desc(roomReviews.createdAt));
    return rows.filter((r) => r.users).map((r) => ({ ...r.room_reviews, user: r.users }));
  }
  async getRoomAverageRating(roomId) {
    const rows = await db.select({ value: avg(roomReviews.rating).as("avg") }).from(roomReviews).where(eq(roomReviews.roomId, roomId));
    const val = rows[0]?.value;
    return val ?? null;
  }
  // Hotspots and Recommendations
  async getHotspots(date, time) {
    const allRooms = await this.getAllRooms();
    const roomsWith = await this.getRoomsWithStatus(date, time);
    const map = /* @__PURE__ */ new Map();
    const uniqueRoomKeys = /* @__PURE__ */ new Set();
    for (const room of allRooms) {
      const roomKey = `${room.building}-${room.floor}-${room.name}`;
      if (!uniqueRoomKeys.has(roomKey)) {
        uniqueRoomKeys.add(roomKey);
        const key = `${room.building}-${room.floor}`;
        if (!map.has(key)) map.set(key, { building: room.building, floor: room.floor, occupied: 0, total: 0 });
        const bucket = map.get(key);
        bucket.total += 1;
      }
    }
    for (const r of roomsWith) {
      const key = `${r.building}-${r.floor}`;
      const bucket = map.get(key);
      if (r.currentReservation) bucket.occupied += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.occupied / b.total - a.occupied / a.total);
  }
  async getRecommendations(purpose, groupSize, date, time) {
    const roomsWith = await this.getRoomsWithStatus(date, time);
    const wantQuiet = purpose ? /study|review|quiet/i.test(purpose) : false;
    const wantCollab = purpose ? /tambay|group|collab|meeting/i.test(purpose) : false;
    return roomsWith.map((r) => {
      let score = 0;
      if (!r.currentReservation) score += 100;
      if (typeof groupSize === "number" && groupSize > 0) {
        const diff = Math.abs((r.capacity || 0) - groupSize);
        score += Math.max(0, 50 - diff);
      }
      const amenities = r.amenities || [];
      if (wantQuiet && amenities.some((a) => /Air Conditioning|Whiteboard|Smart TV/i.test(a))) score += 10;
      if (wantCollab && amenities.some((a) => /WiFi|Projector|Smart TV/i.test(a))) score += 10;
      return { room: r, score };
    }).sort((a, b) => b.score - a.score).slice(0, 10).map((x) => x.room);
  }
};
var storage = new DatabaseStorage();

// server/mailer.ts
import { format } from "date-fns";
var reminderTimers = /* @__PURE__ */ new Map();
function formatRoomDetails(details) {
  const prettyDate = format(new Date(details.date), "MMM dd, yyyy");
  return [
    `Room: ${details.room.name}`,
    `Building/Floor: ${details.room.building}, Floor ${details.room.floor}`,
    `Date: ${prettyDate}`,
    `Time: ${details.startTime} - ${details.endTime}`,
    details.purpose ? `Purpose: ${details.purpose}` : void 0
  ].filter(Boolean).join("\n");
}
async function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : void 0;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) {
    return null;
  }
  const dynamicImport = new Function("m", "return import(m)");
  const nodemailer = await dynamicImport("nodemailer");
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  return transport;
}
async function sendEmail(to, subject, text2) {
  const from = process.env.SMTP_FROM || "RoomReserve <no-reply@roomreserve.local>";
  const transport = await getTransport();
  if (!transport) {
    console.log("[mailer] (log-only) would send email:", { to, subject, text: text2 });
    return;
  }
  await transport.sendMail({ from, to, subject, text: text2 });
}
async function sendReservationConfirmationEmail(details) {
  const subject = "Room reserved!";
  const body = [
    "Room reserved! Please make sure to be in the room within 15-minutes of your scheduled time slot.",
    "",
    "[ROOM DETAILS]",
    formatRoomDetails(details)
  ].join("\n");
  await sendEmail(details.user.email, subject, body);
}
async function sendReservationReminderEmail(details) {
  const subject = "Reminder: Please confirm check-in";
  const body = [
    "Please confirm your successful check-in for your reserved room within 15 minutes of your given time slot on the RoomReservation Website.",
    "",
    "[ROOM DETAILS]",
    formatRoomDetails(details)
  ].join("\n");
  await sendEmail(details.user.email, subject, body);
}
function scheduleFiveMinuteReminder(details) {
  cancelReminder(details.id);
  const start = /* @__PURE__ */ new Date(`${details.date}T${details.startTime}:00`);
  const reminderAt = new Date(start.getTime() - 5 * 60 * 1e3);
  const delay = reminderAt.getTime() - Date.now();
  if (delay <= 0) {
    void sendReservationReminderEmail(details);
    return;
  }
  const timer = setTimeout(() => {
    void sendReservationReminderEmail(details);
    reminderTimers.delete(details.id);
  }, delay);
  reminderTimers.set(details.id, timer);
}
function cancelReminder(reservationId) {
  const t = reminderTimers.get(reservationId);
  if (t) {
    clearTimeout(t);
    reminderTimers.delete(reservationId);
  }
}
async function sendPasswordResetEmail(to, resetLink, firstName) {
  const subject = "Reset your RoomReserve password";
  const body = [
    `Hi ${firstName},`,
    "",
    "You requested to reset your password for your RoomReserve account.",
    "",
    "Click the link below to reset your password:",
    resetLink,
    "",
    "This link will expire in 1 hour.",
    "",
    "If you didn't request this, please ignore this email."
  ].join("\n");
  await sendEmail(to, subject, body);
}

// server/routes.ts
import { z as z2 } from "zod";
import crypto2 from "crypto";

// server/passwords.ts
import crypto from "crypto";
function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(derivedKey);
      }
    });
  });
}
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt);
  return `${salt}:${key.toString("hex")}`;
}
async function verifyPassword(password, stored) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = await scrypt(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), derived);
  } catch {
    return false;
  }
}

// server/routes.ts
var sessions = /* @__PURE__ */ new Map();
function sanitizeUser(user) {
  const { passwordHash, resetToken, resetTokenExpiresAt, ...safeUser } = user;
  return safeUser;
}
function createSessionForUser(user) {
  const sessionId = Math.random().toString(36).substring(2);
  sessions.set(sessionId, { userId: user.id, email: user.email });
  return sessionId;
}
async function registerRoutes(app2) {
  const getCurrentUser = (req) => {
    const sessionId = req.headers["x-session-id"];
    return sessionId ? sessions.get(sessionId) : null;
  };
  const signupSchema = z2.object({
    studentId: z2.string().regex(/^2\d{5}$/, "Student ID must be in format 2xxxxx (2 followed by 5 digits)"),
    firstName: z2.string().min(1, "First name is required"),
    lastName: z2.string().min(1, "Last name is required"),
    email: z2.string().email(),
    password: z2.string().min(8, "Password must be at least 8 characters")
  });
  const loginSchema = z2.object({
    studentId: z2.string().regex(/^2\d{5}$/, "Student ID must be in format 2xxxxx"),
    password: z2.string().min(8, "Password must be at least 8 characters")
  });
  const changePasswordSchema = z2.object({
    currentPassword: z2.string().min(8),
    newPassword: z2.string().min(8)
  });
  const forgotPasswordSchema = z2.object({
    email: z2.string().email()
  });
  const resetPasswordSchema = z2.object({
    token: z2.string().min(10),
    newPassword: z2.string().min(8)
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = signupSchema.parse(req.body);
      if (!parsed.email.endsWith("@student.ateneo.edu")) {
        return res.status(400).json({
          message: "Only @student.ateneo.edu email addresses are allowed"
        });
      }
      const existingEmail = await storage.getUserByEmail(parsed.email.toLowerCase());
      if (existingEmail) {
        return res.status(409).json({ message: "Email already registered" });
      }
      const existingStudentId = await storage.getUserByStudentId(parsed.studentId);
      if (existingStudentId) {
        return res.status(409).json({ message: "Student ID already registered" });
      }
      const passwordHash = await hashPassword(parsed.password);
      const user = await storage.createUser({
        email: parsed.email.toLowerCase(),
        studentId: parsed.studentId,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        name: `${parsed.firstName} ${parsed.lastName}`,
        passwordHash,
        isAdmin: false
      });
      const sessionId = createSessionForUser(user);
      res.status(201).json({ user: sanitizeUser(user), sessionId });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid signup data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { studentId, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByStudentId(studentId);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const sessionId = createSessionForUser(user);
      res.json({ user: sanitizeUser(user), sessionId });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid credentials", errors: error.errors });
      }
      res.status(400).json({ message: "Invalid request" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    const sessionId = req.headers["x-session-id"];
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out" });
  });
  app2.get("/api/auth/me", async (req, res) => {
    const session = getCurrentUser(req);
    if (!session) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(sanitizeUser(user));
  });
  app2.post("/api/auth/change-password", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const parsed = changePasswordSchema.parse(req.body);
      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const matches = await verifyPassword(parsed.currentPassword, user.passwordHash);
      if (!matches) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const newHash = await hashPassword(parsed.newPassword);
      await storage.updateUserPassword(user.id, newHash);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid password data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (user) {
        const token = crypto2.randomBytes(32).toString("hex");
        const tokenHash = crypto2.createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
        await storage.savePasswordResetToken(user.id, tokenHash, expiresAt);
        const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5e3}`;
        const resetLink = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
        await sendPasswordResetEmail(user.email, resetLink, user.firstName);
      }
      res.json({ message: "If an account exists for that email, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid email address", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const tokenHash = crypto2.createHash("sha256").update(token).digest("hex");
      const user = await storage.getUserByResetToken(tokenHash);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      const hash = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hash);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid reset data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.get("/api/rooms", async (req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const rooms2 = await storage.getRoomsWithStatus(currentDate, currentTime);
      const dedupedMap = /* @__PURE__ */ new Map();
      for (const r of rooms2) {
        const key = `${r.building}-${r.floor}-${r.name}`;
        if (!dedupedMap.has(key)) dedupedMap.set(key, r);
      }
      res.json(Array.from(dedupedMap.values()));
    } catch (error) {
      console.error("Get rooms error:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });
  app2.get("/api/rooms/:id", async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Get room error:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });
  app2.get("/api/rooms/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getRoomReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Get room reviews error:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.post("/api/rooms/:id/reviews", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) return res.status(401).json({ message: "Not authenticated" });
      const parsed = insertRoomReviewSchema.parse({
        ...req.body,
        roomId: req.params.id,
        userId: session.userId
      });
      const created = await storage.createRoomReview(parsed);
      res.status(201).json(created);
    } catch (error) {
      console.error("Create review error:", error);
      if (error instanceof z2.ZodError) return res.status(400).json({ message: "Invalid review", errors: error.errors });
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  app2.get("/api/hotspots", async (req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const currentDate = req.query.date || now.toISOString().split("T")[0];
      const currentTime = req.query.time || `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const data = await storage.getHotspots(currentDate, currentTime);
      res.json(data);
    } catch (error) {
      console.error("Get hotspots error:", error);
      res.status(500).json({ message: "Failed to fetch hotspots" });
    }
  });
  app2.get("/api/recommendations", async (req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const currentDate = req.query.date || now.toISOString().split("T")[0];
      const currentTime = req.query.time || `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const purpose = req.query.purpose || void 0;
      const groupSize = req.query.groupSize ? parseInt(req.query.groupSize, 10) : void 0;
      const rooms2 = await storage.getRecommendations(purpose, groupSize, currentDate, currentTime);
      res.json(rooms2);
    } catch (error) {
      console.error("Get recommendations error:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  app2.get("/api/rooms/:id/reservations", async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.query;
      if (!date || typeof date !== "string") {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      const reservations2 = await storage.getRoomReservations(id, date);
      res.json(reservations2);
    } catch (error) {
      console.error("Get room reservations error:", error);
      res.status(500).json({ message: "Failed to fetch room reservations" });
    }
  });
  app2.post("/api/reservations", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { userId, ...reservationData } = insertReservationSchema.parse({
        ...req.body,
        userId: session.userId
        // Add userId for validation
      });
      const activeReservationsToday = await storage.getActiveReservationCountForDate(
        session.userId,
        reservationData.date
      );
      if (activeReservationsToday >= 1) {
        return res.status(400).json({ message: "Maximum reservations reached for the day" });
      }
      const now = /* @__PURE__ */ new Date();
      const reservationDateTime = /* @__PURE__ */ new Date(`${reservationData.date}T${reservationData.startTime}:00`);
      const minBookingTime = new Date(now.getTime() + 30 * 60 * 1e3);
      if (reservationDateTime < minBookingTime) {
        return res.status(400).json({
          message: "Reservations must be made at least 30 minutes in advance"
        });
      }
      const hasConflict = await storage.checkForConflicts(
        reservationData.roomId,
        reservationData.date,
        reservationData.startTime,
        reservationData.endTime
      );
      if (hasConflict) {
        return res.status(409).json({
          message: "This time slot is already booked"
        });
      }
      const reservation = await storage.createReservation({
        ...reservationData,
        userId: session.userId
      });
      const withDetails = await storage.getReservationWithDetails(reservation.id);
      if (withDetails && withDetails.user && withDetails.room) {
        await sendReservationConfirmationEmail({
          id: withDetails.id,
          date: withDetails.date,
          startTime: withDetails.startTime,
          endTime: withDetails.endTime,
          purpose: withDetails.purpose,
          user: {
            id: withDetails.user.id,
            email: withDetails.user.email,
            name: withDetails.user.name
          },
          room: {
            id: withDetails.room.id,
            name: withDetails.room.name,
            building: withDetails.room.building,
            floor: withDetails.room.floor
          }
        });
        scheduleFiveMinuteReminder({
          id: withDetails.id,
          date: withDetails.date,
          startTime: withDetails.startTime,
          endTime: withDetails.endTime,
          purpose: withDetails.purpose,
          user: {
            id: withDetails.user.id,
            email: withDetails.user.email,
            name: withDetails.user.name
          },
          room: {
            id: withDetails.room.id,
            name: withDetails.room.name,
            building: withDetails.room.building,
            floor: withDetails.room.floor
          }
        });
      }
      res.status(201).json(reservation);
    } catch (error) {
      console.error("Create reservation error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reservation" });
    }
  });
  app2.get("/api/reservations/my", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const reservations2 = await storage.getUserReservations(session.userId);
      res.json(reservations2);
    } catch (error) {
      console.error("Get user reservations error:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });
  app2.post("/api/reservations/:id/checkin", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      if (reservation.userId !== session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      if (reservation.status !== "confirmed") {
        return res.status(400).json({ message: "Reservation cannot be checked in" });
      }
      const now = /* @__PURE__ */ new Date();
      if (reservation.checkInDeadline && now > reservation.checkInDeadline) {
        await storage.updateReservationStatus(req.params.id, "no_show");
        return res.status(400).json({
          message: "Check-in deadline has passed. Reservation marked as no-show."
        });
      }
      const updated = await storage.updateReservationStatus(
        req.params.id,
        "checked_in",
        now
      );
      cancelReminder(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });
  app2.delete("/api/reservations/:id", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      if (reservation.userId !== session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.updateReservationStatus(req.params.id, "cancelled");
      cancelReminder(req.params.id);
      res.json({ message: "Reservation cancelled successfully" });
    } catch (error) {
      console.error("Cancel reservation error:", error);
      res.status(500).json({ message: "Failed to cancel reservation" });
    }
  });
  app2.get("/api/admin/reservations", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUserByEmail(session.email);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const reservations2 = await storage.getAllReservationsWithDetails();
      res.json(reservations2);
    } catch (error) {
      console.error("Get all reservations error:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });
  app2.post("/api/admin/reservations/:id/resend", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUserByEmail(session.email);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const details = await storage.getReservationWithDetails(req.params.id);
      if (!details || !details.user || !details.room) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      await sendReservationConfirmationEmail({
        id: details.id,
        date: details.date,
        startTime: details.startTime,
        endTime: details.endTime,
        purpose: details.purpose,
        user: { id: details.user.id, email: details.user.email, name: details.user.name },
        room: { id: details.room.id, name: details.room.name, building: details.room.building, floor: details.room.floor }
      });
      scheduleFiveMinuteReminder({
        id: details.id,
        date: details.date,
        startTime: details.startTime,
        endTime: details.endTime,
        purpose: details.purpose,
        user: { id: details.user.id, email: details.user.email, name: details.user.name },
        room: { id: details.room.id, name: details.room.name, building: details.room.building, floor: details.room.floor }
      });
      res.json({ message: "Emails re-sent and reminder scheduled" });
    } catch (error) {
      console.error("Admin resend email error:", error);
      res.status(500).json({ message: "Failed to resend emails" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api")) {
      return next();
    }
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { config as config2 } from "dotenv";
config2();
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
