/**
 * Parses a TCG Masters game review JSON file and extracts match data.
 */

interface TcgMastersMessage {
  type: string;
  deck?: {
    pokemon: Array<[number, string, string, string]>;
    trainers: Array<[number, string, string, string]>;
    energies: Array<[number, string, string, string]>;
  };
  senderId?: string;
  roomId?: string;
  playerId?: string;
}

interface TcgMastersFile {
  name: string;
  date: string;
  version: number;
  metadata?: {
    deck1Name?: string;
    deck1List?: string;
  };
  messages: TcgMastersMessage[];
}

export interface TcgMastersParsedMatch {
  date: Date;
  roomId: string;
  player1SenderId: string;
  player2SenderId: string;
  /** Deck of the file owner (Hello sender) */
  ownerDeck: {
    pokemonNames: string[];
    exPokemon: string[];
  };
  /** Deck of the opponent */
  opponentDeck: {
    pokemonNames: string[];
    exPokemon: string[];
  };
  /** Raw decklist text from metadata (file owner's deck) */
  ownerDeckList: string | null;
}

function extractExPokemon(pokemon: Array<[number, string, string, string]>): string[] {
  return pokemon
    .filter(([, name]) => name.toLowerCase().includes(" ex"))
    .map(([, name]) => name);
}

function extractPokemonNames(pokemon: Array<[number, string, string, string]>): string[] {
  return pokemon.map(([, name]) => name);
}

export function parseTcgMastersFile(json: unknown): TcgMastersParsedMatch {
  const file = json as TcgMastersFile;

  if (!file.messages || !Array.isArray(file.messages)) {
    throw new Error("Invalid TCG Masters file: missing messages array");
  }

  const helloMsg = file.messages.find((m) => m.type === "Hello");
  const setPlayerMsg = file.messages.find((m) => m.type === "SetPlayerId");

  if (!helloMsg?.deck || !helloMsg.senderId || !helloMsg.roomId) {
    throw new Error("Invalid TCG Masters file: missing Hello message with deck data");
  }

  if (!setPlayerMsg?.deck || !setPlayerMsg.senderId) {
    throw new Error("Invalid TCG Masters file: missing SetPlayerId message");
  }

  const roomId = helloMsg.roomId;

  // Hello sender = file owner, SetPlayerId sender = opponent
  const ownerDeck = {
    pokemonNames: extractPokemonNames(helloMsg.deck.pokemon),
    exPokemon: extractExPokemon(helloMsg.deck.pokemon),
  };

  const opponentDeck = {
    pokemonNames: extractPokemonNames(setPlayerMsg.deck.pokemon),
    exPokemon: extractExPokemon(setPlayerMsg.deck.pokemon),
  };

  return {
    date: new Date(file.date),
    roomId,
    player1SenderId: helloMsg.senderId,
    player2SenderId: setPlayerMsg.senderId,
    ownerDeck,
    opponentDeck,
    ownerDeckList: file.metadata?.deck1List || null,
  };
}

/**
 * Tries to find the best matching archetype for a deck based on ex Pokemon names.
 * Returns the archetype ID if a match is found.
 */
export function findArchetypeMatch(
  exPokemon: string[],
  archetypes: Array<{ id: string; name: string }>
): string | null {
  if (exPokemon.length === 0) return null;

  // Try to match the main ex Pokemon (usually the archetype name)
  for (const pokemon of exPokemon) {
    // Remove " ex" suffix for matching
    const baseName = pokemon.replace(/\s+ex$/i, "").toLowerCase();

    const match = archetypes.find((a) => {
      const archName = a.name.toLowerCase();
      return archName.includes(baseName) || baseName.includes(archName.replace(/\s+ex$/i, ""));
    });

    if (match) return match.id;
  }

  return null;
}
