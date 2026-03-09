"use server";

import { z } from "zod/v4";
import { db } from "@/server/db";
import { trainingPlans, dailyGoals, matchLogs, trainingStreaks } from "@/server/db/schema";
import type { DailyGoalData, TrainingPlanCompletionSummary } from "@/server/db/schema/user-data";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyPlan } from "@/server/services/ai/training-plan-generator";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and, gte, lte } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const createPlanSchema = z.object({
  archetypeId: z.string().min(1),
  weeklyGameTarget: z.number().min(5).max(30),
  focusAreas: z.array(z.string()).max(3).optional(),
  difficulty: z.enum(["casual", "competitive", "grinder"]).optional(),
});

export async function createTrainingPlan(input: z.infer<typeof createPlanSchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = createPlanSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  // Abandon any existing active plans
  await db
    .update(trainingPlans)
    .set({ status: "abandoned", updatedAt: new Date() })
    .where(
      and(eq(trainingPlans.userId, user.id), eq(trainingPlans.status, "active"))
    );

  // Generate AI plan
  const plan = await generateWeeklyPlan({
    userId: user.id,
    archetypeId: parsed.data.archetypeId,
    weeklyGameTarget: parsed.data.weeklyGameTarget,
    focusAreas: parsed.data.focusAreas,
  });

  // Merge focus areas and difficulty into plan data
  if (parsed.data.focusAreas) plan.focusAreas = parsed.data.focusAreas;
  if (parsed.data.difficulty) plan.difficulty = parsed.data.difficulty;

  // Calculate week bounds (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const planId = randomUUID();

  await db.insert(trainingPlans).values({
    id: planId,
    userId: user.id,
    archetypeId: parsed.data.archetypeId,
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd: sunday.toISOString().slice(0, 10),
    plan,
    status: "active",
    focusAreas: parsed.data.focusAreas ?? null,
    difficulty: parsed.data.difficulty ?? null,
  });

  // Generate daily goals for remaining days of the week
  const today = new Date();
  const daysLeft = 7 - ((today.getDay() + 6) % 7);
  const dailyGamesTarget = Math.ceil(plan.weeklyGameTarget / 7);

  for (let i = 0; i < daysLeft; i++) {
    const goalDate = new Date(today);
    goalDate.setDate(today.getDate() + i);
    const dateStr = goalDate.toISOString().slice(0, 10);

    const goals: DailyGoalData[] = [
      {
        type: "games",
        description: `Play ${dailyGamesTarget} games`,
        target: dailyGamesTarget,
        completed: false,
      },
    ];

    // Add matchup practice goal on alternating days
    if (plan.priorityMatchups.length > 0 && i % 2 === 0) {
      const matchup = plan.priorityMatchups[i % plan.priorityMatchups.length];
      goals.push({
        type: "matchup_practice",
        description: `Practice vs ${matchup.archetypeName}`,
        matchupArchetypeId: matchup.archetypeId,
        completed: false,
      });
    }

    // Add study goal every other day
    if (plan.studyTopics.length > 0 && i % 2 === 1) {
      const topic = plan.studyTopics[i % plan.studyTopics.length];
      goals.push({
        type: "study",
        description: `Study: ${topic}`,
        completed: false,
      });
    }

    // Rotate advanced goal types throughout the week
    const advancedGoals: DailyGoalData[] = [
      { type: "prize_check", description: "Map your prize cards in 3 games before making key plays", completed: false },
      { type: "deck_knowledge", description: "Review your decklist and identify tech card options", completed: false },
      { type: "opening_sequence", description: "Practice your ideal T1 setup sequence 3 times", completed: false },
    ];
    const advancedGoal = advancedGoals[i % advancedGoals.length];
    goals.push(advancedGoal);

    await db.insert(dailyGoals).values({
      id: randomUUID(),
      trainingPlanId: planId,
      userId: user.id,
      date: dateStr,
      goals,
    });
  }

  revalidatePath("/training");
  return { success: true, planId };
}

