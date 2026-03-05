import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveTrainingPlan, getWeeklyProgress, getDailyGoals } from "@/server/queries/training";
import { DailyGoalsCard } from "@/components/training/daily-goals-card";
import { WeeklyProgress } from "@/components/training/weekly-progress";
import { RecommendedMatchup } from "@/components/training/recommended-matchup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Sparkles } from "lucide-react";
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

  if (!plan) redirect("/training/setup");

  const today = new Date().toISOString().slice(0, 10);

  let progress: Awaited<ReturnType<typeof getWeeklyProgress>> | null = null;
  let todayGoals: Awaited<ReturnType<typeof getDailyGoals>> | null = null;

  try {
    progress = await getWeeklyProgress(user.id, plan.id);
    todayGoals = await getDailyGoals(user.id, today);
  } catch {
    // DB not connected
  }

  const todayMatchup = plan.plan.priorityMatchups[0] ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Training
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {plan.plan.focus}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/journal/new">
            <Button variant="outline" size="sm">
              Quick Log
            </Button>
          </Link>
          <Link href="/training/setup">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              New Plan
            </Button>
          </Link>
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Goals */}
        <DailyGoalsCard todayGoals={todayGoals} />

        {/* Weekly Progress */}
        <WeeklyProgress progress={progress} />
      </div>

      {/* Recommended Matchup */}
      {todayMatchup && <RecommendedMatchup matchup={todayMatchup} />}

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
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  {topic}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
