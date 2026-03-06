"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleGoalCompletion } from "@/server/actions/training";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Gamepad2,
  BookOpen,
  Swords,
  ClipboardCheck,
  Shuffle,
  Eye,
  Brain,
  Play,
  PenLine,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyGoalData } from "@/server/db/schema/user-data";
import { DailyGoalsEmptyState } from "./empty-states";
import { AddCustomGoal } from "./add-custom-goal";

interface DailyGoalsCardProps {
  todayGoals: {
    id: string;
    goals: DailyGoalData[];
    completedAt: Date | null;
  } | null;
}

const goalIcons: Record<string, typeof Gamepad2> = {
  games: Gamepad2,
  matchup_practice: Swords,
  study: BookOpen,
  review: ClipboardCheck,
  mulligan_practice: Shuffle,
  prize_check: Eye,
  deck_knowledge: Brain,
  opening_sequence: Play,
  custom: PenLine,
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
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <Card
      className={cn(
        "bg-card/50 border-border/50 transition-all duration-500",
        allCompleted && "border-primary/30 shadow-[0_0_15px_oklch(0.75_0.18_165/0.15)]"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                allCompleted ? "bg-primary animate-pulse" : "bg-primary"
              )}
            />
            <CardTitle className="text-base">Today&apos;s Goals</CardTitle>
          </div>
          <span
            className={cn(
              "text-xs font-mono",
              allCompleted ? "text-primary font-bold" : "text-muted-foreground"
            )}
          >
            {completedCount}/{totalCount}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!todayGoals || todayGoals.goals.length === 0 ? (
          <DailyGoalsEmptyState />
        ) : (
          <>
            <ul className="space-y-2">
              {todayGoals.goals.map((goal, i) => {
                const Icon = goalIcons[goal.type] || Circle;
                return (
                  <li key={i}>
                    <button
                      onClick={() => handleToggle(i)}
                      disabled={isPending}
                      className={cn(
                        "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-left",
                        "transition-all duration-300",
                        goal.completed
                          ? "bg-primary/5 text-muted-foreground scale-[0.99]"
                          : "bg-muted/20 hover:bg-muted/40"
                      )}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 animate-[scale-in_0.2s_ease-out]" />
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

            {!allCompleted && todayGoals && (
              <div className="mt-2">
                <AddCustomGoal goalId={todayGoals.id} />
              </div>
            )}

            {allCompleted && (
              <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-3 text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <PartyPopper className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">All Done!</span>
                  <PartyPopper className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Great work today! Your consistency is building your competitive edge.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
