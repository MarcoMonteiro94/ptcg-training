/**
 * Parser for Pokemon TCG Live game logs.
 *
 * PTCG Live logs follow this text format:
 * - "Setup" section with coin flip, opening hands, active spot
 * - "Turn # N - PlayerName's Turn" markers
 * - "PlayerName played CardName to the Bench/Active Spot."
 * - "PlayerName evolved CardName to CardName on the Bench."
 * - "PlayerName attached CardName to CardName..."
 * - "PlayerName's CardName used AttackName..."
 * - "Opponent conceded. PlayerName wins."
 * - Bullet lists "• CardName" for drawn/discarded cards
 */

export interface ParsedGameLog {
  playerCards: string[];
  opponentCards: string[];
  result: "win" | "loss" | "draw" | null;
  wentFirst: boolean | null;
  playerName: string | null;
  opponentName: string | null;
  confidence: number;
  turnCount: number;
}

// Cards/tokens to ignore (not deck identifiers)
const IGNORE_TOKENS = new Set([
  "a card",
  "cards",
  "a prize card",
  "prize cards",
  "the coin",
  "their deck",
  "their hand",
  "hand",
]);

// Energy cards to ignore (not deck identifiers)
const ENERGY_PATTERN = /\b(basic\s+)?(fire|water|grass|electric|psychic|fighting|darkness|metal|fairy|lightning|dragon)\s+energy\b/i;

