"use server";

import { z } from "zod/v4";
import { db } from "@/server/db";
import { matchLogs } from "@/server/db/schema";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

const submitParsedLogSchema = z.object({
  userArchetypeId: z.string().optional(),
  opponentArchetypeId: z.string().min(1, "Opponent archetype is required"),
  result: z.enum(["win", "loss", "draw"]),
  wentFirst: z.boolean().optional(),
  format: z.enum(["standard", "expanded", "unlimited"]),
  notes: z.string().optional(),
});

export type SubmitParsedLogInput = z.infer<typeof submitParsedLogSchema>;

export async function submitParsedLog(input: SubmitParsedLogInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = submitParsedLogSchema.safeParse(input);
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
    tags: ["game-log-import"],
  });

  revalidatePath("/journal");
  revalidatePath("/journal/stats");

  return { success: true };
}
