import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "checked_in",
  "cancelled",
  "no_show"
]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Rooms table
export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  building: text("building").notNull().default("JGSOM"),
  floor: integer("floor").notNull(),
  capacity: integer("capacity").notNull(),
  amenities: text("amenities").array().notNull().default(sql`ARRAY[]::text[]`),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
});

// Reservations table
export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roomId: varchar("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // ISO date string YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  purpose: text("purpose"),
  status: reservationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  checkInDeadline: timestamp("check_in_deadline"), // 15 minutes after start time
  checkedInAt: timestamp("checked_in_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reservations: many(reservations),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  reservations: many(reservations),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [reservations.roomId],
    references: [rooms.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
  checkInDeadline: true,
  checkedInAt: true,
  status: true,
}).extend({
  // Add validation for time format and advance booking
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

// Select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectRoomSchema = createSelectSchema(rooms);
export const selectReservationSchema = createSelectSchema(reservations);

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

// Extended types for API responses with relations
export type ReservationWithDetails = Reservation & {
  user: User;
  room: Room;
};

export type RoomWithCurrentStatus = Room & {
  currentReservation?: Reservation;
  nextAvailableTime?: string;
};
