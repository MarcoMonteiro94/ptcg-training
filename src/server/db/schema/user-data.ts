import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  uuid,
  date,
  integer,
} from "drizzle-orm/pg-core";
import { archetypes } from "./game-data";

export const userTournaments = pgTable(
  "user_tournaments",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    date: date("date").notNull(),
    format: text("format")
      .$type<"standard" | "expanded" | "unlimited">()
      .default("standard")
      .notNull(),
    userArchetypeId: text("user_archetype_id").references(() => archetypes.id),
    totalRounds: integer("total_rounds"),
    placing: integer("placing"),
    playerCount: integer("player_count"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("user_tournaments_user_idx").on(table.userId),
    index("user_tournaments_date_idx").on(table.date),
  ]
);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  preferredFormat: text("preferred_format")
    .$type<"standard" | "expanded" | "unlimited">()
    .default("standard")
    .notNull(),
  activeDeckId: text("active_deck_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const matchLogs = pgTable(
  "match_logs",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    userArchetypeId: text("user_archetype_id").references(() => archetypes.id),
    opponentArchetypeId: text("opponent_archetype_id").references(() => archetypes.id),
    result: text("result").$type<"win" | "loss" | "draw">().notNull(),
    wentFirst: boolean("went_first"),
    format: text("format").$type<"standard" | "expanded" | "unlimited">().notNull(),
    notes: text("notes"),
    tags: jsonb("tags").$type<string[]>().default([]),
    userDecklistId: text("user_decklist_id"),
    userTournamentId: text("user_tournament_id").references(
      () => userTournaments.id,
      { onDelete: "set null" }
    ),
    roundNumber: integer("round_number"),
    playedAt: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("match_logs_user_idx").on(table.userId),
    index("match_logs_played_at_idx").on(table.playedAt),
    index("match_logs_user_archetype_idx").on(table.userArchetypeId),
    index("match_logs_opponent_archetype_idx").on(table.opponentArchetypeId),
    index("match_logs_tournament_idx").on(table.userTournamentId),
  ]
);

export const userDecklists = pgTable(
  "user_decklists",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    archetypeId: text("archetype_id").references(() => archetypes.id),
    format: text("format").$type<"standard" | "expanded" | "unlimited">().notNull(),
    cards: jsonb("cards").$type<Array<{ card_id: string; count: number }>>().notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("user_decklists_user_idx").on(table.userId),
    index("user_decklists_archetype_idx").on(table.archetypeId),
  ]
);

export const coachConversations = pgTable(
  "coach_conversations",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("coach_conversations_user_idx").on(table.userId)]
);

export const coachMessages = pgTable(
  "coach_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .references(() => coachConversations.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("coach_messages_conversation_idx").on(table.conversationId)]
);

// Training System

export interface TrainingPlanData {
  focus: string;
  weeklyGameTarget: number;
  priorityMatchups: Array<{ archetypeId: string; archetypeName: string; reason: string }>;
  studyTopics: string[];
  aiRationale: string;
  focusAreas?: string[];
  difficulty?: "casual" | "competitive" | "grinder";
}

export interface DailyGoalData {
  type:
    | "games"
    | "matchup_practice"
    | "study"
    | "review"
    | "mulligan_practice"
    | "prize_check"
    | "deck_knowledge"
    | "opening_sequence"
    | "custom";
  description: string;
  target?: number;
  matchupArchetypeId?: string;
  completed: boolean;
}

export interface TrainingPlanCompletionSummary {
  gamesPlayed: number;
  goalsCompleted: number;
  goalsTotal: number;
  winRate: number;
  matchupImprovements: Array<{
    archetypeId: string;
    archetypeName: string;
    before: number;
    after: number;
  }>;
  aiReview: string;
}

export const trainingPlans = pgTable(
  "training_plans",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    archetypeId: text("archetype_id").references(() => archetypes.id),
    weekStart: date("week_start").notNull(),
    weekEnd: date("week_end").notNull(),
    plan: jsonb("plan").$type<TrainingPlanData>().notNull(),
    status: text("status")
      .$type<"active" | "completed" | "abandoned">()
      .default("active")
      .notNull(),
    completionSummary: jsonb("completion_summary").$type<TrainingPlanCompletionSummary>(),
    focusAreas: jsonb("focus_areas").$type<string[]>(),
    difficulty: text("difficulty").$type<"casual" | "competitive" | "grinder">(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("training_plans_user_idx").on(table.userId),
    index("training_plans_status_idx").on(table.status),
  ]
);

export const trainingStreaks = pgTable(
  "training_streaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    currentStreak: integer("current_streak").default(0).notNull(),
    longestStreak: integer("longest_streak").default(0).notNull(),
    lastCompletedDate: date("last_completed_date"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("training_streaks_user_idx").on(table.userId),
  ]
);

export const dailyGoals = pgTable(
  "daily_goals",
  {
    id: text("id").primaryKey(),
    trainingPlanId: text("training_plan_id")
      .references(() => trainingPlans.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    goals: jsonb("goals").$type<DailyGoalData[]>().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("daily_goals_user_idx").on(table.userId),
    index("daily_goals_plan_idx").on(table.trainingPlanId),
    index("daily_goals_date_idx").on(table.date),
  ]
);
