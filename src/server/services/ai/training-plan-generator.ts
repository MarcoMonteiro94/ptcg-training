import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { db } from "@/server/db";
import {
  matchLogs,
  archetypes,
  metaSnapshots,
  profiles,
} from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { TrainingPlanData } from "@/server/db/schema/user-data";

const anthropic = new Anthropic();

const trainingPlanSchema = z.object({
  focus: z.string(),
  weeklyGameTarget: z.number(),
  priorityMatchups: z.array(
    z.object({
      archetypeId: z.string(),
      archetypeName: z.string(),
      reason: z.string(),
    })
  ),
  studyTopics: z.array(z.string()),
  aiRationale: z.string(),
});

interface GeneratePlanOptions {
  userId: string;
  archetypeId: string;
  weeklyGameTarget: number;
}

export async function generateWeeklyPlan(
  options: GeneratePlanOptions
): Promise<TrainingPlanData> {
  const { userId, archetypeId, weeklyGameTarget } = options;

  // Gather context
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  const format = profile?.preferredFormat || "standard";

  const selectedArchetype = await db
    .select()
    .from(archetypes)
    .where(eq(archetypes.id, archetypeId))
    .limit(1);

  const deckName = selectedArchetype[0]?.name || "Unknown Deck";

  // Last 2 weeks of matches
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentMatches = await db
    .select()
    .from(matchLogs)
    .where(eq(matchLogs.userId, userId))
    .orderBy(desc(matchLogs.playedAt))
    .limit(100);

  const twoWeekMatches = recentMatches.filter(
    (m) => m.playedAt >= twoWeeksAgo
  );

  // Calculate matchup record
  const allActiveArchetypes = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.format, format), eq(archetypes.isActive, true)));

  const archetypeMap = Object.fromEntries(
    allActiveArchetypes.map((a) => [a.id, a.name])
  );

  const matchupRecord: Record<string, { wins: number; losses: number; total: number }> = {};
  for (const match of twoWeekMatches) {
    const opp = match.opponentArchetypeId || "unknown";
    if (!matchupRecord[opp]) matchupRecord[opp] = { wins: 0, losses: 0, total: 0 };
    matchupRecord[opp].total++;
    if (match.result === "win") matchupRecord[opp].wins++;
    else if (match.result === "loss") matchupRecord[opp].losses++;
  }

  const worstMatchups = Object.entries(matchupRecord)
    .filter(([, d]) => d.total >= 2)
    .map(([id, d]) => ({
      id,
      name: archetypeMap[id] || id,
      winRate: Math.round((d.wins / d.total) * 100),
      total: d.total,
    }))
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 5);

  // Get meta snapshot
  const latestSnapshot = await db
    .select()
    .from(metaSnapshots)
    .where(eq(metaSnapshots.format, format))
    .orderBy(desc(metaSnapshots.date))
    .limit(1);

  const tierList = latestSnapshot[0]?.data
    ?.map(
      (d) =>
        `${archetypeMap[d.archetype_id] || d.archetype_id}: ${d.tier} tier (${Math.round(d.usage_rate * 100)}% usage)`
    )
    .join("\n") || "No tier data";

  const totalGames = twoWeekMatches.length;
  const totalWins = twoWeekMatches.filter((m) => m.result === "win").length;
  const overallWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  const prompt = `You are a Pokemon TCG competitive coach creating a weekly training plan.

## Player Info
- Deck: ${deckName}
- Format: ${format}
- Weekly game target: ${weeklyGameTarget}
- Last 2 weeks: ${totalGames} games, ${overallWinRate}% win rate

## Worst Matchups (last 2 weeks)
${worstMatchups.map((m) => `- vs ${m.name}: ${m.winRate}% win rate (${m.total} games)`).join("\n") || "No matchup data yet"}

## Current Meta
${tierList}

## Available Archetype IDs
${allActiveArchetypes.map((a) => `${a.id}: ${a.name}`).join("\n")}

Create a focused weekly training plan. Prioritize improving the worst matchups that are meta-relevant (high usage opponents). Include 2-3 priority matchups to practice, 2-3 study topics, and a clear rationale.

Respond ONLY with valid JSON (no markdown, no code blocks):
{"focus":"<one sentence focus>","weeklyGameTarget":${weeklyGameTarget},"priorityMatchups":[{"archetypeId":"<id>","archetypeName":"<name>","reason":"<why>"}],"studyTopics":["<topic>"],"aiRationale":"<2-3 sentences explaining the plan>"}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const parsed = trainingPlanSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`Failed to parse training plan: ${parsed.error.message}`);
  }

  return parsed.data;
}
