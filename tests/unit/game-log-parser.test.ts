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
});
