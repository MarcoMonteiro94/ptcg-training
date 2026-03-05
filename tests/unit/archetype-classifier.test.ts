import { describe, it, expect } from "vitest";
import { classifyDeck, classifyDeckByNames } from "@/server/services/archetype-classifier";

const archetypes = [
  {
    id: "charizard-ex",
    name: "Charizard ex",
    identifierCards: ["char-ex-01", "charm-01", "charmeleon-01", "rare-candy-01"],
  },
  {
    id: "gardevoir-ex",
    name: "Gardevoir ex",
    identifierCards: ["garde-ex-01", "kirlia-01", "ralts-01"],
  },
  {
    id: "lost-zone-box",
    name: "Lost Zone Box",
    identifierCards: ["comfey-01", "cramorant-01", "sableye-01", "mirage-gate-01"],
  },
];

describe("classifyDeck", () => {
  it("should classify a Charizard ex deck", () => {
    const deckCards = [
      { card_id: "char-ex-01", count: 2 },
      { card_id: "charm-01", count: 4 },
      { card_id: "charmeleon-01", count: 3 },
      { card_id: "rare-candy-01", count: 4 },
      { card_id: "random-energy", count: 12 },
    ];
    expect(classifyDeck(deckCards, archetypes)).toBe("charizard-ex");
  });

  it("should classify a Gardevoir ex deck", () => {
    const deckCards = [
      { card_id: "garde-ex-01", count: 3 },
      { card_id: "kirlia-01", count: 4 },
      { card_id: "ralts-01", count: 4 },
    ];
    expect(classifyDeck(deckCards, archetypes)).toBe("gardevoir-ex");
  });

  it("should return null for unrecognizable deck", () => {
    const deckCards = [
      { card_id: "unknown-01", count: 4 },
      { card_id: "unknown-02", count: 4 },
    ];
    expect(classifyDeck(deckCards, archetypes)).toBeNull();
  });

  it("should require at least 50% match", () => {
    const deckCards = [{ card_id: "comfey-01", count: 4 }];
    expect(classifyDeck(deckCards, archetypes)).toBeNull();
  });
});

describe("classifyDeckByNames", () => {
  const nameArchetypes = [
    { id: "charizard-ex", name: "Charizard ex", identifierCards: ["Charizard ex", "Charmander", "Rare Candy"] },
    { id: "gardevoir-ex", name: "Gardevoir ex", identifierCards: ["Gardevoir ex", "Kirlia", "Ralts"] },
  ];

  it("should classify by card names", () => {
    const names = ["Charizard ex", "Charmander", "Rare Candy", "Iono", "Boss's Orders"];
    expect(classifyDeckByNames(names, nameArchetypes)?.id).toBe("charizard-ex");
  });

  it("should be case-insensitive", () => {
    const names = ["charizard EX", "CHARMANDER", "rare candy"];
    expect(classifyDeckByNames(names, nameArchetypes)?.id).toBe("charizard-ex");
  });
});