export async function toggleGoalCompletion(goalId: string, goalIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const [goalRow] = await db
    .select()
    .from(dailyGoals)
    .where(and(eq(dailyGoals.id, goalId), eq(dailyGoals.userId, user.id)))
    .limit(1);

  if (!goalRow) return { error: "Goal not found" };

  const updatedGoals = [...goalRow.goals];
  if (goalIndex < 0 || goalIndex >= updatedGoals.length) {
    return { error: "Invalid goal index" };
  }

  updatedGoals[goalIndex] = {
    ...updatedGoals[goalIndex],
    completed: !updatedGoals[goalIndex].completed,
  };

  const allCompleted = updatedGoals.every((g) => g.completed);

  await db
    .update(dailyGoals)
    .set({
      goals: updatedGoals,
      completedAt: allCompleted ? new Date() : null,
    })
    .where(eq(dailyGoals.id, goalId));

  // Update streak when all goals are completed
  if (allCompleted) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const [existingStreak] = await db
      .select()
      .from(trainingStreaks)
      .where(eq(trainingStreaks.userId, user.id))
      .limit(1);

    if (existingStreak) {
      const wasYesterday = existingStreak.lastCompletedDate === yesterdayStr;
      const isToday = existingStreak.lastCompletedDate === todayStr;

      if (!isToday) {
        const newStreak = wasYesterday ? existingStreak.currentStreak + 1 : 1;
        const newLongest = Math.max(newStreak, existingStreak.longestStreak);

        await db
          .update(trainingStreaks)
          .set({
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastCompletedDate: todayStr,
            updatedAt: new Date(),
          })
          .where(eq(trainingStreaks.userId, user.id));
      }
    } else {
      await db.insert(trainingStreaks).values({
        userId: user.id,
        currentStreak: 1,
        longestStreak: 1,
        lastCompletedDate: todayStr,
      });
    }
  }

  revalidatePath("/training");
  return { success: true };
}

export async function abandonPlan(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await db
    .update(trainingPlans)
    .set({ status: "abandoned", updatedAt: new Date() })
    .where(
      and(eq(trainingPlans.id, planId), eq(trainingPlans.userId, user.id))
    );

  revalidatePath("/training");
  return { success: true };
}

