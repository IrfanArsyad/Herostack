import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const queryClient = postgres({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "herostack",
  password: process.env.DB_PASSWORD || "herostack123",
  database: process.env.DB_NAME || "herostack",
});
const db = drizzle(queryClient, { schema });

async function createSuperadmin() {
  console.log("Creating default superadmin user...");

  try {
    // Check if superadmin already exists
    const existingSuperadmin = await db.query.users.findFirst({
      where: eq(schema.users.email, "superadmin@studiolab.id"),
    });

    if (existingSuperadmin) {
      console.log("Superadmin user already exists, skipping...");
      process.exit(0);
    }

    // Create superadmin
    const hashedPassword = await bcrypt.hash("superadmin123", 12);
    const [superadmin] = await db
      .insert(schema.users)
      .values({
        name: "Super Admin",
        email: "superadmin@studiolab.id",
        password: hashedPassword,
        role: "superadmin",
      })
      .returning();

    console.log("✓ Superadmin user created successfully!");
    console.log("");
    console.log("  Email:    superadmin@studiolab.id");
    console.log("  Password: superadmin123");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("Failed to create superadmin:", error);
    process.exit(1);
  }
}

createSuperadmin();
