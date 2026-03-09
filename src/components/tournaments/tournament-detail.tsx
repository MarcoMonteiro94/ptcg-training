"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeckCombobox } from "@/components/shared/deck-combobox";
import {
  updateUserTournament,
  deleteUserTournament,
} from "@/server/actions/tournaments";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";
import { cn } from "@/lib/utils";
import {
  type TournamentType,
  type TournamentPlacing,
  TOURNAMENT_TYPES,
  PLACING_OPTIONS,
  getPlacingLabel,
  getTypeStyle,
  getPlacingStyle,
} from "@/lib/tournament-utils";

interface TournamentDetailProps {
  tournament: {
    id: string;
    name: string;
    date: string;
    format: string;
    userArchetypeId: string | null;
    tournamentType: TournamentType | null;
    placing: string | null;
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

  const [placing, setPlacing] = useState(tournament.placing || "");
  const [notes, setNotes] = useState(tournament.notes || "");
  const [userArchetypeId, setUserArchetypeId] = useState(tournament.userArchetypeId || "");
  const [tournamentType, setTournamentType] = useState<TournamentType>(tournament.tournamentType || "challenge");

  const deckName = tournament.userArchetypeId
    ? archetypeNames[tournament.userArchetypeId]
    : null;
  const deckImg = tournament.userArchetypeId
    ? getArchetypeImageUrl(tournament.userArchetypeId)
    : null;

  const effectiveType = tournament.tournamentType || "challenge";
  const tType = getTypeStyle(effectiveType);

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
        placing: (placing as TournamentPlacing) || undefined,
        notes: notes || undefined,
        userArchetypeId: userArchetypeId || undefined,
        tournamentType,
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
    <div className="space-y-4 overflow-hidden">
      {/* Header */}
      <div className="space-y-3">
        {/* Top bar: back + actions */}
        <div className="flex items-center justify-between">
          <Link
            href="/tournaments"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tournaments</span>
          </Link>

          <div className="flex gap-1.5">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/30 text-xs h-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3 sm:mr-1.5" />
                  <span className="hidden sm:inline">Edit</span>
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
                  <X className="h-3 w-3 sm:mr-1.5" />
                  <span className="hidden sm:inline">Cancel</span>
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
                    <>
                      <Check className="h-3 w-3 sm:mr-1.5" />
                      <span className="hidden sm:inline">Save</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tournament info */}
        <div className="flex items-start gap-3">
          {deckImg && (
            <Image
              src={deckImg}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-contain shrink-0 mt-0.5"
              unoptimized
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight break-words min-w-0">
                {tournament.name}
              </h1>
              <Badge
                className={cn(
                  "font-mono text-[9px] px-1.5 py-0 border-0 shrink-0 capitalize",
                  tType.bg,
                  tType.text
                )}
              >
                {effectiveType}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground/60 mt-1 font-mono">
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
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="font-mono text-sm font-medium">
          <span className="text-[oklch(0.80_0.15_155)]">{wins}</span>
          <span className="text-muted-foreground/40">-</span>
          <span className="text-[oklch(0.80_0.15_25)]">{losses}</span>
          {draws > 0 && (
            <>
              <span className="text-muted-foreground/40">-</span>
              <span className="text-[oklch(0.85_0.12_80)]">{draws}</span>
            </>
          )}
        </div>
        {tournament.placing ? (
          <Badge className={cn(
            "font-mono text-xs border-0",
            getPlacingStyle(tournament.placing).bg,
            getPlacingStyle(tournament.placing).text
          )}>
            {tournament.placing === "champion" ? "🏆 " : ""}
            {getPlacingLabel(tournament.placing)}
          </Badge>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            + Add placing
          </button>
        )}
      </div>

      {/* Edit form */}
      {isEditing && (
        <div className="rounded-xl border border-border/30 glass-card p-3 sm:p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Deck</Label>
            <DeckCombobox
              archetypes={archetypes}
              value={userArchetypeId}
              onValueChange={setUserArchetypeId}
              placeholder="Select deck"
            />
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Tournament Type</Label>
              <Select value={tournamentType} onValueChange={(v) => setTournamentType(v as TournamentType)}>
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
              <Label className="text-xs">Placing</Label>
              <Select value={placing} onValueChange={setPlacing}>
                <SelectTrigger className="bg-muted/20 border-border/50 h-10 sm:h-9">
                  <SelectValue placeholder="Select placing" />
                </SelectTrigger>
                <SelectContent>
                  {PLACING_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
