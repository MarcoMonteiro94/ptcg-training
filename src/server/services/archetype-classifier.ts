import type { DeckCard } from "@/types";

interface ArchetypeDefinition {
  id: string;
  name: string;
  identifierCards: string[];
}

/**
 * Rule-based archetype classifier using identifier cards.
 * Each archetype has a set of key cards. The deck is classified
 * as the archetype whose identifier cards have the best match.
 */
export function classifyDeck(
  deckCards: DeckCard[],
  archetypes: ArchetypeDefinition[]
): string | null {
  const cardIds = new Set(deckCards.map((c) => c.card_id));

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const archetype of archetypes) {
    const matchCount = archetype.identifierCards.filter((id) =>
      cardIds.has(id)
    ).length;
    const score = matchCount / archetype.identifierCards.length;

    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = archetype.id;
    }
  }

  return bestMatch;
}

/**
 * Classify by card names (for when we only have card names, not IDs).
 * Uses fuzzy matching: a log card name like "Dragapult ex" matches
 * an identifier card "Dragapult" if the log name starts with the identifier.
 *
 * Returns the best match along with a confidence score (0-1).
 * Prefers archetypes where ALL identifier cards are matched.
 * Breaks ties by preferring archetypes with more identifier cards
 * (more specific = better match).
 */
export function classifyDeckByNames(
  cardNames: string[],
  archetypes: { id: string; name: string; identifierCards: string[] }[]
): { id: string; confidence: number } | null {
  const normalizedCards = cardNames.map((n) => n.toLowerCase().trim());

  let bestMatch: string | null = null;
  let bestScore = 0;
  let bestMatchCount = 0;
  let bestTotalIdentifiers = 0;

  for (const archetype of archetypes) {
    const matchCount = archetype.identifierCards.filter((identifier) => {
      const idLower = identifier.toLowerCase();
      return normalizedCards.some((card) => fuzzyCardMatch(card, idLower));
    }).length;
    const score = matchCount / archetype.identifierCards.length;

    if (score < 0.5) continue;

    // Prefer higher score first, then more matched cards (more specific),
    // then more total identifiers (more specific archetype)
    const isBetter =
      score > bestScore ||
      (score === bestScore && matchCount > bestMatchCount) ||
      (score === bestScore && matchCount === bestMatchCount && archetype.identifierCards.length > bestTotalIdentifiers);

    if (isBetter) {
      bestScore = score;
      bestMatch = archetype.id;
      bestMatchCount = matchCount;
      bestTotalIdentifiers = archetype.identifierCards.length;
    }
  }

  if (!bestMatch) return null;

  return { id: bestMatch, confidence: bestScore };
}

/**
 * Fuzzy match a card name from a game log against an archetype identifier.
 *
 * Examples:
 * - "dragapult ex" matches "dragapult ex" (exact) ✓
 * - "dragapult ex" matches "dragapult" (starts with) ✓
 * - "marnie's grimmsnarl ex" matches "marnie's grimmsnarl" ✓
 * - "gholdengo ex" matches "gholdengo ex" ✓
 * - "charizard ex" matches "charizard ex" ✓
 * - "dreepy" does NOT match "dragapult" ✗
 */
function fuzzyCardMatch(logCard: string, identifier: string): boolean {
  // Exact match
  if (logCard === identifier) return true;

  // Log card starts with the identifier (e.g., "dragapult ex" starts with "dragapult")
  if (logCard.length > identifier.length && logCard.startsWith(identifier) && logCard[identifier.length] === " ") {
    return true;
  }

  // Identifier starts with log card (e.g., identifier "charizard ex" and log has "charizard")
  if (identifier.length > logCard.length && identifier.startsWith(logCard) && identifier[logCard.length] === " ") {
    return true;
  }

  // Handle possessive forms: "marnie's grimmsnarl" in log matches "grimmsnarl" identifier
  if (logCard.includes("'s ") && !identifier.includes("'s ")) {
    const afterPossessive = logCard.split("'s ").pop()?.toLowerCase();
    if (afterPossessive && fuzzyCardMatch(afterPossessive, identifier)) return true;
  }

  // Handle identifier with possessive: "n's zoroark" identifier matches "zoroark" in log
  if (identifier.includes("'s ") && !logCard.includes("'s ")) {
    const afterPossessive = identifier.split("'s ").pop()?.toLowerCase();
    if (afterPossessive && fuzzyCardMatch(logCard, afterPossessive)) return true;
  }

  return false;
}
