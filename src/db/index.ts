import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Create SQLite database connection
const sqlite = new Database(process.env.DATABASE_URL?.replace("file:", "") || "./dev.db");

// Create Drizzle ORM instance with schema
export const db = drizzle(sqlite, { schema });

// Export schema for convenience
export * from "./schema";
