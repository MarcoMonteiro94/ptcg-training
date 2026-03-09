"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeckCombobox } from "@/components/shared/deck-combobox";
import { saveDeck, deleteDeck } from "@/server/actions/decklists";
import { toast } from "sonner";
import { Pencil, Loader2, Trash2 } from "lucide-react";

interface DeckData {
  id: string;
  name: string;
  archetypeId: string | null;
  format: string;
  cards: Array<{ card_id: string; count: number }>;
}

interface UserDeckActionsProps {
  deck: DeckData;
  archetypes: Array<{ id: string; name: string }>;
}

function cardsToText(cards: Array<{ card_id: string; count: number }>): string {
  return cards.map((c) => {
    const parts = c.card_id.split("-");
    if (parts.length === 2) {
      return `${c.count} ${parts[0]} ${parts[1]}`;
    }
    return `${c.count} ${c.card_id}`;
  }).join("\n");
}

function parseDeckList(text: string): { cards: Array<{ card_id: string; count: number }>; errors: string[] } {
  const cards: Array<{ card_id: string; count: number }> = [];
  const errors: string[] = [];
  const lines = text.trim().split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(Pokémon|Pokemon|Trainer|Energy|Total Cards)\s*:/i.test(line)) continue;

    const match = line.match(/^(\d+)\s+(.+?)\s+([A-Z]{2,4})\s+(\d+)$/);
    if (!match) {
      errors.push(`Could not parse: "${line}"`);
      continue;
    }

    cards.push({ card_id: `${match[3]}-${match[4]}`, count: parseInt(match[1]) });
  }

  return { cards, errors };
}

export function UserDeckActions({ deck, archetypes }: UserDeckActionsProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState(deck.name);
  const [archetypeId, setArchetypeId] = useState(deck.archetypeId || "");
  const [format, setFormat] = useState(deck.format);
  const [deckText, setDeckText] = useState(cardsToText(deck.cards));
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    if (!name.trim()) {
      toast.error("Deck name is required");
      return;
    }

    let cards = deck.cards;
    if (deckText.trim()) {
      const parsed = parseDeckList(deckText);
      if (parsed.errors.length > 0) {
        toast.error(`Parse errors:\n${parsed.errors.slice(0, 3).join("\n")}`);
        return;
      }
      if (parsed.cards.length > 0) {
        cards = parsed.cards;
      }
    }

    startTransition(async () => {
      const response = await saveDeck({
        id: deck.id,
        name: name.trim(),
        archetypeId: archetypeId || undefined,
        format: format as "standard" | "expanded" | "unlimited",
        cards,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Deck updated!");
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const response = await deleteDeck(deck.id);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      toast.success("Deck deleted");
      router.push("/decks");
    });
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="border-border/30 text-xs h-8"
        onClick={() => setOpen(true)}
      >
        <Pencil className="mr-1.5 h-3 w-3" />
        Edit
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Deck</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/20 border-border/50 h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="expanded">Expanded</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Archetype</Label>
              <DeckCombobox
                archetypes={archetypes}
                value={archetypeId}
                onValueChange={setArchetypeId}
                placeholder="Search archetype..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Decklist</Label>
              <Textarea
                placeholder={`4 Dreepy ASC 247\n1 Munkidori SFA 72\n...`}
                value={deckText}
                onChange={(e) => setDeckText(e.target.value)}
                rows={10}
                className="bg-muted/20 border-border/50 resize-none text-xs font-mono leading-relaxed"
              />
              <p className="text-[10px] text-muted-foreground/40 font-mono">
                Format: count name SET number (e.g. 4 Dreepy ASC 247)
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive">Sure?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="h-7 text-xs"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="text-muted-foreground hover:text-destructive h-7 text-xs px-2"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}

              <Button
                onClick={handleSave}
                disabled={isPending || !name.trim()}
                className="holo-gradient text-background h-8 text-xs"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
