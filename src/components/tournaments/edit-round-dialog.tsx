"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeckCombobox } from "@/components/shared/deck-combobox";
import { updateTournamentRound } from "@/server/actions/tournaments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type GameResult = "win" | "loss" | null;

interface GameState {
  result: GameResult;
  wentFirst: boolean | null;
}

interface EditRoundDialogProps {
  tournamentId: string;
  roundNumber: number;
  opponentArchetypeId: string | null;
  games: Array<{
    result: string;
    wentFirst: boolean | null;
  }>;
  archetypes: Array<{ id: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRoundDialog({
  tournamentId,
  roundNumber,
  opponentArchetypeId: initialOpp,
  games: initialGames,
  archetypes,
  open,
  onOpenChange,
}: EditRoundDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isInitiallyID = initialGames.length === 1 && initialGames[0].result === "draw";

  const [isID, setIsID] = useState(isInitiallyID);
  const [opponentArchetypeId, setOpponentArchetypeId] = useState(initialOpp || "");
  const [games, setGames] = useState<GameState[]>(() => {
    if (isInitiallyID) {
      return [
        { result: null, wentFirst: null },
        { result: null, wentFirst: null },
        { result: null, wentFirst: null },
      ];
    }
    const mapped: GameState[] = initialGames.map((g) => ({
      result: g.result === "draw" ? null : (g.result as GameResult),
      wentFirst: g.wentFirst,
    }));
    while (mapped.length < 3) {
      mapped.push({ result: null, wentFirst: null });
    }
    return mapped;
  });

  const winsCount = games.filter((g) => g.result === "win").length;
  const lossCount = games.filter((g) => g.result === "loss").length;
  const isSetDecided = winsCount >= 2 || lossCount >= 2;

  const game1Done = games[0].result !== null;
  const game2Done = games[1].result !== null;
  const needsGame3 = game1Done && game2Done && winsCount === 1 && lossCount === 1;
  const visibleGames = needsGame3 || games[2].result !== null ? 3 : 2;

  function toggleResult(index: number, value: GameResult) {
    setGames((prev) =>
      prev.map((g, i) =>
        i === index ? { ...g, result: g.result === value ? null : value } : g
      )
    );
  }

  function toggleWentFirst(index: number) {
    setGames((prev) =>
      prev.map((g, i) =>
        i === index
          ? {
              ...g,
              wentFirst:
                g.wentFirst === null ? true : g.wentFirst === true ? false : null,
            }
          : g
      )
    );
  }

  const completedGames = games.slice(0, visibleGames).filter((g) => g.result !== null);
  const canSubmit = isID
    ? true
    : completedGames.length >= 1 && !!opponentArchetypeId;

  function handleSubmit() {
    if (!canSubmit) return;

    const gamesToLog = isID
      ? [{ result: "draw" as const }]
      : games
          .slice(0, visibleGames)
          .filter((g) => g.result !== null)
          .map((g) => ({
            result: g.result as "win" | "loss",
            wentFirst: g.wentFirst ?? undefined,
          }));

    startTransition(async () => {
      const response = await updateTournamentRound({
        tournamentId,
        roundNumber,
        opponentArchetypeId: isID ? undefined : opponentArchetypeId,
        games: gamesToLog,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success(`Round ${roundNumber} updated!`);
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Edit Round {roundNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* Round type toggle */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setIsID(false)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                !isID
                  ? "bg-foreground/10 text-foreground border border-foreground/20"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              Match
            </button>
            <button
              type="button"
              onClick={() => setIsID(true)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                isID
                  ? "bg-[oklch(0.78_0.16_80/0.2)] text-[oklch(0.85_0.12_80)] border border-[oklch(0.78_0.16_80/0.3)]"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              ID
            </button>
          </div>

          {!isID && (
            <div className="space-y-1.5">
              <Label className="text-xs">Opponent&apos;s Deck *</Label>
              <DeckCombobox
                archetypes={archetypes}
                value={opponentArchetypeId}
                onValueChange={setOpponentArchetypeId}
                placeholder="Select deck"
              />
            </div>
          )}

          {isID ? (
            <div className="rounded-lg bg-[oklch(0.78_0.16_80/0.1)] border border-[oklch(0.78_0.16_80/0.2)] px-3 py-3 text-center">
              <span className="text-xs text-[oklch(0.85_0.12_80)] font-medium">
                Intentional Draw — both players agree to draw
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Games</Label>
                <div className="space-y-2">
                  {Array.from({ length: visibleGames }, (_, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-muted/20 border border-border/30 p-2.5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-muted-foreground/60">
                          Game {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleWentFirst(i)}
                          className={`rounded-md px-2.5 py-1 text-[10px] font-mono transition-colors ${
                            games[i].wentFirst === true
                              ? "bg-foreground/10 text-foreground border border-foreground/20"
                              : games[i].wentFirst === false
                                ? "bg-foreground/10 text-foreground border border-foreground/20"
                                : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          {games[i].wentFirst === null
                            ? "1st/2nd?"
                            : games[i].wentFirst
                              ? "Went 1st"
                              : "Went 2nd"}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleResult(i, "win")}
                          className={`rounded-md py-2.5 text-sm font-bold transition-colors ${
                            games[i].result === "win"
                              ? "bg-[oklch(0.72_0.19_155/0.2)] text-[oklch(0.80_0.15_155)] border border-[oklch(0.72_0.19_155/0.3)]"
                              : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          WIN
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleResult(i, "loss")}
                          className={`rounded-md py-2.5 text-sm font-bold transition-colors ${
                            games[i].result === "loss"
                              ? "bg-[oklch(0.65_0.22_25/0.2)] text-[oklch(0.80_0.15_25)] border border-[oklch(0.65_0.22_25/0.3)]"
                              : "bg-muted/30 text-muted-foreground/60 hover:bg-muted/50 border border-transparent"
                          }`}
                        >
                          LOSS
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {completedGames.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Set:</span>
                  <span className="font-mono font-medium">
                    <span className="text-[oklch(0.80_0.15_155)]">{winsCount}</span>
                    <span className="text-muted-foreground/40 mx-0.5">-</span>
                    <span className="text-[oklch(0.80_0.15_25)]">{lossCount}</span>
                  </span>
                  {isSetDecided && (
                    <span
                      className={`font-medium ${winsCount > lossCount ? "text-[oklch(0.80_0.15_155)]" : "text-[oklch(0.80_0.15_25)]"}`}
                    >
                      ({winsCount > lossCount ? "Won" : "Lost"})
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
            className="w-full holo-gradient text-background text-xs h-10 sm:h-9"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
