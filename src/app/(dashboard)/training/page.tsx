import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveTrainingPlan, getWeeklyProgress, getDailyGoals, getTrainingStreak, getMatchupImprovement, isPlanCompletable, getTrainingPeriodStats } from "@/server/queries/training";

export const metadata: Metadata = {
  title: "Training",
  description: "AI-generated weekly training plans, daily goals, and recommended matchups for competitive Pokemon TCG.",
};
import { DailyGoalsCard } from "@/components/training/daily-goals-card";
import { WeeklyProgress } from "@/components/training/weekly-progress";
import { RecommendedMatchup } from "@/components/training/recommended-matchup";
import { StreakBadge } from "@/components/training/streak-badge";
import { MatchupImprovementCard } from "@/components/training/matchup-improvement-card";
import { AbandonPlanDialog } from "@/components/training/abandon-plan-dialog";
import { EditPlanDialog } from "@/components/training/edit-plan-dialog";
import { PlanCompletionModal } from "@/components/training/plan-completion-modal";
import { TrainingWinRateChart } from "@/components/training/training-win-rate-chart";
import { RecalibrateButton } from "@/components/training/recalibrate-button";
import { TrainingEmptyState } from "@/components/training/empty-states";
import { QuickLogDialog } from "@/components/journal/quick-log-dialog";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Sparkles, History } from "lucide-react";
import Link from "next/link";

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let plan: Awaited<ReturnType<typeof getActiveTrainingPlan>> | null = null;
  try {
    plan = await getActiveTrainingPlan(user.id);
  } catch {
    // DB not connected
  }

  if (!plan) return <TrainingEmptyState />;

  const today = new Date().toISOString().slice(0, 10);

  let progress: Awaited<ReturnType<typeof getWeeklyProgress>> | null = null;
  let todayGoals: Awaited<ReturnType<typeof getDailyGoals>> | null = null;
  let streak: Awaited<ReturnType<typeof getTrainingStreak>> | null = null;
  let matchupImprovements: Awaited<ReturnType<typeof getMatchupImprovement>> = [];
  let completable = false;
  let periodStats: Awaited<ReturnType<typeof getTrainingPeriodStats>> = [];
  let archetypeList: Array<{ id: string; name: string }> = [];

  try {
    [progress, todayGoals, streak, matchupImprovements, completable, periodStats] = await Promise.all([
      getWeeklyProgress(user.id, plan.id),
      getDailyGoals(user.id, today),
      getTrainingStreak(user.id),
      getMatchupImprovement(
        user.id,
        plan.plan.priorityMatchups,
        plan.weekStart,
        plan.weekEnd
      ),
      isPlanCompletable(user.id, plan.id),
      getTrainingPeriodStats(user.id, plan.id),
    ]);
    const archetypes = await getAllArchetypes();
    archetypeList = archetypes.map((a) => ({ id: a.id, name: a.name }));
  } catch {
    // DB not connected
  }

  const dayOfWeek = new Date().getDay();
  const matchups = plan.plan.priorityMatchups;
  const todayMatchupIndex = matchups.length > 0 ? dayOfWeek % matchups.length : -1;

  return (
    <div className="space-y-6 animate-fade-in">
      <PlanCompletionModal
        planId={plan.id}
        isCompletable={completable}
        gamesPlayed={progress?.gamesPlayed ?? 0}
        gameTarget={progress?.gameTarget ?? plan.plan.weeklyGameTarget}
        completedGoals={progress?.completedGoals ?? 0}
        totalGoals={progress?.totalGoals ?? 0}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Training
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {plan.plan.focus}
          </p>
          {streak && (
            <div className="mt-2">
              <StreakBadge
                currentStreak={streak.currentStreak}
                longestStreak={streak.longestStreak}
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <EditPlanDialog
            planId={plan.id}
            weeklyTarget={plan.plan.weeklyGameTarget}
            studyTopics={plan.plan.studyTopics}
          />
          <Link href="/training/history">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <History className="h-4 w-4" />
            </Button>
          </Link>
          <QuickLogDialog archetypes={archetypeList} />
          <AbandonPlanDialog
            planId={plan.id}
            completionRate={progress?.completionRate ?? 0}
            gamesPlayed={progress?.gamesPlayed ?? 0}
            gameTarget={progress?.gameTarget ?? plan.plan.weeklyGameTarget}
          />
        </div>
      </div>

      {/* AI Rationale */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg holo-gradient">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                AI Coach Says
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {plan.plan.aiRationale}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <RecalibrateButton planId={plan.id} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Goals */}
        <DailyGoalsCard todayGoals={todayGoals} />

        {/* Weekly Progress */}
        <WeeklyProgress progress={progress} />
      </div>

      {/* Recommended Matchup */}
      {matchups.length > 0 && (
        <RecommendedMatchup
          matchups={matchups}
          initialIndex={todayMatchupIndex}
        />
      )}

      {/* Win Rate Chart */}
      <TrainingWinRateChart stats={periodStats} />

      {/* Matchup Improvement */}
      <MatchupImprovementCard improvements={matchupImprovements} />

      {/* Study Topics */}
      {plan.plan.studyTopics.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.16_80)]" />
              <CardTitle className="text-base">Study Topics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.plan.studyTopics.map((topic, i) => (
                <li key={i}>
                  <Link
                    href={`/coach?topic=${encodeURIComponent(topic)}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/50 group-hover:bg-primary" />
                    <span className="group-hover:underline underline-offset-2">{topic}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
