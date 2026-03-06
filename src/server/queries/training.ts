import { db } from "@/server/db";
import { trainingPlans, dailyGoals, matchLogs, trainingStreaks } from "@/server/db/schema";
import { eq, and, desc, gte, lte, ne } from "drizzle-orm";

export async function getActiveTrainingPlan(userId: string) {
  const results = await db
    .select()
    .from(trainingPlans)
    .where(
      and(
        eq(trainingPlans.userId, userId),
        eq(trainingPlans.status, "active")
      )
    )
    .orderBy(desc(trainingPlans.createdAt))
    .limit(1);

  return results[0] ?? null;
}

export async function getDailyGoals(userId: string, date: string) {
  const results = await db
    .select()
    .from(dailyGoals)
    .where(
      and(
        eq(dailyGoals.userId, userId),
        eq(dailyGoals.date, date)
      )
    )
    .limit(1);

  return results[0] ?? null;
}

export async function getWeeklyProgress(userId: string, planId: string) {
  const plan = await db
    .select()
    .from(trainingPlans)
    .where(eq(trainingPlans.id, planId))
    .limit(1);

  if (!plan[0]) return null;

  const weekGoals = await db
    .select()
    .from(dailyGoals)
    .where(
      and(
        eq(dailyGoals.trainingPlanId, planId),
        eq(dailyGoals.userId, userId)
      )
    )
    .orderBy(dailyGoals.date);

  // Count games played this week
  const weekStart = new Date(plan[0].weekStart);
  const weekEnd = new Date(plan[0].weekEnd);

  const weekMatches = await db
    .select()
    .from(matchLogs)
    .where(
      and(
        eq(matchLogs.userId, userId),
        gte(matchLogs.playedAt, weekStart),
        lte(matchLogs.playedAt, weekEnd)
      )
    );

  const totalGoals = weekGoals.reduce(
    (sum, day) => sum + day.goals.length,
    0
  );
  const completedGoals = weekGoals.reduce(
    (sum, day) => sum + day.goals.filter((g) => g.completed).length,
    0
  );

  return {
    plan: plan[0],
    dailyGoals: weekGoals,
    gamesPlayed: weekMatches.length,
    gameTarget: plan[0].plan.weeklyGameTarget,
    totalGoals,
    completedGoals,
    completionRate: totalGoals > 0 ? completedGoals / totalGoals : 0,
    weekMatches,
  };
}

export async function getTrainingStreak(userId: string) {
  const [streak] = await db
    .select()
    .from(trainingStreaks)
    .where(eq(trainingStreaks.userId, userId))
    .limit(1);

  return streak ?? null;
}

export async function getMatchupImprovement(
  userId: string,
  priorityMatchups: Array<{ archetypeId: string; archetypeName: string }>,
  planWeekStart: string,
  planWeekEnd: string
) {
  if (priorityMatchups.length === 0) return [];

  const weekStart = new Date(planWeekStart);
  const weekEnd = new Date(planWeekEnd);

  // "Before" = 2 weeks before the plan started
  const beforeStart = new Date(weekStart);
  beforeStart.setDate(beforeStart.getDate() - 14);

  const [beforeMatches, duringMatches] = await Promise.all([
    db
      .select()
      .from(matchLogs)
      .where(
        and(
          eq(matchLogs.userId, userId),
          gte(matchLogs.playedAt, beforeStart),
          lte(matchLogs.playedAt, weekStart)
        )
      ),
    db
      .select()
      .from(matchLogs)
      .where(
        and(
          eq(matchLogs.userId, userId),
          gte(matchLogs.playedAt, weekStart),
          lte(matchLogs.playedAt, weekEnd)
        )
      ),
  ]);

  return priorityMatchups.map((matchup) => {
    const beforeVs = beforeMatches.filter(
      (m) => m.opponentArchetypeId === matchup.archetypeId
    );
    const duringVs = duringMatches.filter(
      (m) => m.opponentArchetypeId === matchup.archetypeId
    );

    const beforeWinRate =
      beforeVs.length > 0
        ? Math.round(
            (beforeVs.filter((m) => m.result === "win").length /
              beforeVs.length) *
              100
          )
        : 0;

    const duringWinRate =
      duringVs.length > 0
        ? Math.round(
            (duringVs.filter((m) => m.result === "win").length /
              duringVs.length) *
              100
          )
        : 0;

    return {
      archetypeId: matchup.archetypeId,
      archetypeName: matchup.archetypeName,
      before: beforeWinRate,
      after: duringWinRate,
      beforeGames: beforeVs.length,
      duringGames: duringVs.length,
    };
  });
}

export async function isPlanCompletable(userId: string, planId: string) {
  const [plan] = await db
    .select()
    .from(trainingPlans)
    .where(
      and(
        eq(trainingPlans.id, planId),
        eq(trainingPlans.userId, userId),
        eq(trainingPlans.status, "active")
      )
    )
    .limit(1);

  if (!plan) return false;

  const today = new Date().toISOString().slice(0, 10);
  return today >= plan.weekEnd;
}

export async function getTrainingHistory(userId: string) {
  return db
    .select()
    .from(trainingPlans)
    .where(
      and(
        eq(trainingPlans.userId, userId),
        ne(trainingPlans.status, "active")
      )
    )
    .orderBy(desc(trainingPlans.createdAt));
}

export async function getLatestCompletedPlan(userId: string) {
  const [plan] = await db
    .select()
    .from(trainingPlans)
    .where(
      and(
        eq(trainingPlans.userId, userId),
        eq(trainingPlans.status, "completed")
      )
    )
    .orderBy(desc(trainingPlans.createdAt))
    .limit(1);

  return plan ?? null;
}

export async function getTrainingPeriodStats(userId: string, planId: string) {
  const [plan] = await db
    .select()
    .from(trainingPlans)
    .where(eq(trainingPlans.id, planId))
    .limit(1);

  if (!plan) return [];

  const weekStart = new Date(plan.weekStart);
  const weekEnd = new Date(plan.weekEnd);

  const matches = await db
    .select()
    .from(matchLogs)
    .where(
      and(
        eq(matchLogs.userId, userId),
        gte(matchLogs.playedAt, weekStart),
        lte(matchLogs.playedAt, weekEnd)
      )
    );

  // Group by day
  const dailyStats: Array<{
    date: string;
    games: number;
    wins: number;
    winRate: number;
  }> = [];

  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const dayMatches = matches.filter(
      (m) => m.playedAt.toISOString().slice(0, 10) === dateStr
    );
    const dayWins = dayMatches.filter((m) => m.result === "win").length;
    dailyStats.push({
      date: dateStr,
      games: dayMatches.length,
      wins: dayWins,
      winRate: dayMatches.length > 0 ? Math.round((dayWins / dayMatches.length) * 100) : 0,
    });
  }

  return dailyStats;
}
