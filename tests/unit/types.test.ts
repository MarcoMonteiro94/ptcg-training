import { describe, it, expect } from "vitest";
import type { Format, MatchResult, ArchetypeTier, DeckCard } from "@/types";

describe("Type definitions", () => {
  it("should accept valid format values", () => {
    const format: Format = "standard";
    expect(format).toBe("standard");
  });

  it("should accept valid match results", () => {
    const results: MatchResult[] = ["win", "loss", "draw"];
    expect(results).toHaveLength(3);
  });

  it("should accept valid tier values", () => {
    const tiers: ArchetypeTier[] = ["S", "A", "B", "C", "D"];
    expect(tiers).toHaveLength(5);
  });

  it("should accept valid deck card structure", () => {
    const card: DeckCard = { card_id: "sv1-001", count: 4 };
    expect(card.card_id).toBe("sv1-001");
    expect(card.count).toBe(4);
  });
});
