import { Flame } from "lucide-react";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  if (currentStreak === 0 && longestStreak === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-bold font-mono text-orange-500">
          {currentStreak}
        </span>
        <span className="text-xs text-muted-foreground">day streak</span>
      </div>
      {longestStreak > currentStreak && (
        <span className="text-xs text-muted-foreground">
          Best: {longestStreak}
        </span>
      )}
    </div>
  );
}
