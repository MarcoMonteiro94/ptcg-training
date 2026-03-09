"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Loader2 } from "lucide-react";

interface AddDeckDialogProps {
  archetypes: Array<{ id: string; name: string }>;
}

export function AddDeckDialog({ archetypes }: AddDeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [archetypeId, setArchetypeId] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<"standard" | "expanded" | "unlimited">("standard");

  const selectedArchetypeName = archetypes.find((a) => a.id === archetypeId)?.name || "";

  function handleArchetypeChange(value: string) {
    setArchetypeId(value);
    if (!name) {
      const archName = archetypes.find((a) => a.id === value)?.name || "";
      setName(archName);
    }
  }

  function handleSubmit() {
    if (!archetypeId) {
      toast.error("Please select an archetype");
      return;
    }

    startTransition(async () => {
      const response = await saveDeck({
        name: name || selectedArchetypeName,
        archetypeId,
        format,
        cards: [],
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Deck added!");
      setOpen(false);
      setArchetypeId("");
      setName("");
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
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add Deck
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add to My Decks</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Archetype *</Label>
              <DeckCombobox
                archetypes={archetypes}
                value={archetypeId}
                onValueChange={handleArchetypeChange}
                placeholder="Search archetype..."
              />
            </div>

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

            <Button
              onClick={handleSubmit}
              disabled={isPending || !archetypeId}
              className="w-full holo-gradient text-background text-xs h-9"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add Deck"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
