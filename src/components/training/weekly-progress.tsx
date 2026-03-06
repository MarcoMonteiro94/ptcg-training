import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyProgressEmptyState } from "./empty-states";

interface WeeklyProgressProps {
  progress: {
    gamesPlayed: number;
    gameTarget: number;
    completedGoals: number;
    totalGoals: number;
    completionRate: number;
  } | null;
}

export function WeeklyProgress({ progress }: WeeklyProgressProps) {
  const gamesPlayed = progress?.gamesPlayed ?? 0;
  const gameTarget = progress?.gameTarget ?? 1;
  const gamesPercent = Math.min(100, Math.round((gamesPlayed / gameTarget) * 100));

  const goalsCompleted = progress?.completedGoals ?? 0;
  const goalsTotal = progress?.totalGoals ?? 0;
  const goalsPercent = goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0;

  const hasNoData = !progress || (gamesPlayed === 0 && goalsTotal === 0);

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.72_0.19_155)]" />
          <CardTitle className="text-base">Weekly Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasNoData ? (
          <WeeklyProgressEmptyState />
        ) : (
        <>
        {/* Games progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Games</span>
            <span className="font-mono font-medium">
              {gamesPlayed}/{gameTarget}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 shadow-[0_0_8px_oklch(0.75_0.18_165/0.4)]"
              style={{ width: `${gamesPercent}%` }}
            />
          </div>
        </div>

        {/* Goals progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Goals</span>
            <span className="font-mono font-medium">
              {goalsCompleted}/{goalsTotal}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-[oklch(0.72_0.19_155)] transition-all duration-500 shadow-[0_0_8px_oklch(0.72_0.19_155/0.4)]"
              style={{ width: `${goalsPercent}%` }}
            />
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg bg-muted/20 p-2.5 text-center">
            <p className="text-xl font-bold font-mono text-primary">{gamesPercent}%</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase">Game Target</p>
          </div>
          <div className="rounded-lg bg-muted/20 p-2.5 text-center">
            <p className="text-xl font-bold font-mono text-[oklch(0.72_0.19_155)]">{goalsPercent}%</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase">Goals Done</p>
          </div>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
