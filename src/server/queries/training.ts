import { db } from "@/server/db";
import { trainingPlans, dailyGoals, matchLogs } from "@/server/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

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
