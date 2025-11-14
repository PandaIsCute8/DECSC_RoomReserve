import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./passwords";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2] || "admin@student.ateneo.edu";
  const newPassword = process.argv[3] || "AdminPass123";

  console.log(`Updating password for ${email} to '${newPassword}' (hashing before storing)...`);

  try {
    const newHash = await hashPassword(newPassword);

    await db.update(users).set({ passwordHash: newHash }).where(eq(users.email, email));

    console.log("✅ Password updated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to update password:", err);
    process.exit(1);
  }
}

main();
