import { config } from "dotenv";
config();

import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const raw = process.argv[2];

  if (!raw) {
    console.error("Usage: npx tsx server/delete-user.ts --studentId=255014 OR --email=foo@bar");
    process.exit(1);
  }

  let studentId: string | undefined;
  let email: string | undefined;

  if (raw.startsWith("--studentId=")) {
    studentId = raw.split("=")[1];
  } else if (raw.startsWith("--email=")) {
    email = raw.split("=")[1];
  } else {
    // allow plain studentId
    studentId = raw;
  }

  try {
    const whereClause = studentId ? eq(users.studentId, studentId) : eq(users.email, email!);

    // fetch the user first
    const existing = await db.select().from(users).where(whereClause);

    if (!existing || existing.length === 0) {
      console.log("No matching user found. Nothing to delete.");
      process.exit(0);
    }

    const user = existing[0];

    if (user.isAdmin) {
      console.error("Refusing to delete an admin user. Aborting.");
      process.exit(1);
    }

    // delete
    await db.delete(users).where(eq(users.id, user.id));

    console.log(`✅ Deleted user: id=${user.id} email=${user.email} studentId=${user.studentId}`);
    process.exit(0);
  } catch (err) {
    console.error("Error while deleting user:", err);
    process.exit(1);
  }
}

main();
