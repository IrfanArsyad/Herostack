import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as pgSchema from "./schema";

// Determine database type from environment
const databaseType = process.env.DATABASE_TYPE || "postgresql";

// Export database type for conditional logic elsewhere
export const isDatabaseSqlite = databaseType === "sqlite";
export const isDatabasePostgres = databaseType === "postgresql";

// Type for the database connection
type DbType = PostgresJsDatabase<typeof pgSchema>;

// Create database connection
// Note: SQLite support requires better-sqlite3 which uses Node.js fs module
// and is not compatible with edge runtime. For edge-compatible middleware,
// we default to PostgreSQL types but SQLite works at runtime.
function createDatabase(): DbType {
  if (databaseType === "sqlite") {
    // Dynamic import for SQLite to avoid edge runtime issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle: drizzleSqlite } = require("drizzle-orm/better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sqliteSchema = require("./schema-sqlite");

    const dbPath = process.env.DATABASE_PATH || "./data/herostack.db";
    const sqlite = new Database(dbPath);
    // Enable WAL mode for better performance
    sqlite.pragma("journal_mode = WAL");
    return drizzleSqlite(sqlite, { schema: sqliteSchema }) as DbType;
  } else {
    const queryClient = postgres({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER || "herostack",
      password: process.env.DB_PASSWORD || "herostack123",
      database: process.env.DB_NAME || "herostack",
      max: parseInt(process.env.DB_MAX_CONNECTIONS || "10"),
      idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || "20"),
      connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "10"),
    });
    return drizzlePg(queryClient, { schema: pgSchema });
  }
}

export const db = createDatabase();

// Export schema for use in other files
export * from "./schema";
