import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTrainingHistory, getTrainingStreak } from "@/server/queries/training";
import { BackButton } from "@/components/shared/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrainingHistoryEmptyState } from "@/components/training/empty-states";
import { TrendingUp, TrendingDown, Trophy, Flame } from "lucide-react";

export const metadata: Metadata = {
  title: "Training History",
  description: "View your past training plans and performance history.",
};

export default async function TrainingHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let history: Awaited<ReturnType<typeof getTrainingHistory>> = [];
  let streak: Awaited<ReturnType<typeof getTrainingStreak>> | null = null;
  try {
    [history, streak] = await Promise.all([
      getTrainingHistory(user.id),
      getTrainingStreak(user.id),
    ]);
  } catch {
    // DB not connected
  }

  const completedPlans = history.filter((p) => p.status === "completed" && p.completionSummary);
  const avgCompletion =
    completedPlans.length > 0
      ? Math.round(
          completedPlans.reduce((s, p) => {
            const summary = p.completionSummary!;
            return s + (summary.goalsTotal > 0 ? summary.goalsCompleted / summary.goalsTotal : 0);
          }, 0) /
            completedPlans.length *
            100
        )
      : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <BackButton href="/training" label="Training" />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Training History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your past training plans and performance
        </p>
      </div>

      {history.length === 0 ? (
        <TrainingHistoryEmptyState />
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3 text-center">
                <Trophy className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold font-mono">{completedPlans.length}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-4 w-4 mx-auto text-[oklch(0.72_0.19_155)] mb-1" />
                <p className="text-lg font-bold font-mono">{avgCompletion}%</p>
                <p className="text-[10px] text-muted-foreground">Avg Completion</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3 text-center">
                <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                <p className="text-lg font-bold font-mono">
                  {streak?.longestStreak ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Best Streak</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {history.map((plan, index) => {
              const summary = plan.completionSummary;
              const completionRate =
                summary && summary.goalsTotal > 0
                  ? Math.round((summary.goalsCompleted / summary.goalsTotal) * 100)
                  : null;

              // Week-over-week delta with next (older) completed plan
              const prevPlan = history
                .slice(index + 1)
                .find((p) => p.status === "completed" && p.completionSummary);
              const prevSummary = prevPlan?.completionSummary;

              let completionDelta: number | null = null;
              let winRateDelta: number | null = null;
              if (summary && prevSummary) {
                const prevRate =
                  prevSummary.goalsTotal > 0
                    ? Math.round((prevSummary.goalsCompleted / prevSummary.goalsTotal) * 100)
                    : 0;
                if (completionRate !== null) completionDelta = completionRate - prevRate;
                winRateDelta = summary.winRate - prevSummary.winRate;
              }

              return (
                <Card key={plan.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {plan.plan.focus}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {plan.weekStart} &mdash; {plan.weekEnd}
                        </p>
                        {plan.plan.focusAreas && plan.plan.focusAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {plan.plan.focusAreas.map((area) => (
                              <Badge
                                key={area}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {area}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {completionRate !== null && (
                          <span className="text-xs font-mono text-muted-foreground">
                            {completionRate}%
                          </span>
                        )}
                        <Badge
                          variant={plan.status === "completed" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {plan.status}
                        </Badge>
                      </div>
                    </div>

                    {summary && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/30">
                        <div className="text-center">
                          <p className="text-sm font-bold font-mono">
                            {summary.gamesPlayed}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Games</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-sm font-bold font-mono">
                              {summary.winRate}%
                            </p>
                            {winRateDelta !== null && winRateDelta !== 0 && (
                              <DeltaIndicator value={winRateDelta} />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">Win Rate</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <p className="text-sm font-bold font-mono">
                              {completionRate ?? 0}%
                            </p>
                            {completionDelta !== null && completionDelta !== 0 && (
                              <DeltaIndicator value={completionDelta} />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">Goals</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DeltaIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center text-[10px] text-green-500 font-mono">
        <TrendingUp className="h-3 w-3" />
        +{value}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center text-[10px] text-red-500 font-mono">
        <TrendingDown className="h-3 w-3" />
        {value}
      </span>
    );
  }
  return null;
}
