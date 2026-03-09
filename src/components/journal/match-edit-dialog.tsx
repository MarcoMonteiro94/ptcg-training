"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeckCombobox } from "@/components/shared/deck-combobox";
import { updateMatchLog, deleteMatchLog } from "@/server/actions/journal";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface MatchEditDialogProps {
  match: {
    id: string;
    result: "win" | "loss" | "draw";
    opponentArchetypeId: string | null;
    userArchetypeId: string | null;
    wentFirst: boolean | null;
    notes: string | null;
  };
  archetypes: Array<{ id: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MatchEditDialog({ match, archetypes, open, onOpenChange }: MatchEditDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [userArchetypeId, setUserArchetypeId] = useState(match.userArchetypeId || "");
  const [opponentArchetypeId, setOpponentArchetypeId] = useState(match.opponentArchetypeId || "");
  const [result, setResult] = useState(match.result);
  const [wentFirst, setWentFirst] = useState<string>(
    match.wentFirst === null ? "" : match.wentFirst ? "true" : "false"
  );
  const [notes, setNotes] = useState(match.notes || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    if (!opponentArchetypeId) {
      toast.error("Opponent archetype is required");
      return;
    }

    startTransition(async () => {
      const response = await updateMatchLog({
        id: match.id,
        userArchetypeId: userArchetypeId || undefined,
        opponentArchetypeId,
        result,
        wentFirst: wentFirst === "" ? undefined : wentFirst === "true",
        notes: notes || undefined,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Match updated!");
      onOpenChange(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const response = await deleteMatchLog(match.id);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Match deleted.");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Edit Match</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Your Deck</Label>
              <DeckCombobox
                archetypes={archetypes}
                value={userArchetypeId}
                onValueChange={setUserArchetypeId}
                placeholder="Select your deck"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Opponent&apos;s Deck *</Label>
              <DeckCombobox
                archetypes={archetypes}
                value={opponentArchetypeId}
                onValueChange={setOpponentArchetypeId}
                placeholder="Select opponent deck"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Result *</Label>
              <Select value={result} onValueChange={(v) => setResult(v as typeof result)}>
                <SelectTrigger className="bg-muted/20 border-border/50 h-9 text-sm">
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
                <SelectTrigger className="bg-muted/20 border-border/50 h-9 text-sm">
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-muted/20 border-border/50 resize-none text-sm"
            />
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
              disabled={isPending || !opponentArchetypeId}
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
  );
}
