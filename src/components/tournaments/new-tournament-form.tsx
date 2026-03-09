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
import { createUserTournament } from "@/server/actions/tournaments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface NewTournamentFormProps {
  archetypes: Array<{ id: string; name: string }>;
}

export function NewTournamentForm({ archetypes }: NewTournamentFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [format, setFormat] = useState<"standard" | "expanded" | "unlimited">("standard");
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
          className="bg-muted/20 border-border/50 h-9"
        />
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Date *</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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

      <div className="space-y-1.5">
        <Label className="text-xs">Your Deck</Label>
        <Select value={userArchetypeId} onValueChange={setUserArchetypeId}>
          <SelectTrigger className="bg-muted/20 border-border/50 h-9">
            <SelectValue placeholder="Select deck" />
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
        onClick={handleSubmit}
        disabled={isPending || !name.trim()}
        className="w-full holo-gradient text-background text-xs h-9"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create Tournament"}
      </Button>
    </div>
  );
}
