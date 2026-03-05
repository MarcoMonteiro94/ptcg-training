import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const pokemonSets = pgTable("pokemon_sets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  series: text("series"),
  printedTotal: integer("printed_total"),
  regulationMark: varchar("regulation_mark", { length: 2 }),
  releaseDate: text("release_date"),
  format: text("format").$type<"standard" | "expanded" | "unlimited">(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cards = pgTable(
  "cards",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    supertype: text("supertype").$type<"Pokémon" | "Trainer" | "Energy">().notNull(),
    subtypes: jsonb("subtypes").$type<string[]>(),
    types: jsonb("types").$type<string[]>(),
    hp: integer("hp"),
    setId: text("set_id").references(() => pokemonSets.id),
    number: text("number"),
    regulationMark: varchar("regulation_mark", { length: 2 }),
    imageSmall: text("image_small"),
    imageLarge: text("image_large"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("cards_set_id_idx").on(table.setId),
    index("cards_name_idx").on(table.name),
    index("cards_supertype_idx").on(table.supertype),
  ]
);

export const archetypes = pgTable(
  "archetypes",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    identifierCards: jsonb("identifier_cards").$type<string[]>().notNull(),
    tier: text("tier").$type<"S" | "A" | "B" | "C" | "D">(),
    format: text("format").$type<"standard" | "expanded" | "unlimited">().notNull(),
    iconUrl: text("icon_url"),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("archetypes_format_idx").on(table.format),
    index("archetypes_tier_idx").on(table.tier),
    index("archetypes_slug_idx").on(table.slug),
  ]
);
