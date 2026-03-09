"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTournamentRound } from "@/server/actions/tournaments";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface AddRoundFormProps {
  tournamentId: string;
  nextRoundNumber: number;
  archetypes: Array<{ id: string; name: string }>;
  onClose: () => void;
}

type GameResult = "win" | "loss" | null;

interface GameState {
  result: GameResult;
  wentFirst: boolean | null;
}

export function AddRoundForm({
  tournamentId,
  nextRoundNumber,
  archetypes,
  onClose,
}: AddRoundFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [isID, setIsID] = useState(false);
  const [opponentArchetypeId, setOpponentArchetypeId] = useState("");
  const [games, setGames] = useState<GameState[]>([
    { result: null, wentFirst: null },
    { result: null, wentFirst: null },
    { result: null, wentFirst: null },
  ]);

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
      const response = await addTournamentRound({
        tournamentId,
        roundNumber: nextRoundNumber,
        opponentArchetypeId: isID ? undefined : opponentArchetypeId,
        games: gamesToLog,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success(`Round ${nextRoundNumber} logged!`);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="rounded-lg border border-border/30 bg-card/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">
          Round {nextRoundNumber}
        </span>
        <button
          onClick={onClose}
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Round type toggle */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setIsID(false)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            isID
              ? "bg-[oklch(0.78_0.16_80/0.2)] text-[oklch(0.85_0.12_80)] border border-[oklch(0.78_0.16_80/0.3)]"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
          }`}
        >
          ID (Intentional Draw)
        </button>
      </div>

      {!isID && (
        <div className="space-y-1.5">
          <Label className="text-xs">Opponent&apos;s Deck *</Label>
          <Select value={opponentArchetypeId} onValueChange={setOpponentArchetypeId}>
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
      )}

      {isID ? (
        <div className="rounded-lg bg-[oklch(0.78_0.16_80/0.1)] border border-[oklch(0.78_0.16_80/0.2)] px-3 py-2.5 text-center">
          <span className="text-xs text-[oklch(0.85_0.12_80)] font-medium">
            Intentional Draw — both players agree to draw the round
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
                  className="flex items-center gap-3 rounded-lg bg-muted/20 border border-border/30 p-2.5"
                >
                  <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">
                    Game {i + 1}
                  </span>

                  <div className="flex gap-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleResult(i, "win")}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        games[i].result === "win"
                          ? "bg-[oklch(0.72_0.19_155/0.2)] text-[oklch(0.80_0.15_155)] border border-[oklch(0.72_0.19_155/0.3)]"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      W
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleResult(i, "loss")}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        games[i].result === "loss"
                          ? "bg-[oklch(0.65_0.22_25/0.2)] text-[oklch(0.80_0.15_25)] border border-[oklch(0.65_0.22_25/0.3)]"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      L
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleWentFirst(i)}
                    className={`rounded-md px-2 py-1.5 text-[10px] font-mono transition-colors shrink-0 ${
                      games[i].wentFirst === true
                        ? "bg-foreground/10 text-foreground border border-foreground/20"
                        : games[i].wentFirst === false
                          ? "bg-foreground/10 text-foreground border border-foreground/20"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    {games[i].wentFirst === null
                      ? "1st?"
                      : games[i].wentFirst
                        ? "1st"
                        : "2nd"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {completedGames.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Set score:</span>
              <span className="font-mono font-medium">
                <span className="text-[oklch(0.80_0.15_155)]">{winsCount}</span>
                <span className="text-muted-foreground mx-1">-</span>
                <span className="text-[oklch(0.80_0.15_25)]">{lossCount}</span>
              </span>
              {isSetDecided && (
                <span
                  className={`font-medium ${winsCount > lossCount ? "text-[oklch(0.80_0.15_155)]" : "text-[oklch(0.80_0.15_25)]"}`}
                >
                  ({winsCount > lossCount ? "Won" : "Lost"} set)
                </span>
              )}
            </div>
          )}
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || !canSubmit}
        className="w-full holo-gradient text-background text-xs h-9"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          `Log Round ${nextRoundNumber}`
        )}
      </Button>
    </div>
  );
}