export function parseGameLog(logText: string): ParsedGameLog {
  const lines = logText.split("\n").map((l) => l.trim()).filter(Boolean);

  const result: ParsedGameLog = {
    playerCards: [],
    opponentCards: [],
    result: null,
    wentFirst: null,
    playerName: null,
    opponentName: null,
    confidence: 0,
    turnCount: 0,
  };

  if (lines.length === 0) return result;

  // Step 1: Detect player names from the log
  const names = detectPlayerNames(lines);
  if (names.length >= 2) {
    result.playerName = names[0];
    result.opponentName = names[1];
  } else if (names.length === 1) {
    result.playerName = names[0];
  }

  const playerCardSet = new Set<string>();
  const opponentCardSet = new Set<string>();
  let maxTurn = 0;
  let currentTurnPlayer: string | null = null;

  for (const line of lines) {
    // Track turn markers: "Turn # N - PlayerName's Turn"
    const turnMatch = /^Turn\s*#?\s*(\d+)\s*-\s*(.+?)(?:'s\s+Turn)?$/i.exec(line);
    if (turnMatch) {
      maxTurn = Math.max(maxTurn, parseInt(turnMatch[1], 10));
      currentTurnPlayer = turnMatch[2].trim();
      continue;
    }

    // Detect who went first/second
    if (result.wentFirst === null) {
      // "PlayerName decided to go first/second"
      const goMatch = /^(.+?)\s+decided\s+to\s+go\s+(first|second)/i.exec(line);
      if (goMatch) {
        const decider = goMatch[1].trim();
        const choice = goMatch[2].toLowerCase();
        if (choice === "first") {
          result.wentFirst = decider === result.playerName;
        } else {
          // Decided to go second means the OTHER player goes first
          result.wentFirst = decider !== result.playerName;
        }
      }

      // "PlayerName won the coin toss" + context
      const coinMatch = /^(.+?)\s+won\s+the\s+coin\s+toss/i.exec(line);
      if (coinMatch) {
        // Just note the coin winner; the "decided to go" line determines first
      }
    }

    // Extract cards from bullet point lists: "• CardName" or "• CardName, CardName"
    const bulletMatch = /^\s*[•·\-]\s+(.+)$/i.exec(line);
    if (bulletMatch) {
      const bulletContent = bulletMatch[1];
      // Split by comma for multi-card bullet lines
      const cardNames = bulletContent.split(",").map((c) => c.trim());
      for (const rawName of cardNames) {
        const card = cleanCardName(rawName);
        if (card && !isIgnoredToken(card)) {
          const targetSet = currentTurnPlayer === result.playerName ? playerCardSet :
                            currentTurnPlayer === result.opponentName ? opponentCardSet : null;
          if (targetSet) targetSet.add(card);
        }
      }
      continue;
    }

    // "PlayerName played CardName to the Bench/Active Spot"
    const playedMatch = /^(.+?)\s+played\s+(.+?)(?:\s+to\s+the\s+(?:Bench|Active\s+Spot))?\.?$/i.exec(line);
    if (playedMatch) {
      const actor = playedMatch[1].trim();
      const card = cleanCardName(playedMatch[2]);
      if (card && !isIgnoredToken(card)) {
        addCardForActor(actor, card, result, playerCardSet, opponentCardSet);
      }
      continue;
    }

    // "PlayerName evolved CardA to CardB on the Bench/Active Spot"
    const evolvedMatch = /^(.+?)\s+evolved\s+(.+?)\s+to\s+(.+?)(?:\s+(?:on|in)\s+the\s+(?:Bench|Active\s+Spot))?\.?$/i.exec(line);
    if (evolvedMatch) {
      const actor = evolvedMatch[1].trim();
      const fromCard = cleanCardName(evolvedMatch[2]);
      const toCard = cleanCardName(evolvedMatch[3]);
      if (fromCard && !isIgnoredToken(fromCard)) {
        addCardForActor(actor, fromCard, result, playerCardSet, opponentCardSet);
      }
      if (toCard && !isIgnoredToken(toCard)) {
        addCardForActor(actor, toCard, result, playerCardSet, opponentCardSet);
      }
      continue;
    }

    // "PlayerName attached CardName to CardName..."
    const attachedMatch = /^(.+?)\s+attached\s+(.+?)\s+to\s+/i.exec(line);
    if (attachedMatch) {
      const actor = attachedMatch[1].trim();
      const card = cleanCardName(attachedMatch[2]);
      if (card && !isIgnoredToken(card)) {
        addCardForActor(actor, card, result, playerCardSet, opponentCardSet);
      }
      continue;
    }

    // "PlayerName's CardName used AttackName"
    const usedMatch = /^(.+?)'s\s+(.+?)\s+used\s+/i.exec(line);
    if (usedMatch) {
      const actor = usedMatch[1].trim();
      const card = cleanCardName(usedMatch[2]);
      if (card && !isIgnoredToken(card)) {
        addCardForActor(actor, card, result, playerCardSet, opponentCardSet);
      }
      continue;
    }

    // "PlayerName's CardName is now in the Active Spot"
    const activeMatch = /^(.+?)'s\s+(.+?)\s+is\s+now\s+in\s+the\s+Active/i.exec(line);
    if (activeMatch) {
      const actor = activeMatch[1].trim();
      const card = cleanCardName(activeMatch[2]);
      if (card && !isIgnoredToken(card)) {
        addCardForActor(actor, card, result, playerCardSet, opponentCardSet);
      }
      continue;
    }

    // Detect win: "Opponent conceded. PlayerName wins."
    const concedeWinMatch = /(?:Opponent\s+conceded|.+?\s+conceded)\.\s*(.+?)\s+wins?\.?/i.exec(line);
    if (concedeWinMatch) {
      const winner = concedeWinMatch[1].trim();
      result.result = winner === result.playerName ? "win" : "loss";
      continue;
    }

    // Detect win: "PlayerName won the game"
    const wonMatch = /^(.+?)\s+(?:won\s+the\s+game|has\s+won|wins?!)/i.exec(line);
    if (wonMatch) {
      const winner = wonMatch[1].trim();
      result.result = winner === result.playerName ? "win" : "loss";
      continue;
    }

    // Detect concede standalone
    const concedeMatch = /^(.+?)\s+(?:conceded|forfeited)/i.exec(line);
    if (concedeMatch) {
      const loser = concedeMatch[1].trim();
      result.result = loser === result.playerName ? "loss" : "win";
      continue;
    }

    // Detect draw
    if (/game\s+ended\s+in\s+a\s+draw|tie\s+game|draw!/i.test(line)) {
      result.result = "draw";
      continue;
    }

    // "PlayerName took all Prize cards" → win
    const prizeWinMatch = /^(.+?)\s+took\s+all\s+Prize\s+cards/i.exec(line);
    if (prizeWinMatch) {
      const winner = prizeWinMatch[1].trim();
      result.result = winner === result.playerName ? "win" : "loss";
      continue;
    }
  }

  result.turnCount = maxTurn;
  result.playerCards = [...playerCardSet];
  result.opponentCards = [...opponentCardSet];
  result.confidence = calculateConfidence(result);

  return result;
}

