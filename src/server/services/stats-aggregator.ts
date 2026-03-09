import { db } from "@/server/db";
import { matchupStats, metaSnapshots, archetypes, tournamentStandings } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { calculateMetaScores, type ArchetypeRawData } from "./meta-scoring";

export async function aggregateMatchupStats(format: "standard" | "expanded" = "standard") {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeArchetypes = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.format, format), eq(archetypes.isActive, true)));

  const period = new Date().toISOString().slice(0, 7);

  for (const archA of activeArchetypes) {
    for (const archB of activeArchetypes) {
      if (archA.id === archB.id) continue;

      const existing = await db
        .select()
        .from(matchupStats)
        .where(
          and(
            eq(matchupStats.archetypeAId, archA.id),
            eq(matchupStats.archetypeBId, archB.id),
            eq(matchupStats.format, format),
            eq(matchupStats.period, period),
            eq(matchupStats.source, "aggregated")
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(matchupStats).values({
          id: randomUUID(),
          archetypeAId: archA.id,
          archetypeBId: archB.id,
          wins: 0,
          losses: 0,
          draws: 0,
          totalGames: 0,
          winRate: null,
          confidence: 0,
          format,
          period,
          source: "aggregated",
        });
      }
    }
  }

  return { processed: activeArchetypes.length };
}

export async function generateMetaSnapshot(format: "standard" | "expanded" = "standard") {
  const activeArchetypes = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.format, format), eq(archetypes.isActive, true)));

  // Use previous snapshot's usage rates (from Limitless meta shares) if available
  const previousSnapshot = await db
    .select()
    .from(metaSnapshots)
    .where(eq(metaSnapshots.format, format))
    .orderBy(sql`${metaSnapshots.date} desc`)
    .limit(1);

  const previousUsageMap = new Map<string, number>();
  if (previousSnapshot[0]?.data) {
    for (const entry of previousSnapshot[0].data) {
      previousUsageMap.set(entry.archetype_id, entry.usage_rate);
    }
  }

  // Fallback: calculate top-cut share from standings
  const totalStandings = await db
    .select({ count: sql<number>`count(*)` })
    .from(tournamentStandings);
  const totalTopCut = Number(totalStandings[0]?.count) || 1;

  // Gather raw data for each archetype
  const rawDataMap = new Map<string, ArchetypeRawData>();

  for (const arch of activeArchetypes) {
    const archStandings = await db
      .select({ count: sql<number>`count(*)` })
      .from(tournamentStandings)
      .where(eq(tournamentStandings.archetypeId, arch.id));

    const top8Result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tournamentStandings)
      .where(
        and(
          eq(tournamentStandings.archetypeId, arch.id),
          sql`${tournamentStandings.placing} <= 8`
        )
      );

    const top32Result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tournamentStandings)
      .where(
        and(
          eq(tournamentStandings.archetypeId, arch.id),
          sql`${tournamentStandings.placing} <= 32`
        )
      );

    // Calculate win rate from matchup stats
    const matchups = await db
      .select()
      .from(matchupStats)
      .where(
        and(
          eq(matchupStats.format, format),
          sql`${matchupStats.totalGames} > 0`,
          sql`(${matchupStats.archetypeAId} = ${arch.id} OR ${matchupStats.archetypeBId} = ${arch.id})`
        )
      );

    let totalWins = 0;
    let totalGames = 0;
    for (const m of matchups) {
      if (m.archetypeAId === arch.id) {
        totalWins += m.wins;
      } else {
        totalWins += m.losses;
      }
      totalGames += m.totalGames;
    }

    const placementCount = Number(archStandings[0]?.count) || 0;
    const usageRate = previousUsageMap.get(arch.id) ?? (placementCount / totalTopCut);
    const winRate = totalGames > 0 ? totalWins / totalGames : 0;

    rawDataMap.set(arch.id, {
      archetypeId: arch.id,
      usageRate,
      winRate,
      top8Count: Number(top8Result[0]?.count) || 0,
      top32Count: Number(top32Result[0]?.count) || 0,
      totalPlacements: placementCount,
      totalGames,
      matchupWinRates: [],
    });
  }

  // Find top 5 decks by usage for matchup weighting
  const allRaw = Array.from(rawDataMap.values());
  const top5ByUsage = [...allRaw]
    .sort((a, b) => b.usageRate - a.usageRate)
    .slice(0, 5);

  // Populate matchup win rates against top 5
  for (const arch of allRaw) {
    const matchupWinRates: ArchetypeRawData["matchupWinRates"] = [];

    for (const opponent of top5ByUsage) {
      if (opponent.archetypeId === arch.archetypeId) continue;

      const pairMatchups = await db
        .select()
        .from(matchupStats)
        .where(
          and(
            eq(matchupStats.format, format),
            sql`${matchupStats.totalGames} > 0`,
            sql`(
              (${matchupStats.archetypeAId} = ${arch.archetypeId} AND ${matchupStats.archetypeBId} = ${opponent.archetypeId})
              OR
              (${matchupStats.archetypeAId} = ${opponent.archetypeId} AND ${matchupStats.archetypeBId} = ${arch.archetypeId})
            )`
          )
        );

      let wins = 0;
      let games = 0;
      for (const m of pairMatchups) {
        if (m.archetypeAId === arch.archetypeId) {
          wins += m.wins;
        } else {
          wins += m.losses;
        }
        games += m.totalGames;
      }

      if (games > 0) {
        matchupWinRates.push({
          opponentUsageRate: opponent.usageRate,
          winRate: wins / games,
        });
      }
    }

    arch.matchupWinRates = matchupWinRates;
  }

  // Calculate meta scores
  const scores = calculateMetaScores(allRaw);
  const scoreMap = new Map(scores.map((s) => [s.archetypeId, s]));

  const snapshotData = activeArchetypes.map((arch) => {
    const raw = rawDataMap.get(arch.id)!;
    const score = scoreMap.get(arch.id);

    return {
      archetype_id: arch.id,
      usage_rate: raw.usageRate,
      win_rate: raw.winRate,
      tier: arch.tier || "C",
      justification: arch.description || undefined,
      meta_score: score?.metaScore ?? 0,
      top8_rate: raw.totalPlacements > 0 ? raw.top8Count / raw.totalPlacements : 0,
      top32_rate: raw.totalPlacements > 0 ? raw.top32Count / raw.totalPlacements : 0,
      matchup_score: score?.matchupScore ?? 0.5,
      total_games: raw.totalGames,
    };
  });

  await db.insert(metaSnapshots).values({
    id: randomUUID(),
    date: new Date(),
    format,
    data: snapshotData,
  });

  return { archetypes: snapshotData.length };
}
