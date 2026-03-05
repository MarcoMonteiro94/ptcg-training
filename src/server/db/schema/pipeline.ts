import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const syncLogs = pgTable(
  "sync_logs",
  {
    id: text("id").primaryKey(),
    source: text("source").$type<"limitless" | "trainerhill" | "aggregation">().notNull(),
    status: text("status").$type<"running" | "completed" | "failed">().notNull(),
    recordsProcessed: integer("records_processed").default(0),
    errors: jsonb("errors").$type<Array<{ message: string; context?: string }>>(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("sync_logs_source_idx").on(table.source),
    index("sync_logs_status_idx").on(table.status),
    index("sync_logs_started_at_idx").on(table.startedAt),
  ]
);
