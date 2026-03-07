import { db } from "@/server/db";
import { matchupStats, archetypes } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { Format } from "@/types";

export async function getMatchupMatrix(format: Format = "standard") {
  const activeArchetypes = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.format, format), eq(archetypes.isActive, true)))
    .orderBy(archetypes.name);

  const stats = await db
    .select()
    .from(matchupStats)
    .where(eq(matchupStats.format, format));

  const matrix: Record<string, Record<string, { winRate: number | null; totalGames: number }>> = {};

  for (const arch of activeArchetypes) {
    matrix[arch.id] = {};
  }

  for (const stat of stats) {
    // A → B: use win rate as-is
    if (matrix[stat.archetypeAId]) {
      matrix[stat.archetypeAId][stat.archetypeBId] = {
        winRate: stat.winRate,
        totalGames: stat.totalGames,
      };
    }
    // B → A: invert win rate (losses become wins from B's perspective)
    if (matrix[stat.archetypeBId]) {
      matrix[stat.archetypeBId][stat.archetypeAId] = {
        winRate: stat.winRate != null ? 1 - stat.winRate : null,
        totalGames: stat.totalGames,
      };
    }
  }

  return { archetypes: activeArchetypes, matrix };
}

export async function getMatchupsForArchetype(archetypeId: string) {
  // Get matchups where this archetype is A or B
  const asA = await db
    .select()
    .from(matchupStats)
    .where(eq(matchupStats.archetypeAId, archetypeId));

  const asB = await db
    .select()
    .from(matchupStats)
    .where(eq(matchupStats.archetypeBId, archetypeId));

  // Resolve opponent names
  const opponentIds = new Set([
    ...asA.map((m) => m.archetypeBId),
    ...asB.map((m) => m.archetypeAId),
  ]);

  const opponents = opponentIds.size > 0
    ? await db
        .select({ id: archetypes.id, name: archetypes.name, slug: archetypes.slug })
        .from(archetypes)
        .where(
          // drizzle doesn't support IN directly, so filter in JS
          eq(archetypes.isActive, true)
        )
    : [];

  const nameMap = new Map(opponents.map((o) => [o.id, o.name]));
  const slugMap = new Map(opponents.map((o) => [o.id, o.slug]));

  // Combine: for A rows, use as-is; for B rows, flip perspective
  const combined = [
    ...asA.map((m) => ({
      id: m.id,
      opponentId: m.archetypeBId,
      opponentName: nameMap.get(m.archetypeBId) || m.archetypeBId,
      opponentSlug: slugMap.get(m.archetypeBId) || m.archetypeBId,
      winRate: m.winRate,
      totalGames: m.totalGames,
    })),
    ...asB.map((m) => ({
      id: m.id,
      opponentId: m.archetypeAId,
      opponentName: nameMap.get(m.archetypeAId) || m.archetypeAId,
      opponentSlug: slugMap.get(m.archetypeAId) || m.archetypeAId,
      winRate: m.winRate != null ? 1 - m.winRate : null,
      totalGames: m.totalGames,
    })),
  ];

  // Deduplicate: keep the entry with the most games per opponent
  const byOpponent = new Map<string, typeof combined[number]>();
  for (const entry of combined) {
    const existing = byOpponent.get(entry.opponentId);
    if (!existing || entry.totalGames > existing.totalGames) {
      byOpponent.set(entry.opponentId, entry);
    }
  }

  return Array.from(byOpponent.values());
}
