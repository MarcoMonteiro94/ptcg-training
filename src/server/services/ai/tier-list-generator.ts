import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { db } from "@/server/db";
import {
  archetypes,
  matchupStats,
  tournamentStandings,
} from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Format, ArchetypeTier } from "@/types";
import { calculateMetaScores, type ArchetypeRawData } from "../meta-scoring";

const anthropic = new Anthropic();

const tierEntrySchema = z.object({
  archetypeId: z.string(),
  tier: z.enum(["S", "A", "B", "C", "D"]),
  justification: z.string(),
});

const tierListResponseSchema = z.object({
  tiers: z.array(tierEntrySchema),
});

export interface TierListEntry {
  archetypeId: string;
  tier: ArchetypeTier;
  justification: string;
}

export interface TierListResult {
  entries: TierListEntry[];
  generatedAt: Date;
}

export async function generateAITierList(
  format: Format = "standard"
): Promise<TierListResult> {
  // Gather data for the prompt
  const activeArchetypes = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.format, format), eq(archetypes.isActive, true)));

  if (activeArchetypes.length === 0) {
    return { entries: [], generatedAt: new Date() };
  }

  // Get tournament placement data
  const archetypeData = await Promise.all(
    activeArchetypes.map(async (arch) => {
      // Total placements
      const standingCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(tournamentStandings)
        .where(eq(tournamentStandings.archetypeId, arch.id));

      // Top 8 placements
      const top8Count = await db
        .select({ count: sql<number>`count(*)` })
        .from(tournamentStandings)
        .where(
          and(
            eq(tournamentStandings.archetypeId, arch.id),
            sql`${tournamentStandings.placing} <= 8`
          )
        );

      // Top 32 placements
      const top32Count = await db
        .select({ count: sql<number>`count(*)` })
        .from(tournamentStandings)
        .where(
          and(
            eq(tournamentStandings.archetypeId, arch.id),
            sql`${tournamentStandings.placing} <= 32`
          )
        );

      // Matchup stats (as archetype A)
      const matchupsA = await db
        .select()
        .from(matchupStats)
        .where(
          and(
            eq(matchupStats.archetypeAId, arch.id),
            eq(matchupStats.format, format),
            sql`${matchupStats.totalGames} > 0`
          )
        );

      // Matchup stats (as archetype B)
      const matchupsB = await db
        .select()
        .from(matchupStats)
        .where(
          and(
            eq(matchupStats.archetypeBId, arch.id),
            eq(matchupStats.format, format),
            sql`${matchupStats.totalGames} > 0`
          )
        );

      // Calculate overall win rate across matchups
      let totalWins = 0;
      let totalGames = 0;

      for (const m of matchupsA) {
        totalWins += m.wins;
        totalGames += m.totalGames;
      }
      for (const m of matchupsB) {
        totalWins += m.losses; // When this deck is B, opponent's losses = our wins
        totalGames += m.totalGames;
      }

      const overallWinRate = totalGames > 0 ? totalWins / totalGames : 0;

      return {
        id: arch.id,
        name: arch.name,
        totalPlacements: standingCount[0]?.count ?? 0,
        top8: top8Count[0]?.count ?? 0,
        top32: top32Count[0]?.count ?? 0,
        overallWinRate: Math.round(overallWinRate * 100),
        matchupSpread: matchupsA.length + matchupsB.length,
      };
    })
  );

  // Calculate usage rates and meta scores
  const totalPlacements = archetypeData.reduce(
    (sum, a) => sum + a.totalPlacements,
    0
  );

  const rawForScoring: ArchetypeRawData[] = archetypeData.map((a) => ({
    archetypeId: a.id,
    usageRate: totalPlacements > 0 ? a.totalPlacements / totalPlacements : 0,
    winRate: a.overallWinRate / 100,
    top8Count: a.top8,
    top32Count: a.top32,
    totalPlacements: a.totalPlacements,
    totalGames: a.matchupSpread,
    matchupWinRates: [],
  }));
  const metaScores = calculateMetaScores(rawForScoring);
  const scoreMap = new Map(metaScores.map((s) => [s.archetypeId, s.metaScore]));

  const archetypeLines = archetypeData
    .sort((a, b) => b.totalPlacements - a.totalPlacements)
    .map(
      (a) =>
        `- ${a.name} (id: ${a.id}): ${a.totalPlacements} placements (${totalPlacements > 0 ? Math.round((a.totalPlacements / totalPlacements) * 100) : 0}% usage), ${a.top8} top-8, ${a.top32} top-32, ${a.overallWinRate}% win rate, ${a.matchupSpread} matchup data points, meta score: ${scoreMap.get(a.id) ?? 0}/100`
    )
    .join("\n");

  const prompt = `You are analyzing competitive Pokemon TCG tournament data for the ${format} format. Based on the following archetype statistics from official tournaments (Regionals, Internationals, Worlds), assign each archetype a tier (S, A, B, C, or D) and provide a brief justification.

## Tier Criteria
- **S Tier**: Dominant. High usage + high win rate + multiple top 8 finishes. Best deck in the format.
- **A Tier**: Strong. Consistently performs well, solid matchup spread, frequent top placements.
- **B Tier**: Viable. Competitive but has notable weaknesses or inconsistencies.
- **C Tier**: Niche. Can win but struggles in the current meta. Limited top results.
- **D Tier**: Fringe. Rarely places well, poor matchup spread, not recommended for competitive play.

## Archetype Data
${archetypeLines}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{"tiers":[{"archetypeId":"<id>","tier":"<S|A|B|C|D>","justification":"<brief reason>"}]}

Include ALL archetypes listed above.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse and validate the response
  const parsed = tierListResponseSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`Failed to parse AI tier list response: ${parsed.error.message}`);
  }

  // Update archetype tiers and justifications in the database
  for (const entry of parsed.data.tiers) {
    await db
      .update(archetypes)
      .set({
        tier: entry.tier,
        description: entry.justification,
        updatedAt: new Date(),
      })
      .where(eq(archetypes.id, entry.archetypeId));
  }

  return {
    entries: parsed.data.tiers,
    generatedAt: new Date(),
  };
}
