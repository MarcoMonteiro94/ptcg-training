"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { completePlan } from "@/server/actions/training";
import { toast } from "sonner";
import { Loader2, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingPlanCompletionSummary } from "@/server/db/schema/user-data";

interface PlanCompletionModalProps {
  planId: string;
  isCompletable: boolean;
  gamesPlayed: number;
  gameTarget: number;
  completedGoals: number;
  totalGoals: number;
}

export function PlanCompletionModal({
  planId,
  isCompletable,
  gamesPlayed,
  gameTarget,
  completedGoals,
  totalGoals,
}: PlanCompletionModalProps) {
  const [open, setOpen] = useState(isCompletable);
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<TrainingPlanCompletionSummary | null>(null);
  const router = useRouter();

  function handleComplete() {
    startTransition(async () => {
      const result = await completePlan(planId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.summary) {
        setSummary(result.summary);
      }
    });
  }

  function handleDismiss() {
    setOpen(false);
    if (summary) {
      router.push("/training/setup");
    }
  }

  if (!isCompletable) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {summary ? "Week Complete!" : "Training Week Ended"}
          </DialogTitle>
          <DialogDescription>
            {summary
              ? "Here's your performance summary"
              : "Your training week has ended. Review your results and complete the plan."}
          </DialogDescription>
        </DialogHeader>

        {summary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/20 p-2.5 text-center">
                <p className="text-lg font-bold font-mono text-primary">
                  {summary.gamesPlayed}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                  Games
                </p>
              </div>
              <div className="rounded-lg bg-muted/20 p-2.5 text-center">
                <p className="text-lg font-bold font-mono text-[oklch(0.72_0.19_155)]">
                  {summary.goalsCompleted}/{summary.goalsTotal}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                  Goals
                </p>
              </div>
              <div className="rounded-lg bg-muted/20 p-2.5 text-center">
                <p className="text-lg font-bold font-mono text-[oklch(0.78_0.16_80)]">
                  {summary.winRate}%
                </p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                  Win Rate
                </p>
              </div>
            </div>

            {summary.matchupImprovements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase text-muted-foreground">
                  Matchup Deltas
                </p>
                {summary.matchupImprovements.map((m) => {
                  const delta = m.after - m.before;
                  return (
                    <div
                      key={m.archetypeId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{m.archetypeName}</span>
                      <span className="flex items-center gap-1.5 font-mono">
                        {m.before}% &rarr;{" "}
                        <span
                          className={cn(
                            "font-bold",
                            delta > 0 && "text-green-500",
                            delta < 0 && "text-red-500"
                          )}
                        >
                          {m.after}%
                        </span>
                        {delta > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        ) : delta < 0 ? (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-xs font-mono uppercase text-muted-foreground mb-1">
                AI Review
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summary.aiReview}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/20 p-2.5 text-center">
                <p className="text-lg font-bold font-mono">
                  {gamesPlayed}/{gameTarget}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                  Games
                </p>
              </div>
              <div className="rounded-lg bg-muted/20 p-2.5 text-center">
                <p className="text-lg font-bold font-mono">
                  {completedGoals}/{totalGoals}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">
                  Goals
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {summary ? (
            <Button onClick={handleDismiss} className="w-full">
              Start New Plan
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Continue Training
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isPending}
                className="flex-1 holo-gradient text-background"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Complete Plan"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
