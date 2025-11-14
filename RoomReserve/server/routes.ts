import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  sendReservationConfirmationEmail,
  scheduleFiveMinuteReminder,
  cancelReminder,
} from "./mailer";
import { insertUserSchema, insertReservationSchema, insertRoomReviewSchema } from "@shared/schema";
import { z } from "zod";

// Simple session storage - in production, use proper session management
const sessions = new Map<string, { userId: string; email: string }>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to get current user
  const getCurrentUser = (req: any) => {
    const sessionId = req.headers["x-session-id"] as string;
    return sessionId ? sessions.get(sessionId) : null;
  };

  // Auth endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, name } = insertUserSchema.parse(req.body);

      // Validate Ateneo student email
      if (!email.endsWith("@student.ateneo.edu")) {
        return res.status(400).json({ 
          message: "Only @student.ateneo.edu email addresses are allowed" 
        });
      }

      // Get or create user
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({ email, name, isAdmin: false });
      }

      // Create session
      const sessionId = Math.random().toString(36).substring(7);
      sessions.set(sessionId, { userId: user.id, email: user.email });

      res.json({ user, sessionId });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string;
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", async (req, res) => {
    const session = getCurrentUser(req);
    if (!session) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUserByEmail(session.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  });

  // Room endpoints
  app.get("/api/rooms", async (req, res) => {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const rooms = await storage.getRoomsWithStatus(currentDate, currentTime);
      // Deduplicate by building+floor+name to avoid showing duplicates if DB has dupes
      const dedupedMap = new Map<string, typeof rooms[number]>();
      for (const r of rooms) {
        const key = `${r.building}-${r.floor}-${r.name}`;
        if (!dedupedMap.has(key)) dedupedMap.set(key, r);
      }
      res.json(Array.from(dedupedMap.values()));
    } catch (error) {
      console.error("Get rooms error:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.get("/api/rooms/:id", async (req, res) => {
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

  // Reviews endpoints
  app.get("/api/rooms/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getRoomReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Get room reviews error:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/rooms/:id/reviews", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) return res.status(401).json({ message: "Not authenticated" });

      const parsed = insertRoomReviewSchema.parse({
        ...req.body,
        roomId: req.params.id,
        userId: session.userId,
      });

      const created = await storage.createRoomReview(parsed);
      res.status(201).json(created);
    } catch (error) {
      console.error("Create review error:", error);
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid review", errors: error.errors });
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Hotspots
  app.get("/api/hotspots", async (req, res) => {
    try {
      const now = new Date();
      const currentDate = (req.query.date as string) || now.toISOString().split('T')[0];
      const currentTime = (req.query.time as string) || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const data = await storage.getHotspots(currentDate, currentTime);
      res.json(data);
    } catch (error) {
      console.error("Get hotspots error:", error);
      res.status(500).json({ message: "Failed to fetch hotspots" });
    }
  });

  // Recommendations
  app.get("/api/recommendations", async (req, res) => {
    try {
      const now = new Date();
      const currentDate = (req.query.date as string) || now.toISOString().split('T')[0];
      const currentTime = (req.query.time as string) || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const purpose = (req.query.purpose as string) || undefined;
      const groupSize = req.query.groupSize ? parseInt(req.query.groupSize as string, 10) : undefined;
      const rooms = await storage.getRecommendations(purpose, groupSize, currentDate, currentTime);
      res.json(rooms);
    } catch (error) {
      console.error("Get recommendations error:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/rooms/:id/reservations", async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const reservations = await storage.getRoomReservations(id, date);
      res.json(reservations);
    } catch (error) {
      console.error("Get room reservations error:", error);
      res.status(500).json({ message: "Failed to fetch room reservations" });
    }
  });

  // Reservation endpoints
  app.post("/api/reservations", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Parse request body without userId (it will be added from session)
      const { userId, ...reservationData } = insertReservationSchema.parse({
        ...req.body,
        userId: session.userId, // Add userId for validation
      });

      // Daily reservation limit (1 per day)
      const activeReservationsToday = await storage.getActiveReservationCountForDate(
        session.userId,
        reservationData.date
      );
      if (activeReservationsToday >= 1) {
        return res.status(400).json({ message: "Maximum reservations reached for the day" });
      }

      // Validate 30-minute advance booking
      const now = new Date();
      const reservationDateTime = new Date(`${reservationData.date}T${reservationData.startTime}:00`);
      const minBookingTime = new Date(now.getTime() + 30 * 60 * 1000);

      if (reservationDateTime < minBookingTime) {
        return res.status(400).json({ 
          message: "Reservations must be made at least 30 minutes in advance" 
        });
      }

      // Check for conflicts
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

      // Create reservation
      const reservation = await storage.createReservation({
        ...reservationData,
        userId: session.userId,
      });

      // Load details for email composition
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
            name: withDetails.user.name,
          },
          room: {
            id: withDetails.room.id,
            name: withDetails.room.name,
            building: withDetails.room.building,
            floor: withDetails.room.floor,
          },
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
            name: withDetails.user.name,
          },
          room: {
            id: withDetails.room.id,
            name: withDetails.room.name,
            building: withDetails.room.building,
            floor: withDetails.room.floor,
          },
        });
      }

      res.status(201).json(reservation);
    } catch (error) {
      console.error("Create reservation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reservation" });
    }
  });

  app.get("/api/reservations/my", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const reservations = await storage.getUserReservations(session.userId);
      res.json(reservations);
    } catch (error) {
      console.error("Get user reservations error:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  app.post("/api/reservations/:id/checkin", async (req, res) => {
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

      // Check if within check-in window
      const now = new Date();
      if (reservation.checkInDeadline && now > reservation.checkInDeadline) {
        // Mark as no-show
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

      // No further reminder needed after check-in
      cancelReminder(req.params.id);

      res.json(updated);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.delete("/api/reservations/:id", async (req, res) => {
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

  // Admin endpoints
  app.get("/api/admin/reservations", async (req, res) => {
    try {
      const session = getCurrentUser(req);
      if (!session) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUserByEmail(session.email);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const reservations = await storage.getAllReservationsWithDetails();
      res.json(reservations);
    } catch (error) {
      console.error("Get all reservations error:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Optional: resend emails for a reservation (admin only)
  app.post("/api/admin/reservations/:id/resend", async (req, res) => {
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
        room: { id: details.room.id, name: details.room.name, building: details.room.building, floor: details.room.floor },
      });

      scheduleFiveMinuteReminder({
        id: details.id,
        date: details.date,
        startTime: details.startTime,
        endTime: details.endTime,
        purpose: details.purpose,
        user: { id: details.user.id, email: details.user.email, name: details.user.name },
        room: { id: details.room.id, name: details.room.name, building: details.room.building, floor: details.room.floor },
      });

      res.json({ message: "Emails re-sent and reminder scheduled" });
    } catch (error) {
      console.error("Admin resend email error:", error);
      res.status(500).json({ message: "Failed to resend emails" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
