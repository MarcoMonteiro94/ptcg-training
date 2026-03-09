"use server";

import { z } from "zod/v4";
import { db } from "@/server/db";
import { matchLogs, dailyGoals, trainingPlans } from "@/server/db/schema";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

const createMatchLogSchema = z.object({
  userArchetypeId: z.string().optional(),
  opponentArchetypeId: z.string().min(1, "Opponent archetype is required"),
  result: z.enum(["win", "loss", "draw"]),
  wentFirst: z.boolean().optional(),
  format: z.enum(["standard", "expanded", "unlimited"]),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateMatchLogInput = z.infer<typeof createMatchLogSchema>;

const updateMatchLogSchema = z.object({
  id: z.string().min(1),
  userArchetypeId: z.string().optional(),
  opponentArchetypeId: z.string().min(1, "Opponent archetype is required"),
  result: z.enum(["win", "loss", "draw"]),
  wentFirst: z.boolean().optional(),
  notes: z.string().optional(),
});

export type UpdateMatchLogInput = z.infer<typeof updateMatchLogSchema>;

export async function createMatchLog(input: CreateMatchLogInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createMatchLogSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const data = parsed.data;

  await db.insert(matchLogs).values({
    id: randomUUID(),
    userId: user.id,
    userArchetypeId: data.userArchetypeId || null,
    opponentArchetypeId: data.opponentArchetypeId,
    result: data.result,
    wentFirst: data.wentFirst ?? null,
    format: data.format,
    notes: data.notes || null,
    tags: data.tags || [],
  });

  // Auto-complete training goals
  try {
    await autoCompleteTrainingGoals(user.id, data.opponentArchetypeId);
  } catch {
    // Non-critical: don't fail match logging if goal update fails
  }

  revalidatePath("/journal");
  revalidatePath("/journal/stats");
  revalidatePath("/training");

  return { success: true };
}

export async function createMatchLogBatch(inputs: CreateMatchLogInput[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  if (inputs.length === 0 || inputs.length > 5) {
    return { error: "Must provide 1-5 match logs" };
  }

  for (const input of inputs) {
    const parsed = createMatchLogSchema.safeParse(input);
    if (!parsed.success) {
      return { error: parsed.error.message };
    }
  }

  const values = inputs.map((input) => ({
    id: randomUUID(),
    userId: user.id,
    userArchetypeId: input.userArchetypeId || null,
    opponentArchetypeId: input.opponentArchetypeId,
    result: input.result,
    wentFirst: input.wentFirst ?? null,
    format: input.format,
    notes: input.notes || null,
    tags: input.tags || [],
  }));

  await db.insert(matchLogs).values(values);

  // Auto-complete training goals for the opponent
  try {
    await autoCompleteTrainingGoals(user.id, inputs[0].opponentArchetypeId);
  } catch {
    // Non-critical
  }

  revalidatePath("/journal");
  revalidatePath("/journal/stats");
  revalidatePath("/training");

  return { success: true };
}

export async function updateMatchLog(input: UpdateMatchLogInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = updateMatchLogSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const data = parsed.data;

  // Verify ownership
  const [existing] = await db
    .select({ userId: matchLogs.userId })
    .from(matchLogs)
    .where(eq(matchLogs.id, data.id))
    .limit(1);

  if (!existing || existing.userId !== user.id) {
    return { error: "Match not found" };
  }

  await db
    .update(matchLogs)
    .set({
      userArchetypeId: data.userArchetypeId || null,
      opponentArchetypeId: data.opponentArchetypeId,
      result: data.result,
      wentFirst: data.wentFirst ?? null,
      notes: data.notes || null,
    })
    .where(eq(matchLogs.id, data.id));

  revalidatePath("/journal");
  revalidatePath("/journal/stats");

  return { success: true };
}

export async function deleteMatchLog(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify ownership
  const [existing] = await db
    .select({ userId: matchLogs.userId })
    .from(matchLogs)
    .where(eq(matchLogs.id, id))
    .limit(1);

  if (!existing || existing.userId !== user.id) {
    return { error: "Match not found" };
  }

  await db.delete(matchLogs).where(eq(matchLogs.id, id));

  revalidatePath("/journal");
  revalidatePath("/journal/stats");

  return { success: true };
}

async function autoCompleteTrainingGoals(
  userId: string,
  opponentArchetypeId: string
) {
  const today = new Date().toISOString().slice(0, 10);

  // Check if user has an active training plan
  const [activePlan] = await db
    .select()
    .from(trainingPlans)
    .where(
      and(eq(trainingPlans.userId, userId), eq(trainingPlans.status, "active"))
    )
    .limit(1);

  if (!activePlan) return;

  // Get today's goals
  const [todayGoals] = await db
    .select()
    .from(dailyGoals)
    .where(
      and(
        eq(dailyGoals.userId, userId),
        eq(dailyGoals.trainingPlanId, activePlan.id),
        eq(dailyGoals.date, today)
      )
    )
    .limit(1);

  if (!todayGoals) return;

  const updatedGoals = todayGoals.goals.map((goal) => {
    if (goal.completed) return goal;

    // Auto-complete "games" goals (any game counts)
    if (goal.type === "games") {
      return { ...goal, completed: true };
    }

    // Auto-complete "matchup_practice" if opponent matches
    if (
      goal.type === "matchup_practice" &&
      goal.matchupArchetypeId === opponentArchetypeId
    ) {
      return { ...goal, completed: true };
    }

    return goal;
  });

  const allCompleted = updatedGoals.every((g) => g.completed);

  await db
    .update(dailyGoals)
    .set({
      goals: updatedGoals,
      completedAt: allCompleted ? new Date() : null,
    })
    .where(eq(dailyGoals.id, todayGoals.id));
}
