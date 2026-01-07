import { defineConfig } from "drizzle-kit";

// PostgreSQL configuration (default)
// For SQLite, use: bunx drizzle-kit push --config drizzle.config.sqlite.ts
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "herostack",
    password: process.env.DB_PASSWORD || "herostack123",
    database: process.env.DB_NAME || "herostack",
  },
});
