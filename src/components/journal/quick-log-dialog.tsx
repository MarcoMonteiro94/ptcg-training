"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { createMatchLog } from "@/server/actions/journal";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface Archetype {
  id: string;
  name: string;
}

interface QuickLogDialogProps {
  archetypes: Archetype[];
}

export function QuickLogDialog({ archetypes }: QuickLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [userArchetypeId, setUserArchetypeId] = useState("");
  const [opponentArchetypeId, setOpponentArchetypeId] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "draw">("win");
  const [wentFirst, setWentFirst] = useState<string>("");
  const [notes, setNotes] = useState("");

  function handleSubmit(closeAfter: boolean) {
    if (!opponentArchetypeId) {
      toast.error("Opponent deck is required");
      return;
    }

    startTransition(async () => {
      const response = await createMatchLog({
        userArchetypeId: userArchetypeId || undefined,
        opponentArchetypeId,
        result,
        wentFirst: wentFirst === "" ? undefined : wentFirst === "true",
        format: "standard",
        notes: notes || undefined,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Match logged!");
      router.refresh();

      if (closeAfter) {
        setOpen(false);
      } else {
        setOpponentArchetypeId("");
        setResult("win");
        setWentFirst("");
        setNotes("");
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        className="holo-gradient text-background text-xs h-8 shadow-[0_0_10px_oklch(0.75_0.18_165/0.15)]"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        <span className="hidden sm:inline">Log Match</span>
        <span className="sm:hidden">New</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Quick Log</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Your Deck</Label>
                <DeckCombobox
                  archetypes={archetypes}
                  value={userArchetypeId}
                  onValueChange={setUserArchetypeId}
                  placeholder="Select deck"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Opponent&apos;s Deck *</Label>
                <DeckCombobox
                  archetypes={archetypes}
                  value={opponentArchetypeId}
                  onValueChange={setOpponentArchetypeId}
                  placeholder="Select deck"
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Result *</Label>
                <Select value={result} onValueChange={(v) => setResult(v as typeof result)}>
                  <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Went First?</Label>
                <Select value={wentFirst} onValueChange={setWentFirst}>
                  <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                    <SelectValue placeholder="Unknown" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                placeholder="Key plays, observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="bg-muted/20 border-border/50 resize-none text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isPending || !opponentArchetypeId}
                className="flex-1 holo-gradient text-background text-xs h-9"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log & Close"}
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isPending || !opponentArchetypeId}
                variant="outline"
                className="flex-1 border-border/30 text-xs h-9"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log & Add Another"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
