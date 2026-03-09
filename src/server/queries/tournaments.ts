import { db } from "@/server/db";
import { userTournaments, matchLogs, archetypes } from "@/server/db/schema";
import { eq, desc, and, sql, asc } from "drizzle-orm";

export async function getUserTournaments(userId: string) {
  const tournaments = await db
    .select()
    .from(userTournaments)
    .where(eq(userTournaments.userId, userId))
    .orderBy(desc(userTournaments.date));

  // Get records for each tournament
  const tournamentIds = tournaments.map((t) => t.id);

  if (tournamentIds.length === 0) return [];

  const games = await db
    .select({
      userTournamentId: matchLogs.userTournamentId,
      roundNumber: matchLogs.roundNumber,
      result: matchLogs.result,
    })
    .from(matchLogs)
    .where(sql`${matchLogs.userTournamentId} IN ${tournamentIds}`);

  // Group games by tournament → round, then derive round result from MD3
  const recordMap: Record<string, { wins: number; losses: number; draws: number }> = {};
  const byTournamentRound: Record<string, Record<number, string[]>> = {};

  for (const g of games) {
    const tid = g.userTournamentId!;
    const rn = g.roundNumber ?? 0;
    if (!byTournamentRound[tid]) byTournamentRound[tid] = {};
    if (!byTournamentRound[tid][rn]) byTournamentRound[tid][rn] = [];
    byTournamentRound[tid][rn].push(g.result);
  }

  for (const [tid, rounds] of Object.entries(byTournamentRound)) {
    if (!recordMap[tid]) recordMap[tid] = { wins: 0, losses: 0, draws: 0 };
    for (const results of Object.values(rounds)) {
      const w = results.filter((r) => r === "win").length;
      const l = results.filter((r) => r === "loss").length;
      if (w > l) recordMap[tid].wins++;
      else if (l > w) recordMap[tid].losses++;
      else recordMap[tid].draws++;
    }
  }

  return tournaments.map((t) => ({
    ...t,
    record: recordMap[t.id] || { wins: 0, losses: 0, draws: 0 },
  }));
}

export async function getUserTournament(userId: string, tournamentId: string) {
  const [tournament] = await db
    .select()
    .from(userTournaments)
    .where(
      and(
        eq(userTournaments.id, tournamentId),
        eq(userTournaments.userId, userId)
      )
    )
    .limit(1);

  if (!tournament) return null;

  const rounds = await db
    .select({
      id: matchLogs.id,
      result: matchLogs.result,
      opponentArchetypeId: matchLogs.opponentArchetypeId,
      opponentName: archetypes.name,
      wentFirst: matchLogs.wentFirst,
      roundNumber: matchLogs.roundNumber,
      notes: matchLogs.notes,
      playedAt: matchLogs.playedAt,
    })
    .from(matchLogs)
    .leftJoin(archetypes, eq(matchLogs.opponentArchetypeId, archetypes.id))
    .where(eq(matchLogs.userTournamentId, tournamentId))
    .orderBy(asc(matchLogs.roundNumber), asc(matchLogs.playedAt));

  return { ...tournament, rounds };
}
