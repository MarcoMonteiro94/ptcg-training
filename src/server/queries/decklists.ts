import { db } from "@/server/db";
import { decklists, tournamentStandings, userDecklists } from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";

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

export async function getUserDecklists(userId: string) {
  return db
    .select()
    .from(userDecklists)
    .where(eq(userDecklists.userId, userId))
    .orderBy(desc(userDecklists.updatedAt));
}

export async function getUserDecklistById(userId: string, deckId: string) {
  const [deck] = await db
    .select()
    .from(userDecklists)
    .where(and(eq(userDecklists.id, deckId), eq(userDecklists.userId, userId)))
    .limit(1);
  return deck ?? null;
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
