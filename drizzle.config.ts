import { defineConfig } from "drizzle-kit";

// PostgreSQL configuration (default)
// For SQLite, use: bunx drizzle-kit push --config drizzle.config.sqlite.ts
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
