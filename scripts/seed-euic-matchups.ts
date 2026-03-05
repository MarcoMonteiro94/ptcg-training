/**
 * Seeds additional matchup data from EUIC 2026 (tournament 0054).
 * EUIC had 4,010 players — the largest recent tournament with best sample sizes.
 *
 * This script UPSERTS matchup_stats, replacing lower-sample Seattle data
 * with higher-sample EUIC data where applicable.
 *
 * Run: npx tsx scripts/seed-euic-matchups.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { randomUUID } from "crypto";

const dbUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL!.replace(":5432/", ":6543/");
const sql = postgres(dbUrl);

interface MatchupSeed {
  archetypeA: string;
  archetypeB: string;
  wins: number;
  losses: number;
  draws: number;
}

/**
 * Normalize matchup so archetypeA < archetypeB alphabetically.
 * If swapped, flip wins/losses.
 */
function normalize(
  a: string,
  b: string,
  wins: number,
  losses: number,
  draws: number
): MatchupSeed {
  if (a <= b) return { archetypeA: a, archetypeB: b, wins, losses, draws };
  return { archetypeA: b, archetypeB: a, wins: losses, losses: wins, draws };
}

// ── EUIC 2026 Matchup Data ──────────────────────────────────────────────────
// Source: labs.limitlesstcg.com/0054/decks/{deck}/matchups
// All data from EUIC 2026 London (4,010 players)

