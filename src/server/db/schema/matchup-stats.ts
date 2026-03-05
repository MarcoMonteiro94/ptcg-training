import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { archetypes } from "./game-data";

export const matchupStats = pgTable(
  "matchup_stats",
  {
    id: text("id").primaryKey(),
    archetypeAId: text("archetype_a_id")
      .references(() => archetypes.id)
      .notNull(),
    archetypeBId: text("archetype_b_id")
      .references(() => archetypes.id)
      .notNull(),
    wins: integer("wins").default(0).notNull(),
    losses: integer("losses").default(0).notNull(),
    draws: integer("draws").default(0).notNull(),
    totalGames: integer("total_games").default(0).notNull(),
    winRate: real("win_rate"),
    confidence: real("confidence"),
    format: text("format").$type<"standard" | "expanded" | "unlimited">().notNull(),
    period: text("period").notNull(),
    source: text("source").$type<"limitless" | "trainerhill" | "aggregated">().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("matchup_pair_period_idx").on(
      table.archetypeAId,
      table.archetypeBId,
      table.format,
      table.period,
      table.source
    ),
    index("matchup_archetype_a_idx").on(table.archetypeAId),
    index("matchup_archetype_b_idx").on(table.archetypeBId),
  ]
);

export const metaSnapshots = pgTable(
  "meta_snapshots",
  {
    id: text("id").primaryKey(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    format: text("format").$type<"standard" | "expanded" | "unlimited">().notNull(),
    data: jsonb("data")
      .$type<
        Array<{
          archetype_id: string;
          usage_rate: number;
          win_rate: number;
          tier: string;
          justification?: string;
        }>
      >()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("meta_snapshots_date_idx").on(table.date),
    index("meta_snapshots_format_idx").on(table.format),
  ]
);
