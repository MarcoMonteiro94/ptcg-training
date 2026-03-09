"use server";

import { z } from "zod/v4";
import { db } from "@/server/db";
import { userDecklists } from "@/server/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type { DeckCard } from "@/types";

const deckCardSchema = z.object({
  card_id: z.string().min(1),
  count: z.number().int().min(1).max(60),
});

const saveDeckSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  archetypeId: z.string().optional(),
  format: z.enum(["standard", "expanded", "unlimited"]),
  cards: z.array(deckCardSchema),
});

export type SaveDeckInput = z.infer<typeof saveDeckSchema>;

function validateDeck(cards: DeckCard[]): string[] {
  const errors: string[] = [];
  const totalCards = cards.reduce((sum, c) => sum + c.count, 0);

  if (totalCards !== 60) {
    errors.push(`Deck must have exactly 60 cards (currently ${totalCards})`);
  }

  // Check max 4 copies (basic energy exempt)
  for (const card of cards) {
    if (card.count > 4 && !card.card_id.includes("basic-energy")) {
      errors.push(`${card.card_id}: max 4 copies allowed (has ${card.count})`);
    }
  }

  return errors;
}

export async function saveDeck(input: SaveDeckInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = saveDeckSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const data = parsed.data;
  if (data.cards.length > 0) {
    const validationErrors = validateDeck(data.cards);
    if (validationErrors.length > 0) {
      return { error: validationErrors.join("; ") };
    }
  }

  if (data.id) {
    // Update existing
    const existing = await db
      .select()
      .from(userDecklists)
      .where(and(eq(userDecklists.id, data.id), eq(userDecklists.userId, user.id)))
      .limit(1);

    if (existing.length === 0) return { error: "Deck not found" };

    await db
      .update(userDecklists)
      .set({
        name: data.name,
        archetypeId: data.archetypeId || null,
        format: data.format,
        cards: data.cards,
        updatedAt: new Date(),
      })
      .where(eq(userDecklists.id, data.id));

    revalidatePath("/decks/builder");
    return { success: true, id: data.id };
  }

  // Create new
  const id = randomUUID();
  await db.insert(userDecklists).values({
    id,
    userId: user.id,
    name: data.name,
    archetypeId: data.archetypeId || null,
    format: data.format,
    cards: data.cards,
  });

  revalidatePath("/decks/builder");
  return { success: true, id };
}

export async function getUserDecks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return db
    .select()
    .from(userDecklists)
    .where(eq(userDecklists.userId, user.id))
    .orderBy(userDecklists.updatedAt);
}

export async function deleteDeck(deckId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  await db
    .delete(userDecklists)
    .where(and(eq(userDecklists.id, deckId), eq(userDecklists.userId, user.id)));

  revalidatePath("/decks/builder");
  return { success: true };
}
