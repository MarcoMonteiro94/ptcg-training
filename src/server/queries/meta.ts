import { db } from "@/server/db";
import { metaSnapshots, archetypes, tournamentStandings, matchupStats } from "@/server/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import type { Format } from "@/types";

export async function getLatestMetaSnapshot(format: Format = "standard") {
  const results = await db
    .select()
    .from(metaSnapshots)
    .where(eq(metaSnapshots.format, format))
    .orderBy(desc(metaSnapshots.date))
    .limit(1);

  return results[0] ?? null;
}

export async function getMetaTrends(format: Format = "standard", limit = 10) {
  return db
    .select()
    .from(metaSnapshots)
    .where(eq(metaSnapshots.format, format))
    .orderBy(desc(metaSnapshots.date))
    .limit(limit);
}

export async function getMetaStats(format: Format = "standard") {
  const activeArchetypes = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.format, format), eq(archetypes.isActive, true)));

  const stats = await Promise.all(
    activeArchetypes.map(async (arch) => {
      const standingCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(tournamentStandings)
        .where(eq(tournamentStandings.archetypeId, arch.id));

      // Calculate win rate from matchup stats
      const matchups = await db
        .select()
        .from(matchupStats)
        .where(
          and(
            eq(matchupStats.format, format),
            or(
              eq(matchupStats.archetypeAId, arch.id),
              eq(matchupStats.archetypeBId, arch.id)
            )
          )
        );

      let totalWins = 0;
      let totalGames = 0;
      for (const m of matchups) {
        if (m.archetypeAId === arch.id) {
          totalWins += m.wins;
        } else {
          totalWins += m.losses; // As B, opponent's losses are our wins
        }
        totalGames += m.totalGames;
      }

      return {
        ...arch,
        totalPlacements: standingCount[0]?.count ?? 0,
        winRate: totalGames > 0 ? totalWins / totalGames : null,
        totalGames,
      };
    })
  );

  return stats.sort((a, b) => b.totalPlacements - a.totalPlacements);
}
