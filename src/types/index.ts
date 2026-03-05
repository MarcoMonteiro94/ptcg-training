export type Format = "standard" | "expanded" | "unlimited";

export type MatchResult = "win" | "loss" | "draw";

export type TournamentTier = "major" | "international" | "regional" | "local" | "online";

export type ArchetypeTier = "S" | "A" | "B" | "C" | "D";

export type SyncStatus = "running" | "completed" | "failed";

export type CardSupertype = "Pokémon" | "Trainer" | "Energy";

export interface DeckCard {
  card_id: string;
  count: number;
}

export interface MetaSnapshotEntry {
  archetype_id: string;
  usage_rate: number;
  win_rate: number;
  justification?: string;
}

export interface MatchupCell {
  archetype_a_id: string;
  archetype_b_id: string;
  win_rate: number;
  total_games: number;
  confidence: number;
}
