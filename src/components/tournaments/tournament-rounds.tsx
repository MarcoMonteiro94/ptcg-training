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
import { AddRoundForm } from "./add-round-form";

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

const resultConfig = {
  win: {
    bg: "bg-[oklch(0.72_0.19_155/0.15)]",
    text: "text-[oklch(0.80_0.15_155)]",
    border: "border-[oklch(0.72_0.19_155/0.25)]",
    label: "W",
  },
  loss: {
    bg: "bg-[oklch(0.65_0.22_25/0.15)]",
    text: "text-[oklch(0.80_0.15_25)]",
    border: "border-[oklch(0.65_0.22_25/0.25)]",
    label: "L",
  },
  draw: {
    bg: "bg-[oklch(0.78_0.16_80/0.15)]",
    text: "text-[oklch(0.85_0.12_80)]",
    border: "border-[oklch(0.78_0.16_80/0.25)]",
    label: "D",
  },
};

export function TournamentRounds({
  tournament,
  archetypes,
  archetypeNames,
}: TournamentRoundsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingRound, setDeletingRound] = useState<number | null>(null);
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

  function handleDeleteRound(roundNumber: number) {
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
    <div className="space-y-3">
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
          <div
            key={roundNumber}
            className={cn(
              "group flex items-center gap-3 rounded-lg border px-3 py-2.5",
              resultConfig[roundResult].border,
              "bg-card/30"
            )}
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50 w-6 shrink-0">
              R{roundNumber}
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
              <div className="flex gap-1 shrink-0">
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
              <span className="text-sm font-medium truncate block">
                vs {oppName}
              </span>
            </div>

            {!isIntentionalDraw && (
              <div className="font-mono text-xs font-medium shrink-0">
                <span className="text-[oklch(0.80_0.15_155)]">{roundWins}</span>
                <span className="text-muted-foreground/50">-</span>
                <span className="text-[oklch(0.80_0.15_25)]">{roundLosses}</span>
              </div>
            )}

            <button
              onClick={() => handleDeleteRound(roundNumber)}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/30 hover:text-destructive shrink-0"
            >
              {deletingRound === roundNumber ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </button>
          </div>
        );
      })}

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
          className="w-full border-dashed border-border/30 text-xs h-9 text-muted-foreground"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Round {nextRoundNumber}
        </Button>
      )}
    </div>
  );
}
