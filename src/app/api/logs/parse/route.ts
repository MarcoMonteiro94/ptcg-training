import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseGameLog } from "@/server/services/game-log-parser";
import { classifyGameLog } from "@/server/services/log-classifier";
import { db } from "@/server/db";
import { archetypes } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { logText } = body as { logText?: string };

  if (!logText || typeof logText !== "string" || logText.length > 50000) {
    return NextResponse.json(
      { error: "Invalid log text. Must be a string under 50,000 characters." },
      { status: 400 }
    );
  }

  const parsed = parseGameLog(logText);

  // Classify decks using existing archetypes
  let allArchetypes: Array<{ id: string; name: string; identifierCards: string[] }> = [];
  try {
    allArchetypes = await db
      .select({
        id: archetypes.id,
        name: archetypes.name,
        identifierCards: archetypes.identifierCards,
      })
      .from(archetypes)
      .where(eq(archetypes.isActive, true));
  } catch {
    // DB not connected - return parsed data without classification
  }

  const classification = classifyGameLog(parsed, allArchetypes);

  // Resolve archetype names for display
  const archetypeMap = new Map(allArchetypes.map((a) => [a.id, a.name]));

  // For TCG Masters logs, extract internal winner info
  const winnerPlayer = (parsed as unknown as Record<string, unknown>)._winnerPlayer as string | undefined;

  return NextResponse.json({
    parsed: {
      playerName: parsed.playerName,
      opponentName: parsed.opponentName,
      result: parsed.result,
      wentFirst: parsed.wentFirst,
      turnCount: parsed.turnCount,
      playerCards: parsed.playerCards,
      opponentCards: parsed.opponentCards,
      confidence: parsed.confidence,
      source: parsed.source,
      needsPlayerIdentity: parsed.needsPlayerIdentity,
      winnerPlayer: winnerPlayer ?? null,
    },
    classification: {
      playerArchetypeId: classification.playerArchetypeId,
      playerArchetypeName: classification.playerArchetypeId
        ? archetypeMap.get(classification.playerArchetypeId) ?? null
        : null,
      playerConfidence: classification.playerConfidence,
      opponentArchetypeId: classification.opponentArchetypeId,
      opponentArchetypeName: classification.opponentArchetypeId
        ? archetypeMap.get(classification.opponentArchetypeId) ?? null
        : null,
      opponentConfidence: classification.opponentConfidence,
    },
  });
}
