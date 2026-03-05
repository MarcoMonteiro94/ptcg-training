/**
 * Test the sync-limitless cron locally.
 * Uses transaction pooler to avoid session pool exhaustion.
 *
 * Run: npx tsx scripts/test-sync.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

// Override DATABASE_URL to use transaction pooler if on session pooler
if (process.env.DATABASE_URL?.includes(":5432")) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(":5432", ":6543");
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(client, { schema });
const {
  archetypes,
  tournaments,
  tournamentStandings,
  matchupStats,
} = schema;
import {
  fetchTournaments,
  fetchStandings,
  fetchPairings,
} from "../src/server/services/limitless/client";
import type { LimitlessPairing } from "../src/server/services/limitless/schemas";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

async function main() {
  console.log("=== Testing Limitless Sync ===\n");

  // Load archetypes
  const allArchetypes = await db.select().from(archetypes);
  const archetypeByName = new Map(
    allArchetypes.map((a) => [a.name.toLowerCase(), a.id])
  );
  console.log(`Loaded ${allArchetypes.length} archetypes\n`);

  // Fetch tournaments (just 5 for testing)
  const tournamentList = await fetchTournaments("standard", 5);
  console.log(`Found ${tournamentList.length} tournaments\n`);

  let totalStandings = 0;
  let totalMatchups = 0;

  for (const t of tournamentList) {
    // Skip small tournaments for meaningful data
    if ((t.players ?? 0) < 10) {
      console.log(`Skipping ${t.name} (${t.players ?? 0} players)`);
      continue;
    }

    // Check if already imported
    const existing = await db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.id, t.id))
      .limit(1);

    if (existing.length > 0) {
      console.log(`Already imported: ${t.name}`);
      continue;
    }

    console.log(`\nSyncing: ${t.name} (${t.players ?? "?"} players)`);

    const format = (t.format?.toLowerCase() ?? "standard") as "standard" | "expanded" | "unlimited";

    // Insert tournament
    await db.insert(tournaments).values({
      id: t.id,
      name: t.name,
      date: new Date(t.date),
      format,
      tier: "regional",
      playerCount: t.players ?? null,
      sourceUrl: `https://play.limitlesstcg.com/tournament/${t.id}`,
    });

    // Fetch and insert standings
    const standings = await fetchStandings(t.id);
    const playerDeckMap = new Map<string, string | null>();

    for (const s of standings) {
      let archetypeId: string | null = null;

      if (s.deck && s.deck.name !== "Other") {
        const lower = s.deck.name.toLowerCase();
        if (archetypeByName.has(lower)) {
          archetypeId = archetypeByName.get(lower)!;
        } else {
          // Auto-create
          const slug = s.deck.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const id = s.deck.id ?? slug;
          await db.insert(archetypes).values({
            id,
            name: s.deck.name,
            slug,
            identifierCards: [s.deck.name],
            tier: "D",
            format: "standard",
          }).onConflictDoNothing();
          archetypeByName.set(lower, id);
          archetypeId = id;
        }
      }

      playerDeckMap.set(s.player, archetypeId);

      const record = s.record
        ? `${s.record.wins}-${s.record.losses}-${s.record.ties}`
        : null;

      await db.insert(tournamentStandings).values({
        id: randomUUID(),
        tournamentId: t.id,
        playerName: s.name,
        placing: s.placing ?? 0,
        record,
        archetypeId,
      });
      totalStandings++;
    }

    console.log(`  Standings: ${standings.length} (${standings.filter(s => s.deck).length} with decks)`);

    // Fetch pairings and calculate matchups
    const pairings = await fetchPairings(t.id);
    const matchupResults = calculateMatchups(pairings, playerDeckMap);

    for (const [key, result] of matchupResults.entries()) {
      const [archetypeAId, archetypeBId] = key.split(":::");
      const total = result.wins + result.losses + result.draws;

      await db
        .insert(matchupStats)
        .values({
          id: randomUUID(),
          archetypeAId,
          archetypeBId,
          wins: result.wins,
          losses: result.losses,
          draws: result.draws,
          totalGames: total,
          winRate: total > 0 ? result.wins / total : null,
          confidence: Math.min(1.0, total / 100),
          format,
          period: "all-time",
          source: "limitless",
        })
        .onConflictDoUpdate({
          target: [
            matchupStats.archetypeAId,
            matchupStats.archetypeBId,
            matchupStats.format,
            matchupStats.period,
            matchupStats.source,
          ],
          set: {
            wins: sql`${matchupStats.wins} + ${result.wins}`,
            losses: sql`${matchupStats.losses} + ${result.losses}`,
            draws: sql`${matchupStats.draws} + ${result.draws}`,
            totalGames: sql`${matchupStats.totalGames} + ${total}`,
            winRate: sql`(${matchupStats.wins} + ${result.wins})::real / NULLIF(${matchupStats.totalGames} + ${total}, 0)`,
            confidence: sql`LEAST(1.0, (${matchupStats.totalGames} + ${total})::real / 100.0)`,
            updatedAt: new Date(),
          },
        });
      totalMatchups++;
    }

    console.log(`  Pairings: ${pairings.length}, Matchup pairs: ${matchupResults.size}`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Standings imported: ${totalStandings}`);
  console.log(`Matchup pairs updated: ${totalMatchups}`);

  // Show some results
  const dbMatchups = await db
    .select()
    .from(matchupStats)
    .where(eq(matchupStats.source, "limitless"))
    .limit(10);

  console.log(`\nSample matchup stats in DB (${dbMatchups.length}):`);
  for (const m of dbMatchups) {
    console.log(`  ${m.archetypeAId} vs ${m.archetypeBId}: ${m.wins}W-${m.losses}L-${m.draws}D (${m.winRate?.toFixed(2) ?? "N/A"} WR, n=${m.totalGames})`);
  }

  console.log("\nDone!");
  process.exit(0);
}

function calculateMatchups(
  pairings: LimitlessPairing[],
  playerDeckMap: Map<string, string | null>
): Map<string, { wins: number; losses: number; draws: number }> {
  const results = new Map<string, { wins: number; losses: number; draws: number }>();

  for (const p of pairings) {
    if (!p.player2) continue;

    const deckA = playerDeckMap.get(p.player1);
    const deckB = playerDeckMap.get(p.player2);
    if (!deckA || !deckB || deckA === deckB) continue;

    const [first, second] = deckA < deckB ? [deckA, deckB] : [deckB, deckA];
    const key = `${first}:::${second}`;
    const current = results.get(key) ?? { wins: 0, losses: 0, draws: 0 };

    if (p.winner === null || p.winner === 0) {
      current.draws++;
    } else {
      const winnerStr = String(p.winner);
      if (winnerStr === p.player1) {
        const p1Deck = playerDeckMap.get(p.player1);
        if (p1Deck === first) current.wins++;
        else current.losses++;
      } else {
        const p2Deck = playerDeckMap.get(p.player2);
        if (p2Deck === first) current.wins++;
        else current.losses++;
      }
    }

    results.set(key, current);
  }

  return results;
}

main().catch((err) => {
  console.error("Sync test failed:", err);
  process.exit(1);
});
