"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveDeck, type SaveDeckInput } from "@/server/actions/decklists";
import { toast } from "sonner";
import { Plus, Minus, Save, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeckCard, Format } from "@/types";

interface DeckBuilderInterfaceProps {
  archetypes: Array<{ id: string; name: string }>;
  initialDeck?: {
    id: string;
    name: string;
    archetypeId: string | null;
    format: string;
    cards: DeckCard[];
  };
}

export function DeckBuilderInterface({ archetypes, initialDeck }: DeckBuilderInterfaceProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialDeck?.name || "");
  const [format, setFormat] = useState<Format>((initialDeck?.format as Format) || "standard");
  const [archetypeId, setArchetypeId] = useState(initialDeck?.archetypeId || "");
  const [deckCards, setDeckCards] = useState<DeckCard[]>(initialDeck?.cards || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [cardInput, setCardInput] = useState("");

  const totalCards = deckCards.reduce((sum, c) => sum + c.count, 0);

  function addCard(cardId: string) {
    setDeckCards((prev) => {
      const existing = prev.find((c) => c.card_id === cardId);
      if (existing) {
        return prev.map((c) =>
          c.card_id === cardId ? { ...c, count: Math.min(c.count + 1, 60) } : c
        );
      }
      return [...prev, { card_id: cardId, count: 1 }];
    });
  }

  function removeCard(cardId: string) {
    setDeckCards((prev) => {
      const existing = prev.find((c) => c.card_id === cardId);
      if (existing && existing.count > 1) {
        return prev.map((c) =>
          c.card_id === cardId ? { ...c, count: c.count - 1 } : c
        );
      }
      return prev.filter((c) => c.card_id !== cardId);
    });
  }

  function deleteCard(cardId: string) {
    setDeckCards((prev) => prev.filter((c) => c.card_id !== cardId));
  }

  function handleAddCardByInput() {
    if (!cardInput.trim()) return;
    addCard(cardInput.trim());
    setCardInput("");
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Deck name is required");
      return;
    }

    startTransition(async () => {
      const input: SaveDeckInput = {
        id: initialDeck?.id,
        name,
        archetypeId: archetypeId || undefined,
        format,
        cards: deckCards,
      };

      const result = await saveDeck(input);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Deck saved!");
      }
    });
  }

  const filteredCards = searchQuery
    ? deckCards.filter((c) =>
        c.card_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : deckCards;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Deck ({totalCards}/60)
            </h3>
            <Badge
              className={cn(
                "font-mono text-[10px] px-2 py-0.5 border-0",
                totalCards === 60
                  ? "bg-[oklch(0.72_0.19_155/0.15)] text-[oklch(0.80_0.15_155)]"
                  : "bg-[oklch(0.65_0.22_25/0.15)] text-[oklch(0.80_0.15_25)]"
              )}
            >
              {totalCards === 60 ? "Valid" : `${60 - totalCards} needed`}
            </Badge>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Search cards in deck..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-muted/20 border-border/50 text-sm h-9"
            />
          </div>

          {filteredCards.length === 0 ? (
            <p className="text-muted-foreground/60 text-xs text-center py-8">
              {deckCards.length === 0
                ? "Add cards to start building your deck"
                : "No cards match your search"}
            </p>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredCards.map((card) => (
                <div
                  key={card.card_id}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/10 px-3 py-1.5 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm truncate flex-1 mr-2">
                    {card.card_id}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => removeCard(card.card_id)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-mono w-5 text-center">
                      {card.count}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => addCard(card.card_id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCard(card.card_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Add Card
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter card ID or name..."
              value={cardInput}
              onChange={(e) => setCardInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCardByInput();
              }}
              className="bg-muted/20 border-border/50 text-sm h-9"
            />
            <Button
              onClick={handleAddCardByInput}
              disabled={!cardInput.trim()}
              size="sm"
              className="holo-gradient text-background shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Deck Info
          </h3>
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Deck"
              className="bg-muted/20 border-border/50 text-sm h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger className="bg-muted/20 border-border/50 text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="expanded">Expanded</SelectItem>
                <SelectItem value="unlimited">Unlimited</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider">Archetype</Label>
            <Select value={archetypeId} onValueChange={setArchetypeId}>
              <SelectTrigger className="bg-muted/20 border-border/50 text-sm h-9">
                <SelectValue placeholder="Select archetype" />
              </SelectTrigger>
              <SelectContent>
                {archetypes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="w-full holo-gradient text-background"
            size="sm"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isPending ? "Saving..." : "Save Deck"}
          </Button>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Summary
          </h3>
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs">Total Cards</span>
              <span className="font-mono text-xs">{totalCards}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs">Unique Cards</span>
              <span className="font-mono text-xs">{deckCards.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
