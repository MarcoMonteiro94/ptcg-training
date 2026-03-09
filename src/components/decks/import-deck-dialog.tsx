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
import { saveDeck } from "@/server/actions/decklists";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface ImportDeckDialogProps {
  archetypes: Array<{ id: string; name: string }>;
}

/**
 * Parses a PTCG decklist text format into card objects.
 * Handles lines like:
 *   4 Dreepy ASC 247
 *   1 Basic {P} Energy MEE 5
 *   3 Luminous Energy PAL 191
 * Section headers (Pokémon: 12, Trainer: 11, Energy: 4, Total Cards: 60) are skipped.
 */
function parseDeckList(text: string): { cards: Array<{ card_id: string; count: number }>; errors: string[] } {
  const cards: Array<{ card_id: string; count: number }> = [];
  const errors: string[] = [];
  const lines = text.trim().split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Skip section headers
    if (/^(Pokémon|Pokemon|Trainer|Energy|Total Cards)\s*:/i.test(line)) continue;

    // Match: count name set number
    const match = line.match(/^(\d+)\s+(.+?)\s+([A-Z]{2,4})\s+(\d+)$/);
    if (!match) {
      errors.push(`Could not parse: "${line}"`);
      continue;
    }

    const count = parseInt(match[1]);
    const cardName = match[2].trim();
    const setCode = match[3];
    const number = match[4];
    // Store as "Name|SET-NUM" so we keep both the readable name and image lookup key
    const cardId = `${cardName}|${setCode}-${number}`;

    cards.push({ card_id: cardId, count });
  }

  return { cards, errors };
}

export function ImportDeckDialog({ archetypes }: ImportDeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [archetypeId, setArchetypeId] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"standard" | "expanded" | "unlimited">("standard");
  const [deckText, setDeckText] = useState("");

  const selectedArchetypeName = archetypes.find((a) => a.id === archetypeId)?.name || "";

  function handleArchetypeChange(value: string) {
    setArchetypeId(value);
    if (!name) {
      const archName = archetypes.find((a) => a.id === value)?.name || "";
      setName(archName);
    }
  }

  function handleSubmit() {
    if (!deckText.trim()) {
      toast.error("Please paste a decklist");
      return;
    }

    const { cards, errors } = parseDeckList(deckText);

    if (errors.length > 0) {
      toast.error(`Parse errors:\n${errors.slice(0, 3).join("\n")}`);
      return;
    }

    if (cards.length === 0) {
      toast.error("No cards found in decklist");
      return;
    }

    const totalCards = cards.reduce((sum, c) => sum + c.count, 0);
    if (totalCards !== 60) {
      toast.error(`Deck has ${totalCards} cards (must be 60)`);
      return;
    }

    startTransition(async () => {
      const response = await saveDeck({
        name: name || selectedArchetypeName || "Imported Deck",
        archetypeId: archetypeId || undefined,
        format,
        cards,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Deck imported!");
      setOpen(false);
      setArchetypeId("");
      setName("");
      setDeckText("");
      router.refresh();
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="border-dashed border-border/30 text-xs h-8"
        onClick={() => setOpen(true)}
      >
        <Upload className="mr-1 h-3.5 w-3.5" />
        Import
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Import Decklist</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Decklist *</Label>
              <Textarea
                placeholder={`Pokémon: 12\n4 Dreepy ASC 247\n1 Munkidori SFA 72\n...\n\nTrainer: 11\n3 Counter Catcher PAR 160\n...\n\nEnergy: 4\n3 Luminous Energy PAL 191\n...`}
                value={deckText}
                onChange={(e) => setDeckText(e.target.value)}
                rows={12}
                className="bg-muted/20 border-border/50 resize-none text-xs font-mono leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Archetype</Label>
              <DeckCombobox
                archetypes={archetypes}
                value={archetypeId}
                onValueChange={handleArchetypeChange}
                placeholder="Search archetype..."
              />
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Deck Name</Label>
                <Input
                  placeholder={selectedArchetypeName || "My deck name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted/20 border-border/50 h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Format</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
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

            <Button
              onClick={handleSubmit}
              disabled={isPending || !deckText.trim()}
              className="w-full holo-gradient text-background text-xs h-9"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Import Deck"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
