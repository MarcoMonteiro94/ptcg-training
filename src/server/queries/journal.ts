import { db } from "@/server/db";
import { matchLogs, archetypes } from "@/server/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";

const PAGE_SIZE = 20;

export async function getUserMatchLogs(
  userId: string,
  page = 1,
  deckFilter?: string
) {
  const conditions = [
    eq(matchLogs.userId, userId),
    // Exclude tournament intentional draws (not real games)
    sql`NOT (${matchLogs.result} = 'draw' AND ${matchLogs.userTournamentId} IS NOT NULL)`,
  ];
  if (deckFilter) {
    conditions.push(eq(matchLogs.userArchetypeId, deckFilter));
  }

  const where = and(...conditions);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, [countRow]] = await Promise.all([
    db
      .select()
      .from(matchLogs)
      .where(where)
      .orderBy(desc(matchLogs.playedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(matchLogs)
      .where(where),
  ]);

  return {
    matches: rows,
    total: Number(countRow.total),
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(Number(countRow.total) / PAGE_SIZE),
  };
}

export async function getUserDecks(userId: string) {
  const rows = await db
    .select({
      archetypeId: matchLogs.userArchetypeId,
      archetypeName: archetypes.name,
      games: count(),
    })
    .from(matchLogs)
    .leftJoin(archetypes, eq(matchLogs.userArchetypeId, archetypes.id))
    .where(and(eq(matchLogs.userId, userId), sql`${matchLogs.userArchetypeId} IS NOT NULL`))
    .groupBy(matchLogs.userArchetypeId, archetypes.name);

  return rows
    .filter((r) => r.archetypeId)
    .map((r) => ({
      id: r.archetypeId!,
      name: r.archetypeName || r.archetypeId!,
      games: Number(r.games),
    }))
    .sort((a, b) => b.games - a.games);
}

export async function getUserMatchStats(userId: string, deckId?: string) {
  const conditions = [eq(matchLogs.userId, userId)];
  if (deckId) {
    conditions.push(eq(matchLogs.userArchetypeId, deckId));
  }

  const logs = await db
    .select()
    .from(matchLogs)
    .where(and(...conditions));

  const total = logs.length;
  const wins = logs.filter((l) => l.result === "win").length;
  const losses = logs.filter((l) => l.result === "loss").length;
  const draws = logs.filter((l) => l.result === "draw").length;
  const winRate = total > 0 ? wins / total : 0;

  const firstWins = logs.filter((l) => l.wentFirst && l.result === "win").length;
  const firstTotal = logs.filter((l) => l.wentFirst).length;
  const secondWins = logs.filter((l) => l.wentFirst === false && l.result === "win").length;
  const secondTotal = logs.filter((l) => l.wentFirst === false).length;

  const byOpponent: Record<string, { wins: number; losses: number; draws: number }> = {};
  for (const log of logs) {
    const opp = log.opponentArchetypeId || "unknown";
    if (!byOpponent[opp]) byOpponent[opp] = { wins: 0, losses: 0, draws: 0 };
    byOpponent[opp][log.result === "win" ? "wins" : log.result === "loss" ? "losses" : "draws"]++;
  }

  return {
    total,
    wins,
    losses,
    draws,
    winRate,
    goingFirst: {
      total: firstTotal,
      wins: firstWins,
      winRate: firstTotal > 0 ? firstWins / firstTotal : 0,
    },
    goingSecond: {
      total: secondTotal,
      wins: secondWins,
      winRate: secondTotal > 0 ? secondWins / secondTotal : 0,
    },
    byOpponent,
  };
}
