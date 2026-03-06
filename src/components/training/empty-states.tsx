import { Target, CalendarCheck, BarChart3, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TrainingEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Target className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-bold">Start Your Training Journey</h2>
        <p className="text-sm text-muted-foreground">
          Create a personalized training plan powered by AI. It will analyze your match history, identify weak matchups, and build a weekly program to level up your game.
        </p>
      </div>
      <Link href="/training/setup">
        <Button className="holo-gradient text-background">
          Create Training Plan
        </Button>
      </Link>
    </div>
  );
}

export function DailyGoalsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-2">
      <CalendarCheck className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        No goals scheduled for today. Enjoy the rest day!
      </p>
    </div>
  );
}

export function WeeklyProgressEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-2">
      <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        No progress data yet. Complete some goals to see your weekly stats.
      </p>
    </div>
  );
}

export function TrainingHistoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20">
        <History className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-bold">No Training History</h2>
        <p className="text-sm text-muted-foreground">
          Completed and abandoned training plans will appear here. Start training to build your history!
        </p>
      </div>
      <Link href="/training">
        <Button variant="outline">Go to Training</Button>
      </Link>
    </div>
  );
}
