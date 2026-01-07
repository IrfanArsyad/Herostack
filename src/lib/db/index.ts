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
    const connectionString = process.env.DATABASE_URL!;
    const queryClient = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    return drizzlePg(queryClient, { schema: pgSchema });
  }
}

export const db = createDatabase();

// Export schema for use in other files
export * from "./schema";
