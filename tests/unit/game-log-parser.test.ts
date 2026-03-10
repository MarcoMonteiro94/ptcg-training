import { describe, it, expect } from "vitest";
import { parseGameLog } from "../../src/server/services/game-log-parser";

describe("parseGameLog", () => {
  it("returns empty result for empty input", () => {
    const result = parseGameLog("");
    expect(result.playerCards).toEqual([]);
    expect(result.opponentCards).toEqual([]);
    expect(result.result).toBeNull();
    expect(result.wentFirst).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("detects player names from turn markers", () => {
    const log = `
Turn 1 - Alice
Alice drew a card.
Turn 2 - Bob
Bob drew a card.
    `;
    const result = parseGameLog(log);
    expect(result.playerName).toBe("Alice");
    expect(result.opponentName).toBe("Bob");
  });

  it("extracts cards played by each player", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Alice played Arcanine from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
Bob played Raichu from hand.
    `;
    const result = parseGameLog(log);
    expect(result.playerCards).toContain("Charizard ex");
    expect(result.playerCards).toContain("Arcanine");
    expect(result.opponentCards).toContain("Pikachu");
    expect(result.opponentCards).toContain("Raichu");
  });

  it("detects win result for player", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
Alice won the game.
    `;
    const result = parseGameLog(log);
    expect(result.result).toBe("win");
  });

  it("detects loss result for player", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
Bob won the game.
    `;
    const result = parseGameLog(log);
    expect(result.result).toBe("loss");
  });

  it("detects draw", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
Game ended in a draw.
    `;
    const result = parseGameLog(log);
    expect(result.result).toBe("draw");
  });

  it("detects concede as loss for the conceding player", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
Bob conceded.
    `;
    const result = parseGameLog(log);
    expect(result.result).toBe("win"); // Alice wins because Bob conceded
  });

  it("detects who went first from explicit choice", () => {
    const log = `
Alice decided to go first.
Turn 1 - Alice
Alice played Charizard ex from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
    `;
    const result = parseGameLog(log);
    expect(result.wentFirst).toBe(true);
  });

  it("counts turns", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
Turn 3 - Alice
Alice played Arcanine from hand.
Turn 4 - Bob
Bob played Raichu from hand.
    `;
    const result = parseGameLog(log);
    expect(result.turnCount).toBe(4);
  });

  it("extracts cards from possessive patterns", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Alice's Charizard ex used Brave Wing.
Turn 2 - Bob
Bob played Pikachu from hand.
    `;
    const result = parseGameLog(log);
    expect(result.playerCards).toContain("Charizard ex");
  });

  it("extracts cards from attachment patterns (excluding energy)", () => {
    const log = `
Turn 1 - Alice
Alice attached Fire Energy to Charizard ex.
Alice attached Exp. Share to Charizard ex.
Turn 2 - Bob
Bob attached Lightning Energy to Pikachu.
Bob attached Air Balloon to Pikachu.
    `;
    const result = parseGameLog(log);
    // Energy cards are intentionally filtered out (not deck identifiers)
    expect(result.playerCards).not.toContain("Fire Energy");
    expect(result.playerCards).toContain("Exp. Share");
    expect(result.opponentCards).toContain("Air Balloon");
  });

  it("handles incomplete logs gracefully", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
    `;
    const result = parseGameLog(log);
    expect(result.playerName).toBe("Alice");
    expect(result.playerCards).toContain("Charizard ex");
    expect(result.result).toBeNull();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(0.5); // Low confidence for incomplete log
  });

  it("calculates higher confidence for complete logs", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Alice played Arcanine from hand.
Alice played Magmar from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
Bob played Raichu from hand.
Bob played Voltorb from hand.
Turn 3 - Alice
Turn 4 - Bob
Alice won the game.
    `;
    const result = parseGameLog(log);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("deduplicates card names", () => {
    const log = `
Turn 1 - Alice
Alice played Charizard ex from hand.
Turn 3 - Alice
Alice's Charizard ex used Brave Wing.
    `;
    const result = parseGameLog(log);
    const charizardCount = result.playerCards.filter((c) => c === "Charizard ex").length;
    expect(charizardCount).toBe(1);
  });

  it("identifies user via revealed opening hand and detects loss on concede", () => {
    const log = `Setup
blackTenergy chose heads for the opening coin flip.
blackTenergy won the coin toss.
blackTenergy decided to go second.
blackTenergy drew 7 cards for the opening hand.
- 7 drawn cards.
xTitoSni drew 7 cards for the opening hand.
- 7 drawn cards.
   • Iono, Budew, Luminous Energy, Jamming Tower, Dreepy, Bloodmoon Ursaluna ex, Iono
blackTenergy played Snorunt to the Active Spot.
xTitoSni played Budew to the Active Spot.

[playerName]'s Turn
xTitoSni drew Dragapult ex.
xTitoSni played Dreepy to the Bench.
xTitoSni attached Luminous Energy to Dreepy on the Bench.
xTitoSni ended their turn.

[playerName]'s Turn
blackTenergy drew a card.
blackTenergy played Buddy-Buddy Poffin.
blackTenergy played Arven.
blackTenergy played Secret Box.
blackTenergy played Munkidori to the Bench.
blackTenergy attached Basic Darkness Energy to Snorunt in the Active Spot.
You conceded. blackTenergy wins.`;
    const result = parseGameLog(log);
    expect(result.playerName).toBe("xTitoSni");
    expect(result.opponentName).toBe("blackTenergy");
    expect(result.result).toBe("loss");
    expect(result.wentFirst).toBe(true); // blackTenergy chose second → xTitoSni went first
  });

  it("detects win when opponent concedes with 'Opponent conceded' format", () => {
    const log = `Setup
Alice chose heads for the opening coin flip.
Alice won the coin toss.
Alice decided to go first.
Alice drew 7 cards for the opening hand.
- 7 drawn cards.
   • Charizard ex, Arcanine, Fire Energy, Boss's Orders, Iono, Ultra Ball, Rare Candy
Bob drew 7 cards for the opening hand.
- 7 drawn cards.

[playerName]'s Turn
Alice drew a card.
Alice played Charizard ex to the Active Spot.

[playerName]'s Turn
Bob drew a card.
Bob played Pikachu to the Active Spot.
Opponent conceded. Alice wins.`;
    const result = parseGameLog(log);
    expect(result.playerName).toBe("Alice");
    expect(result.result).toBe("win");
    expect(result.wentFirst).toBe(true);
  });

  it("detects win via prize completion", () => {
    const log = `Setup
Alice drew 7 cards for the opening hand.
- 7 drawn cards.
   • Charizard ex, Arcanine, Fire Energy, Boss's Orders, Iono, Ultra Ball, Rare Candy
Bob drew 7 cards for the opening hand.
- 7 drawn cards.

Turn 1 - Alice
Alice played Charizard ex from hand.
Turn 2 - Bob
Bob played Pikachu from hand.
Alice took all Prize cards.`;
    const result = parseGameLog(log);
    expect(result.playerName).toBe("Alice");
    expect(result.result).toBe("win");
  });
});
