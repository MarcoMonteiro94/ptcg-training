"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  updateUserTournament,
  deleteUserTournament,
} from "@/server/actions/tournaments";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";

interface TournamentDetailProps {
  tournament: {
    id: string;
    name: string;
    date: string;
    format: string;
    userArchetypeId: string | null;
    placing: number | null;
    notes: string | null;
    rounds: Array<{ result: string; roundNumber: number | null }>;
  };
  archetypeNames: Record<string, string>;
  archetypes: Array<{ id: string; name: string }>;
}

export function TournamentDetail({
  tournament,
  archetypeNames,
  archetypes,
}: TournamentDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [placing, setPlacing] = useState(tournament.placing?.toString() || "");
  const [notes, setNotes] = useState(tournament.notes || "");
  const [userArchetypeId, setUserArchetypeId] = useState(tournament.userArchetypeId || "");

  const deckName = tournament.userArchetypeId
    ? archetypeNames[tournament.userArchetypeId]
    : null;
  const deckImg = tournament.userArchetypeId
    ? getArchetypeImageUrl(tournament.userArchetypeId)
    : null;

  // Calculate record by round result (MD3), not individual games
  const roundGroups = new Map<number, string[]>();
  for (const r of tournament.rounds) {
    const rn = r.roundNumber ?? 0;
    if (!roundGroups.has(rn)) roundGroups.set(rn, []);
    roundGroups.get(rn)!.push(r.result);
  }
  let wins = 0, losses = 0, draws = 0;
  for (const results of roundGroups.values()) {
    const w = results.filter((r) => r === "win").length;
    const l = results.filter((r) => r === "loss").length;
    if (w > l) wins++;
    else if (l > w) losses++;
    else draws++;
  }

  function handleSave() {
    startTransition(async () => {
      const response = await updateUserTournament({
        id: tournament.id,
        placing: placing ? parseInt(placing) : undefined,
        notes: notes || undefined,
        userArchetypeId: userArchetypeId || undefined,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Tournament updated!");
      setIsEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this tournament? Matches will be kept but unlinked.")) return;

    startTransition(async () => {
      const response = await deleteUserTournament(tournament.id);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Tournament deleted");
      router.push("/tournaments");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/tournaments"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {deckImg && (
              <Image
                src={deckImg}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 object-contain shrink-0"
                unoptimized
              />
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
              {tournament.name}
            </h1>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground/70 mt-1 font-mono">
            <span>
              {new Date(tournament.date + "T00:00:00").toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            {deckName && <span>{deckName}</span>}
            <span className="capitalize">{tournament.format}</span>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-border/30 text-xs h-8"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border/30 text-xs h-8 text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-border/30 text-xs h-8"
                onClick={() => setIsEditing(false)}
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                className="holo-gradient text-background text-xs h-8"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm">
        <div className="font-mono font-medium">
          <span className="text-[oklch(0.80_0.15_155)]">{wins}</span>
          <span className="text-muted-foreground/50">-</span>
          <span className="text-[oklch(0.80_0.15_25)]">{losses}</span>
          {draws > 0 && (
            <>
              <span className="text-muted-foreground/50">-</span>
              <span className="text-[oklch(0.85_0.12_80)]">{draws}</span>
            </>
          )}
        </div>
        {tournament.placing && (
          <span className="text-muted-foreground">
            Placed <span className="font-medium text-foreground">#{tournament.placing}</span>
          </span>
        )}
      </div>

      {/* Edit form */}
      {isEditing && (
        <div className="rounded-xl border border-border/30 glass-card p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Deck</Label>
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

          <div className="space-y-1.5">
            <Label className="text-xs">Placing</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 3"
              value={placing}
              onChange={(e) => setPlacing(e.target.value)}
              className="bg-muted/20 border-border/50 h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              placeholder="Tournament notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-muted/20 border-border/50 resize-none text-sm"
            />
          </div>
        </div>
      )}

      {/* Notes display (when not editing) */}
      {!isEditing && tournament.notes && (
        <div className="rounded-lg bg-muted/10 border border-border/20 px-3 py-2">
          <p className="text-sm text-muted-foreground">{tournament.notes}</p>
        </div>
      )}
    </div>
  );
}
