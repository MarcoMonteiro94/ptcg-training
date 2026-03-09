import { Card, CardContent } from "@/components/ui/card";

interface QuickStatsProps {
  winRate: number;
  totalGames: number;
  streak: string;
  weeklyWinRate: number;
}

export function QuickStats({ winRate, totalGames, streak, weeklyWinRate }: QuickStatsProps) {
  const stats = [
    {
      label: "Win Rate",
      value: totalGames > 0 ? `${Math.round(winRate * 100)}%` : "—",
    },
    {
      label: "Total Games",
      value: totalGames.toString(),
    },
    {
      label: "Streak",
      value: streak || "—",
    },
    {
      label: "Weekly WR",
      value: totalGames > 0 ? `${Math.round(weeklyWinRate * 100)}%` : "—",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-card">
          <CardContent className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground/70">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight mt-1">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
