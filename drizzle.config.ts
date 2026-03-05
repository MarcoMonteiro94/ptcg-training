import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// Use DIRECT_URL for migrations if available, otherwise swap to transaction-mode pooler (port 6543)
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL!.replace(":5432/", ":6543/");

export default defineConfig({
  schema: "./src/server/db/schema/index.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  schemaFilter: ["public"],
  extensionsFilters: ["postgis"],
});
