import { classifyDeckByNames } from "./archetype-classifier";
import type { ParsedGameLog } from "./game-log-parser";

interface ArchetypeData {
  id: string;
  name: string;
  identifierCards: string[];
}

export interface ClassifiedLog {
  playerArchetypeId: string | null;
  opponentArchetypeId: string | null;
  playerConfidence: number;
  opponentConfidence: number;
}

/**
 * Classifies both player and opponent decks from parsed game log data.
 * Uses the existing archetype-classifier's name-based matching.
 */
export function classifyGameLog(
  parsed: ParsedGameLog,
  archetypes: ArchetypeData[]
): ClassifiedLog {
  const playerResult =
    parsed.playerCards.length > 0
      ? classifyDeckByNames(parsed.playerCards, archetypes)
      : null;

  const opponentResult =
    parsed.opponentCards.length > 0
      ? classifyDeckByNames(parsed.opponentCards, archetypes)
      : null;

  return {
    playerArchetypeId: playerResult?.id ?? null,
    opponentArchetypeId: opponentResult?.id ?? null,
    playerConfidence: playerResult?.confidence ?? 0,
    opponentConfidence: opponentResult?.confidence ?? 0,
  };
}
