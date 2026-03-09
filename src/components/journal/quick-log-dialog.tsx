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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createMatchLog, createMatchLogBatch } from "@/server/actions/journal";
import { toast } from "sonner";
import { Plus, Swords, Trophy, Loader2 } from "lucide-react";

interface Archetype {
  id: string;
  name: string;
}

interface QuickLogDialogProps {
  archetypes: Archetype[];
  children: React.ReactNode;
}

type GameResult = "win" | "loss" | null;

interface TournamentGame {
  result: GameResult;
  wentFirst: boolean | null;
}

export function QuickLogDialog({ archetypes, children }: QuickLogDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">Quick Log</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1 text-xs">
              <Swords className="h-3.5 w-3.5 mr-1.5" />
              Single Match
            </TabsTrigger>
            <TabsTrigger value="tournament" className="flex-1 text-xs">
              <Trophy className="h-3.5 w-3.5 mr-1.5" />
              Tournament Set
            </TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <SingleMatchForm archetypes={archetypes} onClose={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="tournament">
            <TournamentSetForm archetypes={archetypes} onClose={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SingleMatchForm({
  archetypes,
  onClose,
}: {
  archetypes: Archetype[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [userArchetypeId, setUserArchetypeId] = useState("");
  const [opponentArchetypeId, setOpponentArchetypeId] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "draw">("win");
  const [wentFirst, setWentFirst] = useState<string>("");
  const [notes, setNotes] = useState("");

  function handleSubmit(closeAfter: boolean) {
    if (!opponentArchetypeId) {
      toast.error("Opponent deck is required");
      return;
    }

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
      router.refresh();

      if (closeAfter) {
        onClose();
      } else {
        // Reset for next match, keep user deck
        setOpponentArchetypeId("");
        setResult("win");
        setWentFirst("");
        setNotes("");
      }
    });
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="grid gap-3 grid-cols-2">
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
      </div>

      <div className="grid gap-3 grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Result *</Label>
          <Select value={result} onValueChange={(v) => setResult(v as typeof result)}>
            <SelectTrigger className="bg-muted/20 border-border/50 h-9">
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
            <SelectTrigger className="bg-muted/20 border-border/50 h-9">
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
          placeholder="Key plays, observations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="bg-muted/20 border-border/50 resize-none text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleSubmit(true)}
          disabled={isPending || !opponentArchetypeId}
          className="flex-1 holo-gradient text-background text-xs h-9"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log & Close"}
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isPending || !opponentArchetypeId}
          variant="outline"
          className="flex-1 border-border/30 text-xs h-9"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log & Add Another"}
        </Button>
      </div>
    </div>
  );
}

function TournamentSetForm({
  archetypes,
  onClose,
}: {
  archetypes: Archetype[];
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [userArchetypeId, setUserArchetypeId] = useState("");
  const [opponentArchetypeId, setOpponentArchetypeId] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [games, setGames] = useState<TournamentGame[]>([
    { result: null, wentFirst: null },
    { result: null, wentFirst: null },
    { result: null, wentFirst: null },
  ]);

  const winsCount = games.filter((g) => g.result === "win").length;
  const lossCount = games.filter((g) => g.result === "loss").length;
  const isSetDecided = winsCount >= 2 || lossCount >= 2;

  // Show game 3 only if 1-1
  const game1Done = games[0].result !== null;
  const game2Done = games[1].result !== null;
  const needsGame3 = game1Done && game2Done && winsCount === 1 && lossCount === 1;
  const visibleGames = needsGame3 || games[2].result !== null ? 3 : 2;

  function updateGame(index: number, update: Partial<TournamentGame>) {
    setGames((prev) => prev.map((g, i) => (i === index ? { ...g, ...update } : g)));
  }

  function toggleResult(index: number, value: GameResult) {
    const current = games[index].result;
    updateGame(index, { result: current === value ? null : value });
  }

  function toggleWentFirst(index: number) {
    const current = games[index].wentFirst;
    updateGame(index, { wentFirst: current === null ? true : current === true ? false : null });
  }

  const completedGames = games.slice(0, visibleGames).filter((g) => g.result !== null);
  const canSubmit = completedGames.length >= 2 && isSetDecided && opponentArchetypeId;

  function handleSubmit() {
    if (!canSubmit) return;

    const gamesToLog = games
      .slice(0, visibleGames)
      .filter((g) => g.result !== null)
      .map((g) => ({
        userArchetypeId: userArchetypeId || undefined,
        opponentArchetypeId,
        result: g.result as "win" | "loss",
        wentFirst: g.wentFirst ?? undefined,
        format: "standard" as const,
        notes: `Tournament R${roundNumber}`,
      }));

    startTransition(async () => {
      const response = await createMatchLogBatch(gamesToLog);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success(`${gamesToLog.length} games logged for Round ${roundNumber}!`);
      router.refresh();

      // Reset for next round — keep user deck
      setOpponentArchetypeId("");
      setRoundNumber((r) => r + 1);
      setGames([
        { result: null, wentFirst: null },
        { result: null, wentFirst: null },
        { result: null, wentFirst: null },
      ]);
    });
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">
          Round {roundNumber}
        </span>
      </div>

      <div className="grid gap-3 grid-cols-2">
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
      </div>

      {/* Game results grid */}
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
                {games[i].wentFirst === null ? "1st?" : games[i].wentFirst ? "1st" : "2nd"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Set summary */}
      {completedGames.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Set score:</span>
          <span className="font-mono font-medium">
            <span className="text-[oklch(0.80_0.15_155)]">{winsCount}</span>
            <span className="text-muted-foreground mx-1">-</span>
            <span className="text-[oklch(0.80_0.15_25)]">{lossCount}</span>
          </span>
          {isSetDecided && (
            <span className={`font-medium ${winsCount > lossCount ? "text-[oklch(0.80_0.15_155)]" : "text-[oklch(0.80_0.15_25)]"}`}>
              ({winsCount > lossCount ? "Won" : "Lost"} set)
            </span>
          )}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || !canSubmit}
        className="w-full holo-gradient text-background text-xs h-9"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          `Log Set (${completedGames.length} game${completedGames.length !== 1 ? "s" : ""})`
        )}
      </Button>
    </div>
  );
}
