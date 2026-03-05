"use server";

import { z } from "zod/v4";
import { db } from "@/server/db";
import { trainingPlans, dailyGoals } from "@/server/db/schema";
import type { DailyGoalData } from "@/server/db/schema/user-data";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyPlan } from "@/server/services/ai/training-plan-generator";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

const createPlanSchema = z.object({
  archetypeId: z.string().min(1),
  weeklyGameTarget: z.number().min(5).max(30),
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
  });

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
