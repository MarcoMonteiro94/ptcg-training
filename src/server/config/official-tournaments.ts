import type { TournamentTier } from "@/types";

export interface OfficialTournament {
  limitlessId: string;
  name: string;
  tier: TournamentTier;
  date: string; // YYYY-MM-DD
}

/**
 * Curated list of official Pokemon TCG tournaments.
 * IDs are hex IDs from Limitless TCG (play.limitlesstcg.com).
 * Only Regionals, Internationals, and Worlds are included.
 *
 * To discover new IDs, run: npm run tournament:discover
 */
export const OFFICIAL_TOURNAMENTS: OfficialTournament[] = [
  // 2026 Season — Scraped from limitlesstcg.com (official events not in API)
  { limitlessId: "regional-santiago-2026", name: "Regional Santiago 2026", tier: "regional", date: "2026-02-07" },
  { limitlessId: "euic-2026", name: "EUIC 2026, London", tier: "international", date: "2026-02-13" },
  { limitlessId: "regional-seattle-2026", name: "Regional Seattle, WA 2026", tier: "regional", date: "2026-02-28" },
];

/** Number of days to consider a tournament "active" for syncing */
export const TOURNAMENT_WINDOW_DAYS = 60;

/**
 * Returns tournament IDs within the active window (last N days).
 * If no tournaments fall within the window, returns the most recent ones.
 */
export function getActiveTournamentIds(): OfficialTournament[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TOURNAMENT_WINDOW_DAYS);

  const active = OFFICIAL_TOURNAMENTS.filter(
    (t) => new Date(t.date) >= cutoff
  );

  if (active.length > 0) return active;

  // Fallback: return the 3 most recent tournaments
  return [...OFFICIAL_TOURNAMENTS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
}
