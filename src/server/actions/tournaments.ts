"use server";

import { z } from "zod/v4";
import { db } from "@/server/db";
import { userTournaments, matchLogs } from "@/server/db/schema";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

const createTournamentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  format: z.enum(["standard", "expanded", "unlimited"]),
  userArchetypeId: z.string().optional(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

const updateTournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  placing: z.number().int().positive().optional(),
  notes: z.string().optional(),
  userArchetypeId: z.string().optional(),
});

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;

const addRoundSchema = z.object({
  tournamentId: z.string().min(1),
  roundNumber: z.number().int().positive(),
  opponentArchetypeId: z.string().optional(),
  games: z
    .array(
      z.object({
        result: z.enum(["win", "loss", "draw"]),
        wentFirst: z.boolean().optional(),
      })
    )
    .min(1)
    .max(3),
});

export type AddRoundInput = z.infer<typeof addRoundSchema>;

export async function createUserTournament(input: CreateTournamentInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = createTournamentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const data = parsed.data;
  const tournamentId = randomUUID();

  await db.insert(userTournaments).values({
    id: tournamentId,
    userId: user.id,
    name: data.name,
    date: data.date,
    format: data.format,
    userArchetypeId: data.userArchetypeId || null,
  });

  revalidatePath("/tournaments");

  return { success: true, tournamentId };
}

export async function updateUserTournament(input: UpdateTournamentInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = updateTournamentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const data = parsed.data;

  const [existing] = await db
    .select({ userId: userTournaments.userId })
    .from(userTournaments)
    .where(eq(userTournaments.id, data.id))
    .limit(1);

  if (!existing || existing.userId !== user.id) {
    return { error: "Tournament not found" };
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.placing !== undefined) updates.placing = data.placing;
  if (data.notes !== undefined) updates.notes = data.notes || null;
  if (data.userArchetypeId !== undefined) updates.userArchetypeId = data.userArchetypeId || null;

  await db
    .update(userTournaments)
    .set(updates)
    .where(eq(userTournaments.id, data.id));

  revalidatePath("/tournaments");
  revalidatePath(`/tournaments/${data.id}`);

  return { success: true };
}

export async function deleteUserTournament(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const [existing] = await db
    .select({ userId: userTournaments.userId })
    .from(userTournaments)
    .where(eq(userTournaments.id, id))
    .limit(1);

  if (!existing || existing.userId !== user.id) {
    return { error: "Tournament not found" };
  }

  await db.delete(userTournaments).where(eq(userTournaments.id, id));

  revalidatePath("/tournaments");
  revalidatePath("/journal");

  return { success: true };
}

export async function addTournamentRound(input: AddRoundInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = addRoundSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const data = parsed.data;

  // Get tournament to inherit userArchetypeId and format
  const [tournament] = await db
    .select()
    .from(userTournaments)
    .where(
      and(
        eq(userTournaments.id, data.tournamentId),
        eq(userTournaments.userId, user.id)
      )
    )
    .limit(1);

  if (!tournament) return { error: "Tournament not found" };

  const values = data.games.map((game) => ({
    id: randomUUID(),
    userId: user.id,
    userArchetypeId: tournament.userArchetypeId,
    opponentArchetypeId: data.opponentArchetypeId || null,
    result: game.result,
    wentFirst: game.wentFirst ?? null,
    format: tournament.format,
    notes: null,
    tags: [],
    userTournamentId: tournament.id,
    roundNumber: data.roundNumber,
  }));

  await db.insert(matchLogs).values(values);

  revalidatePath(`/tournaments/${tournament.id}`);
  revalidatePath("/tournaments");
  revalidatePath("/journal");

  return { success: true };
}

export async function deleteTournamentRound(
  tournamentId: string,
  roundNumber: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Verify ownership
  const [tournament] = await db
    .select({ userId: userTournaments.userId })
    .from(userTournaments)
    .where(eq(userTournaments.id, tournamentId))
    .limit(1);

  if (!tournament || tournament.userId !== user.id) {
    return { error: "Tournament not found" };
  }

  await db
    .delete(matchLogs)
    .where(
      and(
        eq(matchLogs.userTournamentId, tournamentId),
        eq(matchLogs.roundNumber, roundNumber)
      )
    );

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  revalidatePath("/journal");

  return { success: true };
}
