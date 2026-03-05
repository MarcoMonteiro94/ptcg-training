import { db } from "@/server/db";
import {
  matchLogs,
  archetypes,
  metaSnapshots,
  profiles,
  userDecklists,
  trainingPlans,
  dailyGoals,
} from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";

interface CoachContextOptions {
  mode?: "general" | "study";
  matchupArchetypeId?: string;
}

export async function buildCoachContext(userId: string, options: CoachContextOptions = {}) {
  const { mode = "general", matchupArchetypeId } = options;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  const format = "standard" as const;

  const recentMatches = await db
    .select()
    .from(matchLogs)
    .where(eq(matchLogs.userId, userId))
    .orderBy(desc(matchLogs.playedAt))
    .limit(50);

  const allArchetypes = await db
    .select()
    .from(archetypes)
    .where(and(eq(archetypes.format, format), eq(archetypes.isActive, true)));

  const archetypeMap = Object.fromEntries(allArchetypes.map((a) => [a.id, a.name]));

  const latestSnapshot = await db
    .select()
    .from(metaSnapshots)
    .where(eq(metaSnapshots.format, format))
    .orderBy(desc(metaSnapshots.date))
    .limit(1);

  const activeDeck = profile?.activeDeckId
    ? await db
        .select()
        .from(userDecklists)
        .where(eq(userDecklists.id, profile.activeDeckId))
        .limit(1)
    : [];

  // Calculate user stats
  const total = recentMatches.length;
  const wins = recentMatches.filter((m) => m.result === "win").length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  // Find worst matchups
  const matchupRecord: Record<string, { wins: number; total: number }> = {};
  for (const match of recentMatches) {
    const opp = match.opponentArchetypeId || "unknown";
    if (!matchupRecord[opp]) matchupRecord[opp] = { wins: 0, total: 0 };
    matchupRecord[opp].total++;
    if (match.result === "win") matchupRecord[opp].wins++;
  }

  const worstMatchups = Object.entries(matchupRecord)
    .map(([id, data]) => ({
      opponent: archetypeMap[id] || id,
      winRate: Math.round((data.wins / data.total) * 100),
      total: data.total,
    }))
    .filter((m) => m.total >= 3)
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 5);

  // Build tier list string with identifier cards
  const archetypeDetailMap = Object.fromEntries(
    allArchetypes.map((a) => [a.id, { name: a.name, cards: a.identifierCards }])
  );

  const tierList = latestSnapshot[0]?.data
    ?.map((d) => {
      const detail = archetypeDetailMap[d.archetype_id];
      const name = detail?.name || d.archetype_id;
      const cards = detail?.cards?.length ? ` [Key cards: ${detail.cards.join(", ")}]` : "";
      return `${name}: ${d.tier} tier (${Math.round(d.usage_rate * 100)}% usage)${cards}`;
    })
    .join("\n") || allArchetypes
      .map((a) => `${a.name}: ${a.tier || "?"} tier [Key cards: ${a.identifierCards.join(", ")}]`)
      .join("\n");

  // Get training context
  let trainingContext = "";
  try {
    const [activePlan] = await db
      .select()
      .from(trainingPlans)
      .where(
        and(
          eq(trainingPlans.userId, userId),
          eq(trainingPlans.status, "active")
        )
      )
      .limit(1);

    if (activePlan) {
      const today = new Date().toISOString().slice(0, 10);
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

      const goalsCompleted = todayGoals?.goals.filter((g) => g.completed).length ?? 0;
      const goalsTotal = todayGoals?.goals.length ?? 0;
      const remainingGoals = todayGoals?.goals.filter((g) => !g.completed).map((g) => g.description) ?? [];

      trainingContext = `
## Active Training Plan
- Focus: ${activePlan.plan.focus}
- Weekly game target: ${activePlan.plan.weeklyGameTarget}
- Priority matchups: ${activePlan.plan.priorityMatchups.map((m) => m.archetypeName).join(", ")}

## Today's Progress
- Goals: ${goalsCompleted}/${goalsTotal} completed
${remainingGoals.length > 0 ? `- Remaining: ${remainingGoals.join(", ")}` : "- All goals completed! Great work!"}`;
    }
  } catch {
    // Training data not available
  }

  // Build study mode context
  let studyContext = "";
  if (mode === "study" && matchupArchetypeId) {
    const studyArchetype = allArchetypes.find((a) => a.id === matchupArchetypeId);
    const matchupName = studyArchetype?.name || matchupArchetypeId;

    // Find personal record against this archetype
    const vsMatches = recentMatches.filter(
      (m) => m.opponentArchetypeId === matchupArchetypeId
    );
    const vsWins = vsMatches.filter((m) => m.result === "win").length;
    const vsTotal = vsMatches.length;
    const vsWinRate = vsTotal > 0 ? Math.round((vsWins / vsTotal) * 100) : 0;

    studyContext = `
## STUDY MODE: ${matchupName} Matchup
You are in focused study mode for the ${matchupName} matchup.
- Player's record vs ${matchupName}: ${vsWinRate}% win rate (${vsWins}/${vsTotal} games)
- Focus all advice on this specific matchup
- Cover: key cards, sequencing, prize mapping, tech options, when to go first/second
- Be detailed and strategic`;
  }

  // Build guidelines based on mode
  const baseGuidelines = `- Give specific, actionable advice based on the player's actual data
- Reference real matchup percentages and meta trends
- Suggest tech cards and deck adjustments backed by tournament results
- Be encouraging but honest about weaknesses
- Keep responses focused and practical
- If the player asks about a matchup, use their personal data when available`;

  const trainingGuidelines = trainingContext
    ? `\n- Reference daily goals and training progress when relevant
- If the player has remaining goals, encourage them
- Suggest adding weak matchups to their training plan
- After a losing streak (3+ losses), suggest taking a break`
    : "";

  return {
    systemPrompt: `You are an expert Pokemon TCG competitive coach specializing in the current Standard format (Scarlet & Violet era — SVI through Astral Crown).

CRITICAL RULES:
- ONLY reference cards currently legal in Standard format (regulation marks G, H, and later).
- NEVER suggest cards like Marnie (Supporter), Battle VIP Pass, Quick Ball (original), or any Sun & Moon / Sword & Shield era cards unless they have been reprinted in a Standard-legal set.
- When discussing an archetype, reference the KEY CARDS listed below — these are the actual cards used in competitive tournament decks.
- If you are unsure about a specific card's legality or a deck's strategy, say so rather than guessing.

## Current Meta (Standard format)
${tierList}

## Player Stats (last 50 matches)
- Overall: ${winRate}% win rate (${wins}/${total})
- Active deck: ${activeDeck[0]?.name || "Not set"}
${worstMatchups.length > 0 ? `\n## Worst Matchups\n${worstMatchups.map((m) => `- vs ${m.opponent}: ${m.winRate}% (${m.total} games)`).join("\n")}` : ""}
${trainingContext}${studyContext}

## Guidelines
${baseGuidelines}${trainingGuidelines}`,
    recentMatches: recentMatches.slice(0, 10).map((m) => ({
      result: m.result,
      opponent: archetypeMap[m.opponentArchetypeId || ""] || "Unknown",
      wentFirst: m.wentFirst,
      notes: m.notes,
      date: m.playedAt.toISOString().slice(0, 10),
    })),
  };
}