export async function completePlan(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const [plan] = await db
    .select()
    .from(trainingPlans)
    .where(
      and(
        eq(trainingPlans.id, planId),
        eq(trainingPlans.userId, user.id),
        eq(trainingPlans.status, "active")
      )
    )
    .limit(1);

  if (!plan) return { error: "Plan not found" };

  // Gather stats
  const weekStart = new Date(plan.weekStart);
  const weekEnd = new Date(plan.weekEnd);

  const [weekGoals, weekMatches] = await Promise.all([
    db
      .select()
      .from(dailyGoals)
      .where(
        and(
          eq(dailyGoals.trainingPlanId, planId),
          eq(dailyGoals.userId, user.id)
        )
      ),
    db
      .select()
      .from(matchLogs)
      .where(
        and(
          eq(matchLogs.userId, user.id),
          gte(matchLogs.playedAt, weekStart),
          lte(matchLogs.playedAt, weekEnd)
        )
      ),
  ]);

  const goalsTotal = weekGoals.reduce((s, d) => s + d.goals.length, 0);
  const goalsCompleted = weekGoals.reduce(
    (s, d) => s + d.goals.filter((g) => g.completed).length,
    0
  );
  const gamesPlayed = weekMatches.length;
  const wins = weekMatches.filter((m) => m.result === "win").length;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  // Calculate matchup improvements
  const beforeStart = new Date(weekStart);
  beforeStart.setDate(beforeStart.getDate() - 14);

  const beforeMatches = await db
    .select()
    .from(matchLogs)
    .where(
      and(
        eq(matchLogs.userId, user.id),
        gte(matchLogs.playedAt, beforeStart),
        lte(matchLogs.playedAt, weekStart)
      )
    );

  const matchupImprovements = plan.plan.priorityMatchups.map((m) => {
    const before = beforeMatches.filter(
      (match) => match.opponentArchetypeId === m.archetypeId
    );
    const during = weekMatches.filter(
      (match) => match.opponentArchetypeId === m.archetypeId
    );
    const beforeWr =
      before.length > 0
        ? Math.round(
            (before.filter((x) => x.result === "win").length / before.length) *
              100
          )
        : 0;
    const duringWr =
      during.length > 0
        ? Math.round(
            (during.filter((x) => x.result === "win").length / during.length) *
              100
          )
        : 0;
    return {
      archetypeId: m.archetypeId,
      archetypeName: m.archetypeName,
      before: beforeWr,
      after: duringWr,
    };
  });

  // Generate AI review
  let aiReview = "Training week completed.";
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are a Pokemon TCG coach. Write a brief 2-3 sentence review of this training week:
- Focus: ${plan.plan.focus}
- Games played: ${gamesPlayed}/${plan.plan.weeklyGameTarget} target
- Goals completed: ${goalsCompleted}/${goalsTotal}
- Win rate: ${winRate}%
- Matchup deltas: ${matchupImprovements.map((m) => `${m.archetypeName}: ${m.before}% → ${m.after}%`).join(", ") || "No data"}

Be encouraging but honest. Give one specific tip for next week.`,
        },
      ],
    });
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    if (text) aiReview = text;
  } catch {
    // AI review is optional
  }

  const summary: TrainingPlanCompletionSummary = {
    gamesPlayed,
    goalsCompleted,
    goalsTotal,
    winRate,
    matchupImprovements,
    aiReview,
  };

  await db
    .update(trainingPlans)
    .set({
      status: "completed",
      completionSummary: summary,
      updatedAt: new Date(),
    })
    .where(eq(trainingPlans.id, planId));

  revalidatePath("/training");
  return { success: true, summary };
}

export async function addCustomGoal(goalId: string, description: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (!description.trim()) return { error: "Description is required" };

  const [goalRow] = await db
    .select()
    .from(dailyGoals)
    .where(and(eq(dailyGoals.id, goalId), eq(dailyGoals.userId, user.id)))
    .limit(1);

  if (!goalRow) return { error: "Goal not found" };

  const updatedGoals: DailyGoalData[] = [
    ...goalRow.goals,
    {
      type: "custom",
      description: description.trim(),
      completed: false,
    },
  ];

  await db
    .update(dailyGoals)
    .set({ goals: updatedGoals })
    .where(eq(dailyGoals.id, goalId));

  revalidatePath("/training");
  return { success: true };
}

export async function adjustDailyGoals(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const [plan] = await db
    .select()
    .from(trainingPlans)
    .where(
      and(
        eq(trainingPlans.id, planId),
        eq(trainingPlans.userId, user.id),
        eq(trainingPlans.status, "active")
      )
    )
    .limit(1);

  if (!plan) return { error: "Plan not found" };

  const today = new Date().toISOString().slice(0, 10);

  // Get all goals for this plan
  const allGoals = await db
    .select()
    .from(dailyGoals)
    .where(
      and(
        eq(dailyGoals.trainingPlanId, planId),
        eq(dailyGoals.userId, user.id)
      )
    )
    .orderBy(dailyGoals.date);

  const pastGoals = allGoals.filter((g) => g.date < today);
  const futureGoals = allGoals.filter((g) => g.date >= today);

  if (futureGoals.length === 0) return { error: "No future goals to adjust" };

  // Calculate completion rate so far
  const totalPast = pastGoals.reduce((s, d) => s + d.goals.length, 0);
  const completedPast = pastGoals.reduce(
    (s, d) => s + d.goals.filter((g) => g.completed).length,
    0
  );
  const pastRate = totalPast > 0 ? completedPast / totalPast : 0;

  // Adjust future goals based on progress
  for (const goalDay of futureGoals) {
    const adjustedGoals = [...goalDay.goals];

    if (pastRate > 0.8) {
      // Ahead of schedule — remove one non-games goal if more than 2
      const nonGames = adjustedGoals.filter((g) => g.type !== "games" && !g.completed);
      if (nonGames.length > 1 && adjustedGoals.length > 2) {
        const removeIdx = adjustedGoals.findIndex(
          (g) => g.type !== "games" && !g.completed
        );
        if (removeIdx >= 0) adjustedGoals.splice(removeIdx, 1);
      }
    } else if (pastRate < 0.4) {
      // Behind schedule — add a catch-up review goal
      const hasReview = adjustedGoals.some((g) => g.type === "review");
      if (!hasReview) {
        adjustedGoals.push({
          type: "review",
          description: "Catch-up: Review and complete any missed goals from earlier this week",
          completed: false,
        });
      }
    }

    await db
      .update(dailyGoals)
      .set({ goals: adjustedGoals })
      .where(eq(dailyGoals.id, goalDay.id));
  }

  revalidatePath("/training");
  return { success: true, adjusted: futureGoals.length };
}

export async function updatePlan(
  planId: string,
  updates: { weeklyGameTarget?: number; studyTopics?: string[] }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const [plan] = await db
    .select()
    .from(trainingPlans)
    .where(
      and(
        eq(trainingPlans.id, planId),
        eq(trainingPlans.userId, user.id),
        eq(trainingPlans.status, "active")
      )
    )
    .limit(1);

  if (!plan) return { error: "Plan not found" };

  const updatedPlanData = { ...plan.plan };
  if (updates.weeklyGameTarget !== undefined) {
    updatedPlanData.weeklyGameTarget = updates.weeklyGameTarget;
  }
  if (updates.studyTopics !== undefined) {
    updatedPlanData.studyTopics = updates.studyTopics;
  }

  await db
    .update(trainingPlans)
    .set({ plan: updatedPlanData, updatedAt: new Date() })
    .where(eq(trainingPlans.id, planId));

  revalidatePath("/training");
  return { success: true };
}
