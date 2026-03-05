"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleGoalCompletion } from "@/server/actions/training";
import { toast } from "sonner";
import { CheckCircle2, Circle, Gamepad2, BookOpen, Swords, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyGoalData } from "@/server/db/schema/user-data";

interface DailyGoalsCardProps {
  todayGoals: {
    id: string;
    goals: DailyGoalData[];
    completedAt: Date | null;
  } | null;
}

const goalIcons = {
  games: Gamepad2,
  matchup_practice: Swords,
  study: BookOpen,
  review: ClipboardCheck,
};

export function DailyGoalsCard({ todayGoals }: DailyGoalsCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(goalIndex: number) {
    if (!todayGoals || isPending) return;

    startTransition(async () => {
      const result = await toggleGoalCompletion(todayGoals.id, goalIndex);
      if (result.error) toast.error(result.error);
    });
  }

  const completedCount = todayGoals?.goals.filter((g) => g.completed).length ?? 0;
  const totalCount = todayGoals?.goals.length ?? 0;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <CardTitle className="text-base">Today&apos;s Goals</CardTitle>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!todayGoals || todayGoals.goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals for today.
          </p>
        ) : (
          <ul className="space-y-2">
            {todayGoals.goals.map((goal, i) => {
              const Icon = goalIcons[goal.type] || Circle;
              return (
                <li key={i}>
                  <button
                    onClick={() => handleToggle(i)}
                    disabled={isPending}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left",
                      goal.completed
                        ? "bg-primary/5 text-muted-foreground"
                        : "bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className={cn(goal.completed && "line-through")}>
                      {goal.description}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
