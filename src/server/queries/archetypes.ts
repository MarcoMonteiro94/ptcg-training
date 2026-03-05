import { db } from "@/server/db";
import { archetypes } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { Format } from "@/types";

export async function getActiveArchetypes(format: Format = "standard") {
  return db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.format, format), eq(archetypes.isActive, true)))
    .orderBy(archetypes.name);
}

export async function getArchetypeBySlug(slug: string) {
  const results = await db
    .select()
    .from(archetypes)
    .where(eq(archetypes.slug, slug))
    .limit(1);
  return results[0] ?? null;
}

export async function getAllArchetypes() {
  return db.select().from(archetypes).orderBy(archetypes.name);
}
