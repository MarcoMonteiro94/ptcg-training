import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  syncLogs,
  tournaments,
  tournamentStandings,
  archetypes,
  matchupStats,
} from "@/server/db/schema";
import {
  fetchTournamentById,
  fetchStandings,
  fetchPairings,
} from "@/server/services/limitless";
import type { LimitlessPairing } from "@/server/services/limitless";
import { getActiveTournamentIds } from "@/server/config/official-tournaments";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const syncId = randomUUID();
  const errors: Array<{ message: string; context?: string }> = [];
  let recordsProcessed = 0;

  await db.insert(syncLogs).values({
    id: syncId,
    source: "limitless",
    status: "running",
    recordsProcessed: 0,
  });

  try {
    const officialTournaments = getActiveTournamentIds();

    // Load archetypes for deck name matching
    const allArchetypes = await db.select().from(archetypes);
    const archetypeByName = new Map(
      allArchetypes.map((a) => [a.name.toLowerCase(), a.id])
    );

    for (const officialT of officialTournaments) {
      try {
        // Skip already-imported tournaments
        const existing = await db
          .select({ id: tournaments.id })
          .from(tournaments)
          .where(eq(tournaments.id, officialT.limitlessId))
          .limit(1);

        if (existing.length > 0) continue;

        // Fetch tournament data from Limitless API
        const t = await fetchTournamentById(officialT.limitlessId);
        if (!t) {
          errors.push({
            message: `Tournament not found on Limitless`,
            context: `tournament: ${officialT.limitlessId} (${officialT.name})`,
          });
          continue;
        }

        // Determine format
        const format = (t.format?.toLowerCase() ?? "standard") as
          | "standard"
          | "expanded"
          | "unlimited";

        // Insert tournament with tier from config
        await db.insert(tournaments).values({
          id: t.id,
          name: t.name,
          date: new Date(t.date),
          format,
          tier: officialT.tier,
          playerCount: t.players ?? null,
          sourceUrl: `https://play.limitlesstcg.com/tournament/${t.id}`,
        });

        // Fetch standings for this tournament
        const standings = await fetchStandings(t.id);

        // Map player ID -> standing data (for pairing resolution)
        const playerDeckMap = new Map<string, string | null>();

        for (const standing of standings) {
          // Resolve archetype from Limitless deck name
          const archetypeId = standing.deck
            ? await resolveArchetypeId(standing.deck.name, standing.deck.id, archetypeByName)
            : null;

          // Track player -> archetype for pairings
          playerDeckMap.set(standing.player, archetypeId);

          const record = standing.record
            ? `${standing.record.wins}-${standing.record.losses}-${standing.record.ties}`
            : null;

          await db.insert(tournamentStandings).values({
            id: randomUUID(),
            tournamentId: t.id,
            playerName: standing.name,
            placing: standing.placing ?? 0,
            record,
            archetypeId,
          });
          recordsProcessed++;
        }

        // Fetch pairings and calculate matchup data
        const pairings = await fetchPairings(t.id);
        const matchupResults = calculateMatchups(pairings, playerDeckMap);

        // Upsert matchup stats
        for (const [key, result] of matchupResults.entries()) {
          const [archetypeAId, archetypeBId] = key.split(":::");
          await db
            .insert(matchupStats)
            .values({
              id: randomUUID(),
              archetypeAId,
              archetypeBId,
              wins: result.wins,
              losses: result.losses,
              draws: result.draws,
              totalGames: result.wins + result.losses + result.draws,
              winRate:
                result.wins + result.losses + result.draws > 0
                  ? result.wins / (result.wins + result.losses + result.draws)
                  : null,
              confidence: calculateConfidence(
                result.wins + result.losses + result.draws
              ),
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
                totalGames: sql`${matchupStats.totalGames} + ${result.wins + result.losses + result.draws}`,
                winRate: sql`(${matchupStats.wins} + ${result.wins})::real / NULLIF(${matchupStats.totalGames} + ${result.wins + result.losses + result.draws}, 0)`,
                confidence: sql`LEAST(1.0, (${matchupStats.totalGames} + ${result.wins + result.losses + result.draws})::real / 100.0)`,
                updatedAt: new Date(),
              },
            });
        }

        recordsProcessed += matchupResults.size;
      } catch (err) {
        errors.push({
          message: err instanceof Error ? err.message : "Unknown error",
          context: `tournament: ${officialT.limitlessId}`,
        });
      }
    }

    await db
      .update(syncLogs)
      .set({
        status: "completed",
        recordsProcessed,
        errors: errors.length > 0 ? errors : null,
        completedAt: new Date(),
        metadata: {
          tournamentsScanned: officialTournaments.length,
          archetypesAvailable: allArchetypes.length,
          officialOnly: true,
        },
      })
      .where(eq(syncLogs.id, syncId));

    return NextResponse.json({
      status: "completed",
      recordsProcessed,
      errors: errors.length,
    });
  } catch (err) {
    await db
      .update(syncLogs)
      .set({
        status: "failed",
        errors: [
          { message: err instanceof Error ? err.message : "Unknown error" },
        ],
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, syncId));

    return NextResponse.json(
      { status: "failed", error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * Resolve Limitless deck name to our archetype ID.
 * Tries exact match first, then partial matching.
 * Auto-creates unknown archetypes to avoid losing data.
 */
async function resolveArchetypeId(
  deckName: string,
  deckId: string | undefined,
  archetypeByName: Map<string, string>
): Promise<string | null> {
  if (deckName === "Other") return null;

  const lower = deckName.toLowerCase();

  // Exact match
  if (archetypeByName.has(lower)) {
    return archetypeByName.get(lower)!;
  }

  // Partial match: check if any archetype name is contained in the deck name
  for (const [name, id] of archetypeByName) {
    if (lower.includes(name) || name.includes(lower)) {
      return id;
    }
  }

  // Auto-create from Limitless deck data
  const slug = deckName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const id = deckId ?? slug;

  await db
    .insert(archetypes)
    .values({
      id,
      name: deckName,
      slug,
      identifierCards: [deckName],
      tier: "D",
      format: "standard",
    })
    .onConflictDoNothing();

  archetypeByName.set(lower, id);
  return id;
}

interface MatchupResult {
  wins: number;
  losses: number;
  draws: number;
}

/**
 * Calculate matchup results from pairings data.
 * Groups pairings by archetype pairs and counts W/L/D.
 */
function calculateMatchups(
  pairings: LimitlessPairing[],
  playerDeckMap: Map<string, string | null>
): Map<string, MatchupResult> {
  const results = new Map<string, MatchupResult>();

  for (const pairing of pairings) {
    if (!pairing.player2) continue; // bye

    const deckA = playerDeckMap.get(pairing.player1);
    const deckB = playerDeckMap.get(pairing.player2);

    // Skip if we can't identify both decks
    if (!deckA || !deckB) continue;
    // Skip mirror matches
    if (deckA === deckB) continue;

    // Normalize key so A < B alphabetically (consistent ordering)
    const [first, second] =
      deckA < deckB ? [deckA, deckB] : [deckB, deckA];
    const key = `${first}:::${second}`;

    const current = results.get(key) ?? { wins: 0, losses: 0, draws: 0 };

    if (pairing.winner === null || pairing.winner === 0) {
      // Draw
      current.draws++;
    } else {
      const winnerStr = String(pairing.winner);
      const winnerDeck = playerDeckMap.get(winnerStr);

      if (winnerDeck === first) {
        current.wins++;
      } else if (winnerDeck === second) {
        current.losses++;
      } else {
        // Winner is player1 or player2 by ID
        if (winnerStr === pairing.player1) {
          const p1Deck = playerDeckMap.get(pairing.player1);
          if (p1Deck === first) current.wins++;
          else current.losses++;
        } else {
          const p2Deck = playerDeckMap.get(pairing.player2);
          if (p2Deck === first) current.wins++;
          else current.losses++;
        }
      }
    }

    results.set(key, current);
  }

  return results;
}

/**
 * Simple confidence score based on sample size.
 * 100+ games = 1.0 confidence, scales linearly below.
 */
function calculateConfidence(totalGames: number): number {
  return Math.min(1.0, totalGames / 100);
}
