import { db } from "./db";
import { rooms, users } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create an admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@student.ateneo.edu",
        name: "Admin User",
        isAdmin: true,
      })
      .onConflictDoNothing()
      .returning();

    console.log("✅ Admin user created:", adminUser?.email);

    // Create sample JGSOM rooms
    const sampleRooms = [
      {
        name: "Room 201",
        building: "JGSOM",
        floor: 2,
        capacity: 30,
        amenities: ["WiFi", "Projector", "Air Conditioning", "Whiteboard"],
      },
      {
        name: "Room 202",
        building: "JGSOM",
        floor: 2,
        capacity: 25,
        amenities: ["WiFi", "Air Conditioning", "Whiteboard"],
      },
      {
        name: "Room 301",
        building: "JGSOM",
        floor: 3,
        capacity: 40,
        amenities: ["WiFi", "Projector", "Air Conditioning", "Smart TV"],
      },
      {
        name: "Room 302",
        building: "JGSOM",
        floor: 3,
        capacity: 35,
        amenities: ["WiFi", "Air Conditioning", "Whiteboard"],
      },
      {
        name: "Room 303",
        building: "JGSOM",
        floor: 3,
        capacity: 20,
        amenities: ["WiFi", "Projector", "Air Conditioning"],
      },
      {
        name: "Room 401",
        building: "JGSOM",
        floor: 4,
        capacity: 50,
        amenities: ["WiFi", "Projector", "Air Conditioning", "Smart TV", "Video Conferencing"],
      },
      {
        name: "Room 402",
        building: "JGSOM",
        floor: 4,
        capacity: 30,
        amenities: ["WiFi", "Air Conditioning", "Whiteboard"],
      },
      {
        name: "Room 501",
        building: "JGSOM",
        floor: 5,
        capacity: 45,
        amenities: ["WiFi", "Projector", "Air Conditioning", "Smart TV"],
      },
      {
        name: "Room 502",
        building: "JGSOM",
        floor: 5,
        capacity: 25,
        amenities: ["WiFi", "Air Conditioning", "Whiteboard"],
      },
      {
        name: "Conference Room A",
        building: "JGSOM",
        floor: 1,
        capacity: 15,
        amenities: ["WiFi", "Video Conferencing", "Air Conditioning", "Smart TV"],
      },
      {
        name: "Conference Room B",
        building: "JGSOM",
        floor: 1,
        capacity: 12,
        amenities: ["WiFi", "Air Conditioning", "Whiteboard"],
      },
      {
        name: "Study Room 1",
        building: "JGSOM",
        floor: 2,
        capacity: 8,
        amenities: ["WiFi", "Air Conditioning", "Whiteboard"],
      },
    ];

    for (const room of sampleRooms) {
      await db
        .insert(rooms)
        .values(room)
        .onConflictDoNothing({ target: [rooms.building, rooms.floor, rooms.name] });
    }

    console.log(`✅ Created ${sampleRooms.length} sample rooms`);
    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
