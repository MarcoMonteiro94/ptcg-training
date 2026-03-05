import { db } from "@/server/db";
import { matchupStats, metaSnapshots, archetypes, tournamentStandings } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

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

  const totalStandings = await db
    .select({ count: sql<number>`count(*)` })
    .from(tournamentStandings);

  const total = totalStandings[0]?.count || 1;

  const snapshotData = [];

  for (const arch of activeArchetypes) {
    const archStandings = await db
      .select({ count: sql<number>`count(*)` })
      .from(tournamentStandings)
      .where(eq(tournamentStandings.archetypeId, arch.id));

    const count = archStandings[0]?.count || 0;
    const usageRate = count / total;

    snapshotData.push({
      archetype_id: arch.id,
      usage_rate: usageRate,
      win_rate: 0,
      tier: arch.tier || "C",
      justification: arch.description || undefined,
    });
  }

  await db.insert(metaSnapshots).values({
    id: randomUUID(),
    date: new Date(),
    format,
    data: snapshotData,
  });

  return { archetypes: snapshotData.length };
}
