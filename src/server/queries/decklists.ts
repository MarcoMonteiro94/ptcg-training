import { db } from "@/server/db";
import { decklists, tournamentStandings } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getDecklistsByArchetype(archetypeId: string, limit = 10) {
  return db
    .select()
    .from(decklists)
    .where(eq(decklists.archetypeId, archetypeId))
    .orderBy(desc(decklists.createdAt))
    .limit(limit);
}

export async function getArchetypePlacements(archetypeId: string) {
  return db
    .select()
    .from(tournamentStandings)
    .where(eq(tournamentStandings.archetypeId, archetypeId))
    .orderBy(tournamentStandings.placing)
    .limit(50);
}

export async function getCardUsageForArchetype(archetypeId: string) {
  const lists = await db
    .select({ cards: decklists.cards })
    .from(decklists)
    .where(eq(decklists.archetypeId, archetypeId));

  const cardCounts: Record<string, { totalCount: number; appearances: number }> = {};

  for (const list of lists) {
    if (!list.cards) continue;
    for (const card of list.cards) {
      if (!cardCounts[card.card_id]) {
        cardCounts[card.card_id] = { totalCount: 0, appearances: 0 };
      }
      cardCounts[card.card_id].totalCount += card.count;
      cardCounts[card.card_id].appearances += 1;
    }
  }

  const totalLists = lists.length || 1;

  return Object.entries(cardCounts)
    .map(([cardId, data]) => ({
      cardId,
      avgCount: Math.round((data.totalCount / data.appearances) * 10) / 10,
      usageRate: data.appearances / totalLists,
      isCore: data.appearances / totalLists >= 0.75,
    }))
    .sort((a, b) => b.usageRate - a.usageRate);
}
