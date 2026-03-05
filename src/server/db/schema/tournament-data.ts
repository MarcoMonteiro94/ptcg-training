import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { archetypes } from "./game-data";

export const tournaments = pgTable(
  "tournaments",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    format: text("format").$type<"standard" | "expanded" | "unlimited">().notNull(),
    tier: text("tier").$type<"major" | "international" | "regional" | "local" | "online">().notNull(),
    playerCount: integer("player_count"),
    rounds: integer("rounds"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tournaments_date_idx").on(table.date),
    index("tournaments_format_idx").on(table.format),
  ]
);

export const tournamentStandings = pgTable(
  "tournament_standings",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id")
      .references(() => tournaments.id, { onDelete: "cascade" })
      .notNull(),
    playerName: text("player_name").notNull(),
    placing: integer("placing").notNull(),
    record: text("record"),
    archetypeId: text("archetype_id").references(() => archetypes.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("standings_tournament_idx").on(table.tournamentId),
    index("standings_archetype_idx").on(table.archetypeId),
    index("standings_placing_idx").on(table.placing),
  ]
);

export const decklists = pgTable(
  "decklists",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id")
      .references(() => tournaments.id, { onDelete: "cascade" })
      .notNull(),
    standingId: text("standing_id")
      .references(() => tournamentStandings.id, { onDelete: "cascade" }),
    archetypeId: text("archetype_id").references(() => archetypes.id),
    cards: jsonb("cards").$type<Array<{ card_id: string; count: number }>>().notNull(),
    playerName: text("player_name"),
    placing: integer("placing"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("decklists_tournament_idx").on(table.tournamentId),
    index("decklists_archetype_idx").on(table.archetypeId),
  ]
);
