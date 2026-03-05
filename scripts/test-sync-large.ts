/**
 * Sync a larger batch from Limitless (50 tournaments).
 * Run: npx tsx scripts/test-sync-large.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

if (process.env.DATABASE_URL?.includes(":5432")) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(":5432", ":6543");
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";
import {
  fetchTournaments,
  fetchStandings,
  fetchPairings,
} from "../src/server/services/limitless/client";
import type { LimitlessPairing } from "../src/server/services/limitless/schemas";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(client, { schema });
const { archetypes, tournaments, tournamentStandings, matchupStats } = schema;

async function main() {
  console.log("=== Large Limitless Sync ===\n");

  const allArchetypes = await db.select().from(archetypes);
  const archetypeByName = new Map(allArchetypes.map((a) => [a.name.toLowerCase(), a.id]));
  console.log(`${allArchetypes.length} archetypes loaded`);

  const tournamentList = await fetchTournaments("standard", 50);
  // Filter to tournaments with 20+ players for meaningful data
  const meaningful = tournamentList.filter((t) => (t.players ?? 0) >= 20);
  console.log(`${tournamentList.length} total tournaments, ${meaningful.length} with 20+ players\n`);

  let imported = 0;
  let skipped = 0;
  let totalStandings = 0;
  let totalMatchups = 0;

  for (const t of meaningful) {
    const existing = await db.select({ id: tournaments.id }).from(tournaments).where(eq(tournaments.id, t.id)).limit(1);
    if (existing.length > 0) { skipped++; continue; }

    const format = (t.format?.toLowerCase() ?? "standard") as "standard" | "expanded" | "unlimited";

    await db.insert(tournaments).values({
      id: t.id, name: t.name, date: new Date(t.date), format, tier: "regional",
      playerCount: t.players ?? null, sourceUrl: `https://play.limitlesstcg.com/tournament/${t.id}`,
    });

    const standings = await fetchStandings(t.id);
    const playerDeckMap = new Map<string, string | null>();

    for (const s of standings) {
      let archetypeId: string | null = null;
      if (s.deck && s.deck.name !== "Other") {
        const lower = s.deck.name.toLowerCase();
        if (archetypeByName.has(lower)) {
          archetypeId = archetypeByName.get(lower)!;
        } else {
          const slug = s.deck.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const id = s.deck.id ?? slug;
          await db.insert(archetypes).values({ id, name: s.deck.name, slug, identifierCards: [s.deck.name], tier: "D", format: "standard" }).onConflictDoNothing();
          archetypeByName.set(lower, id);
          archetypeId = id;
        }
      }
      playerDeckMap.set(s.player, archetypeId);

      await db.insert(tournamentStandings).values({
        id: randomUUID(), tournamentId: t.id, playerName: s.name, placing: s.placing ?? 0,
        record: s.record ? `${s.record.wins}-${s.record.losses}-${s.record.ties}` : null, archetypeId,
      });
      totalStandings++;
    }

    const pairings = await fetchPairings(t.id);
    const matchupResults = calculateMatchups(pairings, playerDeckMap);

    for (const [key, result] of matchupResults.entries()) {
      const [archetypeAId, archetypeBId] = key.split(":::");
      const total = result.wins + result.losses + result.draws;
      await db.insert(matchupStats).values({
        id: randomUUID(), archetypeAId, archetypeBId,
        wins: result.wins, losses: result.losses, draws: result.draws, totalGames: total,
        winRate: total > 0 ? result.wins / total : null, confidence: Math.min(1.0, total / 100),
        format, period: "all-time", source: "limitless",
      }).onConflictDoUpdate({
        target: [matchupStats.archetypeAId, matchupStats.archetypeBId, matchupStats.format, matchupStats.period, matchupStats.source],
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

    imported++;
    console.log(`[${imported}/${meaningful.length}] ${t.name} — ${standings.length} standings, ${matchupResults.size} matchups`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Imported: ${imported}, Skipped: ${skipped}`);
  console.log(`Standings: ${totalStandings}, Matchup updates: ${totalMatchups}`);
  console.log(`Total archetypes: ${archetypeByName.size}`);

  // Show top matchups by sample size
  const topMatchups = await db
    .select()
    .from(matchupStats)
    .where(eq(matchupStats.source, "limitless"))
    .orderBy(sql`total_games DESC`)
    .limit(15);

  console.log(`\nTop matchups by sample size:`);
  for (const m of topMatchups) {
    const archA = allArchetypes.find(a => a.id === m.archetypeAId)?.name ?? m.archetypeAId;
    const archB = allArchetypes.find(a => a.id === m.archetypeBId)?.name ?? m.archetypeBId;
    console.log(`  ${archA} vs ${archB}: ${m.wins}W-${m.losses}L-${m.draws}D (${((m.winRate ?? 0) * 100).toFixed(1)}% WR, n=${m.totalGames})`);
  }

  await client.end();
  process.exit(0);
}

function calculateMatchups(pairings: LimitlessPairing[], playerDeckMap: Map<string, string | null>) {
  const results = new Map<string, { wins: number; losses: number; draws: number }>();
  for (const p of pairings) {
    if (!p.player2) continue;
    const deckA = playerDeckMap.get(p.player1);
    const deckB = playerDeckMap.get(p.player2);
    if (!deckA || !deckB || deckA === deckB) continue;
    const [first, second] = deckA < deckB ? [deckA, deckB] : [deckB, deckA];
    const key = `${first}:::${second}`;
    const current = results.get(key) ?? { wins: 0, losses: 0, draws: 0 };
    if (p.winner === null || p.winner === 0) { current.draws++; }
    else {
      const winnerStr = String(p.winner);
      if (winnerStr === p.player1) {
        if (playerDeckMap.get(p.player1) === first) current.wins++; else current.losses++;
      } else {
        if (playerDeckMap.get(p.player2) === first) current.wins++; else current.losses++;
      }
    }
    results.set(key, current);
  }
  return results;
}

main().catch((err) => { console.error("Failed:", err); client.end(); process.exit(1); });
