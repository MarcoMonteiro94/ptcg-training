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
import { DeckCombobox } from "@/components/shared/deck-combobox";
import { createUserTournament } from "@/server/actions/tournaments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TOURNAMENT_TYPES } from "@/lib/tournament-utils";

interface NewTournamentFormProps {
  archetypes: Array<{ id: string; name: string }>;
}

export function NewTournamentForm({ archetypes }: NewTournamentFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [format, setFormat] = useState<"standard" | "expanded" | "unlimited">("standard");
  const [tournamentType, setTournamentType] = useState<"online" | "challenge" | "cup" | "regional" | "international" | "worlds">("challenge");
  const [userArchetypeId, setUserArchetypeId] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Tournament name is required");
      return;
    }

    startTransition(async () => {
      const response = await createUserTournament({
        name: name.trim(),
        date,
        format,
        userArchetypeId: userArchetypeId || undefined,
        tournamentType,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Tournament created!");
      router.push(`/tournaments/${response.tournamentId}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Tournament Name *</Label>
        <Input
          placeholder="e.g. League Challenge January"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-muted/20 border-border/50 h-10 sm:h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Date *</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-muted/20 border-border/50 h-10 sm:h-9"
        />
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={tournamentType} onValueChange={(v) => setTournamentType(v as typeof tournamentType)}>
            <SelectTrigger className="bg-muted/20 border-border/50 h-10 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOURNAMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
            <SelectTrigger className="bg-muted/20 border-border/50 h-10 sm:h-9">
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
        <Label className="text-xs">Your Deck</Label>
        <DeckCombobox
          archetypes={archetypes}
          value={userArchetypeId}
          onValueChange={setUserArchetypeId}
          placeholder="Select deck"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending || !name.trim()}
        className="w-full holo-gradient text-background text-xs h-10 sm:h-9"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create Tournament"}
      </Button>
    </div>
  );
}
