"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteTournamentRound } from "@/server/actions/tournaments";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";
import { resultConfig } from "@/lib/match-utils";
import { AddRoundForm } from "./add-round-form";
import { EditRoundDialog } from "./edit-round-dialog";

interface Round {
  id: string;
  result: string;
  opponentArchetypeId: string | null;
  opponentName: string | null;
  wentFirst: boolean | null;
  roundNumber: number | null;
  notes: string | null;
  playedAt: Date;
}

interface TournamentRoundsProps {
  tournament: {
    id: string;
    rounds: Round[];
  };
  archetypes: Array<{ id: string; name: string }>;
  archetypeNames: Record<string, string>;
}

export function TournamentRounds({
  tournament,
  archetypes,
  archetypeNames,
}: TournamentRoundsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingRound, setDeletingRound] = useState<number | null>(null);
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Group rounds by roundNumber
  const roundGroups = new Map<number, Round[]>();
  for (const round of tournament.rounds) {
    const rn = round.roundNumber ?? 0;
    if (!roundGroups.has(rn)) roundGroups.set(rn, []);
    roundGroups.get(rn)!.push(round);
  }

  const sortedRoundNumbers = [...roundGroups.keys()].sort((a, b) => a - b);
  const nextRoundNumber =
    sortedRoundNumbers.length > 0
      ? sortedRoundNumbers[sortedRoundNumbers.length - 1] + 1
      : 1;

  function handleDeleteRound(e: React.MouseEvent, roundNumber: number) {
    e.stopPropagation();
    if (!confirm(`Delete Round ${roundNumber}? This will remove all games from this round.`))
      return;

    setDeletingRound(roundNumber);
    startTransition(async () => {
      const response = await deleteTournamentRound(tournament.id, roundNumber);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(`Round ${roundNumber} deleted`);
        router.refresh();
      }
      setDeletingRound(null);
    });
  }

  return (
    <div className="space-y-2">
      {sortedRoundNumbers.length === 0 && !showAddForm && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground text-sm">No rounds logged yet.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Add your first round below.
          </p>
        </div>
      )}

      {sortedRoundNumbers.map((roundNumber) => {
        const games = roundGroups.get(roundNumber)!;
        const opponent = games[0];
        const oppImg = opponent.opponentArchetypeId
          ? getArchetypeImageUrl(opponent.opponentArchetypeId)
          : null;
        const oppName = opponent.opponentName || (opponent.opponentArchetypeId ? archetypeNames[opponent.opponentArchetypeId] : "Unknown");

        const roundWins = games.filter((g) => g.result === "win").length;
        const roundLosses = games.filter((g) => g.result === "loss").length;
        const roundDraws = games.filter((g) => g.result === "draw").length;
        const isIntentionalDraw = games.length === 1 && roundDraws === 1;
        const roundResult =
          isIntentionalDraw ? "draw" :
          roundWins > roundLosses ? "win" : roundLosses > roundWins ? "loss" : "draw";

        return (
          <button
            key={roundNumber}
            type="button"
            onClick={() => setEditingRound(roundNumber)}
            className={cn(
              "group flex items-center gap-2 rounded-lg border px-2.5 py-2.5 sm:px-3 sm:gap-2.5 w-full text-left transition-colors hover:bg-muted/15 active:bg-muted/25",
              resultConfig[roundResult].border,
              "bg-card/30"
            )}
          >
            <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">
              {roundNumber}
            </span>

            {/* Game results or ID badge */}
            {isIntentionalDraw ? (
              <Badge
                className={cn(
                  "font-mono font-bold text-[10px] px-1.5 h-5 flex items-center justify-center border-0",
                  resultConfig.draw.bg,
                  resultConfig.draw.text
                )}
              >
                ID
              </Badge>
            ) : (
              <div className="flex gap-0.5 shrink-0">
                {games.map((game) => {
                  const cfg =
                    resultConfig[game.result as keyof typeof resultConfig] ||
                    resultConfig.draw;
                  return (
                    <Badge
                      key={game.id}
                      className={cn(
                        "font-mono font-bold text-[10px] w-5 h-5 p-0 flex items-center justify-center border-0",
                        cfg.bg,
                        cfg.text
                      )}
                    >
                      {cfg.label}
                    </Badge>
                  );
                })}
              </div>
            )}

            {oppImg && (
              <Image
                src={oppImg}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 object-contain shrink-0"
                unoptimized
              />
            )}

            <div className="flex-1 min-w-0">
              <span className="text-xs sm:text-sm truncate block">
                {oppName}
              </span>
            </div>

            {!isIntentionalDraw && (
              <div className="font-mono text-xs font-medium shrink-0">
                <span className="text-[oklch(0.80_0.15_155)]">{roundWins}</span>
                <span className="text-muted-foreground/40">-</span>
                <span className="text-[oklch(0.80_0.15_25)]">{roundLosses}</span>
              </div>
            )}

            <div
              role="button"
              tabIndex={0}
              onClick={(e) => handleDeleteRound(e, roundNumber)}
              onKeyDown={(e) => { if (e.key === "Enter") handleDeleteRound(e as unknown as React.MouseEvent, roundNumber); }}
              className="text-muted-foreground/30 hover:text-destructive active:text-destructive transition-colors shrink-0 p-1 -mr-1"
            >
              {deletingRound === roundNumber ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </div>
          </button>
        );
      })}

      {/* Edit round dialog */}
      {editingRound !== null && roundGroups.has(editingRound) && (
        <EditRoundDialog
          tournamentId={tournament.id}
          roundNumber={editingRound}
          opponentArchetypeId={roundGroups.get(editingRound)![0].opponentArchetypeId}
          games={roundGroups.get(editingRound)!.map((g) => ({
            result: g.result,
            wentFirst: g.wentFirst,
          }))}
          archetypes={archetypes}
          open={true}
          onOpenChange={(open) => { if (!open) setEditingRound(null); }}
        />
      )}

      {showAddForm ? (
        <AddRoundForm
          tournamentId={tournament.id}
          nextRoundNumber={nextRoundNumber}
          archetypes={archetypes}
          onClose={() => setShowAddForm(false)}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed border-border/30 text-xs h-10 sm:h-9 text-muted-foreground"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Round {nextRoundNumber}
        </Button>
      )}
    </div>
  );
}
