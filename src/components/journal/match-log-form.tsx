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
import { createMatchLog } from "@/server/actions/journal";
import { toast } from "sonner";

interface Archetype {
  id: string;
  name: string;
}

interface MatchLogFormProps {
  archetypes: Archetype[];
}

export function MatchLogForm({ archetypes }: MatchLogFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [opponentArchetypeId, setOpponentArchetypeId] = useState("");
  const [userArchetypeId, setUserArchetypeId] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "draw">("win");
  const [wentFirst, setWentFirst] = useState<string>("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
      router.push("/journal");
    });
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-4">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
        Match Details
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider">Your Deck</Label>
            <Select value={userArchetypeId} onValueChange={setUserArchetypeId}>
              <SelectTrigger className="bg-muted/20 border-border/50">
                <SelectValue placeholder="Select your deck" />
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

          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider">Opponent&apos;s Deck *</Label>
            <Select
              value={opponentArchetypeId}
              onValueChange={setOpponentArchetypeId}
              required
            >
              <SelectTrigger className="bg-muted/20 border-border/50">
                <SelectValue placeholder="Select opponent deck" />
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider">Result *</Label>
            <Select value={result} onValueChange={(v) => setResult(v as typeof result)}>
              <SelectTrigger className="bg-muted/20 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="win">Win</SelectItem>
                <SelectItem value="loss">Loss</SelectItem>
                <SelectItem value="draw">Draw</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-wider">Went First?</Label>
            <Select value={wentFirst} onValueChange={setWentFirst}>
              <SelectTrigger className="bg-muted/20 border-border/50">
                <SelectValue placeholder="Unknown" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-mono uppercase tracking-wider">Notes</Label>
          <Textarea
            placeholder="Key plays, misplays, observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="bg-muted/20 border-border/50 resize-none"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending || !opponentArchetypeId}
          className="holo-gradient text-background"
        >
          {isPending ? "Logging..." : "Log Match"}
        </Button>
      </form>
    </div>
  );
}
