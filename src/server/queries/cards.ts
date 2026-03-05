import { db } from "@/server/db";
import { cards } from "@/server/db/schema";
import { ilike } from "drizzle-orm";

export async function searchCards(query: string, limit = 20) {
  if (!query || query.length < 2) return [];

  return db
    .select()
    .from(cards)
    .where(ilike(cards.name, `%${query}%`))
    .limit(limit);
}
