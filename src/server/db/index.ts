import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use transaction-mode pooler (port 6543) for server-side queries.
// Session-mode (5432) has limited connections and saturates easily.
const connectionString = process.env.DATABASE_URL!.replace(":5432/", ":6543/");

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export type Database = typeof db;