const RAW_MATCHUPS: MatchupSeed[] = [
  // ── Grimmsnarl Froslass matchups ──
  ...([
    ["grimmsnarl-froslass", "dragapult-dusknoir", 181, 91, 38],
    ["grimmsnarl-froslass", "gholdengo-lunatone", 128, 86, 48],
    ["grimmsnarl-froslass", "charizard-noctowl", 74, 35, 31],
    ["grimmsnarl-froslass", "gardevoir-ex-sv", 133, 68, 30],
    ["grimmsnarl-froslass", "mega-absol-box", 27, 62, 16],
    ["grimmsnarl-froslass", "raging-bolt-ogerpon", 30, 26, 11],
    ["grimmsnarl-froslass", "n-zoroark", 16, 21, 11],
    ["grimmsnarl-froslass", "charizard-pidgeot", 27, 18, 6],
    ["grimmsnarl-froslass", "gardevoir-jellicent", 29, 28, 13],
    ["grimmsnarl-froslass", "dragapult-charizard", 16, 16, 7],
    ["grimmsnarl-froslass", "alakazam-dudunsparce", 12, 11, 3],
    ["grimmsnarl-froslass", "joltik-box", 9, 11, 3],
    ["grimmsnarl-froslass", "flareon-noctowl", 15, 8, 6],
    ["grimmsnarl-froslass", "ceruledge-ex", 10, 7, 3],
    ["grimmsnarl-froslass", "kangaskhan-bouffalant", 12, 6, 2],
    ["grimmsnarl-froslass", "crustle-dri", 9, 7, 2],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Raging Bolt Ogerpon matchups ──
  ...([
    ["raging-bolt-ogerpon", "dragapult-dusknoir", 107, 88, 13],
    ["raging-bolt-ogerpon", "gholdengo-lunatone", 67, 55, 14],
    ["raging-bolt-ogerpon", "charizard-noctowl", 52, 57, 5],
    ["raging-bolt-ogerpon", "gardevoir-ex-sv", 31, 64, 17],
    ["raging-bolt-ogerpon", "mega-absol-box", 29, 14, 3],
    ["raging-bolt-ogerpon", "n-zoroark", 17, 12, 3],
    ["raging-bolt-ogerpon", "charizard-pidgeot", 18, 10, 2],
    ["raging-bolt-ogerpon", "gardevoir-jellicent", 15, 14, 7],
    ["raging-bolt-ogerpon", "dragapult-charizard", 15, 12, 5],
    ["raging-bolt-ogerpon", "alakazam-dudunsparce", 11, 10, 3],
    ["raging-bolt-ogerpon", "joltik-box", 8, 6, 1],
    ["raging-bolt-ogerpon", "flareon-noctowl", 10, 7, 1],
    ["raging-bolt-ogerpon", "ceruledge-ex", 8, 3, 1],
    ["raging-bolt-ogerpon", "kangaskhan-bouffalant", 3, 5, 3],
    ["raging-bolt-ogerpon", "crustle-dri", 5, 3, 2],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── N's Zoroark matchups ──
  ...([
    ["n-zoroark", "dragapult-dusknoir", 52, 42, 17],
    ["n-zoroark", "gholdengo-lunatone", 43, 37, 12],
    ["n-zoroark", "charizard-noctowl", 36, 27, 13],
    ["n-zoroark", "gardevoir-ex-sv", 44, 27, 18],
    ["n-zoroark", "mega-absol-box", 10, 12, 6],
    ["n-zoroark", "charizard-pidgeot", 14, 9, 3],
    ["n-zoroark", "gardevoir-jellicent", 9, 8, 6],
    ["n-zoroark", "dragapult-charizard", 12, 8, 2],
    ["n-zoroark", "alakazam-dudunsparce", 3, 5, 1],
    ["n-zoroark", "joltik-box", 4, 3, 1],
    ["n-zoroark", "flareon-noctowl", 5, 4, 2],
    ["n-zoroark", "ceruledge-ex", 5, 3, 1],
    ["n-zoroark", "kangaskhan-bouffalant", 3, 6, 1],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Gardevoir Jellicent matchups ──
  ...([
    ["gardevoir-jellicent", "dragapult-dusknoir", 174, 116, 37],
    ["gardevoir-jellicent", "gholdengo-lunatone", 91, 67, 33],
    ["gardevoir-jellicent", "charizard-noctowl", 27, 57, 13],
    ["gardevoir-jellicent", "gardevoir-ex-sv", 54, 36, 18],
    ["gardevoir-jellicent", "mega-absol-box", 31, 54, 16],
    ["gardevoir-jellicent", "charizard-pidgeot", 27, 21, 5],
    ["gardevoir-jellicent", "dragapult-charizard", 17, 13, 5],
    ["gardevoir-jellicent", "alakazam-dudunsparce", 18, 6, 4],
    ["gardevoir-jellicent", "joltik-box", 8, 3, 3],
    ["gardevoir-jellicent", "flareon-noctowl", 11, 5, 3],
    ["gardevoir-jellicent", "ceruledge-ex", 11, 6, 4],
    ["gardevoir-jellicent", "kangaskhan-bouffalant", 7, 5, 2],
    ["gardevoir-jellicent", "crustle-dri", 6, 5, 1],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Charizard Pidgeot matchups ──
  ...([
    ["charizard-pidgeot", "dragapult-dusknoir", 88, 139, 39],
    ["charizard-pidgeot", "gholdengo-lunatone", 71, 59, 22],
    ["charizard-pidgeot", "charizard-noctowl", 30, 43, 10],
    ["charizard-pidgeot", "gardevoir-ex-sv", 29, 20, 7],
    ["charizard-pidgeot", "mega-absol-box", 28, 29, 13],
    ["charizard-pidgeot", "dragapult-charizard", 16, 17, 3],
    ["charizard-pidgeot", "alakazam-dudunsparce", 11, 10, 1],
    ["charizard-pidgeot", "joltik-box", 6, 5, 1],
    ["charizard-pidgeot", "flareon-noctowl", 8, 10, 1],
    ["charizard-pidgeot", "ceruledge-ex", 5, 8, 0],
    ["charizard-pidgeot", "kangaskhan-bouffalant", 5, 8, 4],
    ["charizard-pidgeot", "crustle-dri", 8, 5, 0],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Gardevoir (EUIC) matchups ──
  ...([
    ["gardevoir-ex-sv", "dragapult-dusknoir", 260, 128, 42],
    ["gardevoir-ex-sv", "gholdengo-lunatone", 211, 178, 96],
    ["gardevoir-ex-sv", "charizard-noctowl", 83, 77, 23],
    ["gardevoir-ex-sv", "mega-absol-box", 109, 93, 41],
    ["gardevoir-ex-sv", "charizard-pidgeot", 20, 29, 7],
    ["gardevoir-ex-sv", "dragapult-charizard", 43, 32, 11],
    ["gardevoir-ex-sv", "alakazam-dudunsparce", 38, 11, 10],
    ["gardevoir-ex-sv", "joltik-box", 20, 14, 3],
    ["gardevoir-ex-sv", "flareon-noctowl", 20, 12, 5],
    ["gardevoir-ex-sv", "ceruledge-ex", 22, 14, 10],
    ["gardevoir-ex-sv", "kangaskhan-bouffalant", 14, 13, 7],
    ["gardevoir-ex-sv", "crustle-dri", 17, 6, 4],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Charizard Noctowl (EUIC) matchups ──
  ...([
    ["charizard-noctowl", "dragapult-dusknoir", 105, 227, 38],
    ["charizard-noctowl", "gholdengo-lunatone", 167, 133, 22],
    ["charizard-noctowl", "mega-absol-box", 70, 79, 14],
    ["charizard-noctowl", "dragapult-charizard", 29, 31, 12],
    ["charizard-noctowl", "alakazam-dudunsparce", 25, 16, 3],
    ["charizard-noctowl", "joltik-box", 13, 14, 1],
    ["charizard-noctowl", "flareon-noctowl", 16, 9, 2],
    ["charizard-noctowl", "ceruledge-ex", 16, 10, 3],
    ["charizard-noctowl", "kangaskhan-bouffalant", 14, 7, 1],
    ["charizard-noctowl", "crustle-dri", 5, 13, 5],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Gholdengo Lunatone (EUIC) matchups ──
  ...([
    ["gholdengo-lunatone", "dragapult-dusknoir", 467, 373, 122],
    ["gholdengo-lunatone", "mega-absol-box", 137, 119, 55],
    ["gholdengo-lunatone", "charizard-pidgeot", 59, 71, 22],
    ["gholdengo-lunatone", "dragapult-charizard", 51, 46, 20],
    ["gholdengo-lunatone", "alakazam-dudunsparce", 43, 42, 15],
    ["gholdengo-lunatone", "joltik-box", 31, 29, 6],
    ["gholdengo-lunatone", "flareon-noctowl", 22, 19, 5],
    ["gholdengo-lunatone", "ceruledge-ex", 23, 25, 9],
    ["gholdengo-lunatone", "kangaskhan-bouffalant", 19, 19, 4],
    ["gholdengo-lunatone", "crustle-dri", 14, 20, 7],
    ["gholdengo-lunatone", "froslass-munkidori", 13, 14, 3],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Dragapult Charizard matchups ──
  ...([
    ["dragapult-charizard", "dragapult-dusknoir", 75, 85, 15],
    ["dragapult-charizard", "mega-absol-box", 14, 26, 10],
    ["dragapult-charizard", "alakazam-dudunsparce", 7, 8, 2],
    ["dragapult-charizard", "joltik-box", 5, 6, 0],
    ["dragapult-charizard", "flareon-noctowl", 8, 5, 0],
    ["dragapult-charizard", "ceruledge-ex", 7, 4, 2],
    ["dragapult-charizard", "kangaskhan-bouffalant", 4, 5, 2],
    ["dragapult-charizard", "crustle-dri", 3, 5, 1],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Alakazam Dudunsparce matchups ──
  ...([
    ["alakazam-dudunsparce", "dragapult-dusknoir", 38, 100, 27],
    ["alakazam-dudunsparce", "mega-absol-box", 14, 18, 3],
    ["alakazam-dudunsparce", "joltik-box", 5, 3, 0],
    ["alakazam-dudunsparce", "flareon-noctowl", 7, 3, 0],
    ["alakazam-dudunsparce", "ceruledge-ex", 8, 3, 1],
    ["alakazam-dudunsparce", "kangaskhan-bouffalant", 3, 4, 1],
    ["alakazam-dudunsparce", "crustle-dri", 1, 3, 0],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Joltik Box matchups ──
  ...([
    ["joltik-box", "dragapult-dusknoir", 21, 33, 0],
    ["joltik-box", "mega-absol-box", 7, 12, 0],
    ["joltik-box", "flareon-noctowl", 5, 2, 0],
    ["joltik-box", "ceruledge-ex", 3, 2, 0],
    ["joltik-box", "kangaskhan-bouffalant", 3, 2, 0],
    ["joltik-box", "crustle-dri", 2, 3, 0],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),

  // ── Flareon Noctowl matchups ──
  ...([
    ["flareon-noctowl", "dragapult-dusknoir", 26, 56, 6],
    ["flareon-noctowl", "mega-absol-box", 6, 11, 3],
    ["flareon-noctowl", "ceruledge-ex", 4, 3, 0],
    ["flareon-noctowl", "kangaskhan-bouffalant", 3, 4, 0],
    ["flareon-noctowl", "crustle-dri", 3, 2, 1],
  ] as [string, string, number, number, number][]).map(([a, b, w, l, d]) =>
    normalize(a, b, w, l, d)
  ),
];

// ── Deduplicate: keep the entry with the highest total_games ────────────────

function deduplicateMatchups(matchups: MatchupSeed[]): MatchupSeed[] {
  const map = new Map<string, MatchupSeed>();
  for (const m of matchups) {
    const key = `${m.archetypeA}|${m.archetypeB}`;
    const existing = map.get(key);
    const total = m.wins + m.losses + m.draws;
    const existingTotal = existing
      ? existing.wins + existing.losses + existing.draws
      : 0;
    if (!existing || total > existingTotal) {
      map.set(key, m);
    }
  }
  return Array.from(map.values());
}

const MATCHUPS = deduplicateMatchups(RAW_MATCHUPS);

// ── Seed function ───────────────────────────────────────────────────────────

async function seedMatchupStats() {
  console.log(`Upserting ${MATCHUPS.length} EUIC matchup stats...`);
  let upserted = 0;
  let skipped = 0;

  for (const m of MATCHUPS) {
    const total = m.wins + m.losses + m.draws;
    if (total < 5) {
      skipped++;
      continue;
    }

    const winRate = total > 0 ? m.wins / total : null;
    const confidence = Math.min(1.0, total / 100);
    const id = randomUUID();

    // Only upsert if this EUIC data has MORE games than existing data
    await sql`
      INSERT INTO matchup_stats (id, archetype_a_id, archetype_b_id, wins, losses, draws, total_games, win_rate, confidence, format, period, source, updated_at)
      VALUES (${id}, ${m.archetypeA}, ${m.archetypeB}, ${m.wins}, ${m.losses}, ${m.draws}, ${total}, ${winRate}, ${confidence}, 'standard', 'all-time', 'limitless', now())
      ON CONFLICT (archetype_a_id, archetype_b_id, format, period, source) DO UPDATE SET
        wins = CASE WHEN EXCLUDED.total_games > matchup_stats.total_games THEN EXCLUDED.wins ELSE matchup_stats.wins END,
        losses = CASE WHEN EXCLUDED.total_games > matchup_stats.total_games THEN EXCLUDED.losses ELSE matchup_stats.losses END,
        draws = CASE WHEN EXCLUDED.total_games > matchup_stats.total_games THEN EXCLUDED.draws ELSE matchup_stats.draws END,
        total_games = CASE WHEN EXCLUDED.total_games > matchup_stats.total_games THEN EXCLUDED.total_games ELSE matchup_stats.total_games END,
        win_rate = CASE WHEN EXCLUDED.total_games > matchup_stats.total_games THEN EXCLUDED.win_rate ELSE matchup_stats.win_rate END,
        confidence = CASE WHEN EXCLUDED.total_games > matchup_stats.total_games THEN EXCLUDED.confidence ELSE matchup_stats.confidence END,
        updated_at = now()
    `;
    upserted++;
  }

  console.log(`  ${upserted} matchup stats upserted (${skipped} skipped < 5 games)`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  try {
    console.log("=== EUIC 2026 Matchup Data Seed ===\n");
    await seedMatchupStats();

    // Show current state
    const [{ count }] = await sql`SELECT count(*) FROM matchup_stats WHERE format = 'standard'`;
    console.log(`\nTotal matchup stats in DB: ${count}`);

    console.log("\n=== Done! ===");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
