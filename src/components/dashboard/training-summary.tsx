import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface TrainingSummaryProps {
  activePlan: {
    id: string;
    plan: { weeklyGameTarget: number };
  } | null;
  weeklyProgress: {
    gamesPlayed: number;
    gameTarget: number;
    completedGoals: number;
    totalGoals: number;
    completionRate: number;
  } | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
  } | null;
}

export function TrainingSummary({ activePlan, weeklyProgress, streak }: TrainingSummaryProps) {
  if (!activePlan) {
    return (
      <Card className="glass-card">
        <CardContent className="px-4 py-6 flex flex-col items-center text-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No active training plan</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Create a plan to track your improvement goals.
            </p>
          </div>
          <Link
            href="/training"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Start Training →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const gameProgress = weeklyProgress
    ? weeklyProgress.gamesPlayed / Math.max(weeklyProgress.gameTarget, 1)
    : 0;
  const goalProgress = weeklyProgress?.completionRate ?? 0;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_oklch(0.75_0.18_165/0.5)]" />
            <CardTitle className="text-sm font-semibold">Training Progress</CardTitle>
          </div>
          <Link
            href="/training"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View Plan →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-3">
        {/* Games Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Games this week</span>
            <span className="font-mono">
              {weeklyProgress?.gamesPlayed ?? 0}/{weeklyProgress?.gameTarget ?? 0}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(gameProgress * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Goals Progress */}
        {weeklyProgress && weeklyProgress.totalGoals > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Goals completed</span>
              <span className="font-mono">
                {weeklyProgress.completedGoals}/{weeklyProgress.totalGoals}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-[oklch(0.72_0.19_155)] transition-all"
                style={{ width: `${Math.min(goalProgress * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Streak */}
        {streak && streak.currentStreak > 0 && (
          <p className="text-xs text-muted-foreground">
            🔥 {streak.currentStreak} day streak (best: {streak.longestStreak})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