function detectPlayerNames(lines: string[]): string[] {
  const nameCandidates = new Map<string, number>();

  for (const line of lines) {
    // Turn markers: "Turn # N - PlayerName's Turn" (highest weight)
    const turnMatch = /^Turn\s*#?\s*\d+\s*-\s*(.+?)(?:'s\s+Turn)?$/i.exec(line);
    if (turnMatch) {
      const name = turnMatch[1].trim();
      nameCandidates.set(name, (nameCandidates.get(name) ?? 0) + 10);
      continue;
    }

    // Setup: "PlayerName drew N cards for the opening hand"
    const openingMatch = /^(.+?)\s+drew\s+\d+\s+cards\s+for\s+the\s+opening\s+hand/i.exec(line);
    if (openingMatch) {
      const name = openingMatch[1].trim();
      nameCandidates.set(name, (nameCandidates.get(name) ?? 0) + 8);
      continue;
    }

    // Setup: "PlayerName chose heads/tails"
    const coinChoiceMatch = /^(.+?)\s+chose\s+(?:heads|tails)/i.exec(line);
    if (coinChoiceMatch) {
      const name = coinChoiceMatch[1].trim();
      nameCandidates.set(name, (nameCandidates.get(name) ?? 0) + 8);
      continue;
    }

    // Setup: "PlayerName won the coin toss"
    const coinWinMatch = /^(.+?)\s+won\s+the\s+coin\s+toss/i.exec(line);
    if (coinWinMatch) {
      const name = coinWinMatch[1].trim();
      nameCandidates.set(name, (nameCandidates.get(name) ?? 0) + 8);
      continue;
    }

    // "PlayerName played/drew/attached..."
    const actionMatch = /^([A-Za-z0-9_]+)\s+(?:played|drew|attached|evolved|retreated)/i.exec(line);
    if (actionMatch) {
      const name = actionMatch[1].trim();
      nameCandidates.set(name, (nameCandidates.get(name) ?? 0) + 1);
    }

    // "PlayerName's CardName"
    const possessiveMatch = /^([A-Za-z0-9_]+)'s\s/i.exec(line);
    if (possessiveMatch) {
      const name = possessiveMatch[1].trim();
      nameCandidates.set(name, (nameCandidates.get(name) ?? 0) + 1);
    }
  }

  // Filter out common non-player tokens
  const invalidNames = new Set(["turn", "setup", "game", "opponent", "basic"]);
  const filtered = [...nameCandidates.entries()]
    .filter(([name]) => !invalidNames.has(name.toLowerCase()))
    .sort((a, b) => b[1] - a[1]);

  return filtered.slice(0, 2).map(([name]) => name);
}

function cleanCardName(raw: string): string {
  return raw
    .replace(/\s*from\s+(?:hand|deck|discard|the).*$/i, "")
    .replace(/\s*to\s+the\s+.+$/i, "")
    .replace(/\s*(?:on|in)\s+the\s+(?:Bench|Active\s+Spot).*$/i, "")
    .replace(/\s*was\s+.+$/i, "")
    .replace(/[.!]$/, "")
    .trim();
}

function isIgnoredToken(card: string): boolean {
  if (IGNORE_TOKENS.has(card.toLowerCase())) return true;
  if (ENERGY_PATTERN.test(card)) return true;
  if (/^\d+\s+cards?$/i.test(card)) return true;
  if (/^\d+\s+damage/i.test(card)) return true;
  return false;
}

function addCardForActor(
  actor: string,
  card: string,
  parsed: ParsedGameLog,
  playerSet: Set<string>,
  opponentSet: Set<string>
) {
  if (actor === parsed.playerName) {
    playerSet.add(card);
  } else if (actor === parsed.opponentName) {
    opponentSet.add(card);
  }
}

function calculateConfidence(parsed: ParsedGameLog): number {
  let score = 0;

  if (parsed.playerName && parsed.opponentName) score += 0.2;
  if (parsed.result) score += 0.25;
  if (parsed.playerCards.length >= 5) score += 0.2;
  else if (parsed.playerCards.length >= 3) score += 0.15;
  else if (parsed.playerCards.length > 0) score += 0.05;
  if (parsed.opponentCards.length >= 5) score += 0.2;
  else if (parsed.opponentCards.length >= 3) score += 0.15;
  else if (parsed.opponentCards.length > 0) score += 0.05;
  if (parsed.wentFirst !== null) score += 0.1;
  if (parsed.turnCount >= 4) score += 0.05;

  return Math.min(1, score);
}
