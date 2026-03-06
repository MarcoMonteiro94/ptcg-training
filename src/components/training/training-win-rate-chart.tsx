"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DayStat {
  date: string;
  games: number;
  wins: number;
  winRate: number;
}

interface TrainingWinRateChartProps {
  stats: DayStat[];
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TrainingWinRateChart({ stats }: TrainingWinRateChartProps) {
  const hasGames = stats.some((s) => s.games > 0);
  if (!hasGames) return null;

  const chartData = stats.map((s) => ({
    ...s,
    day: dayLabels[new Date(s.date + "T12:00:00").getDay()],
  }));

  // Calculate trend
  const daysWithGames = stats.filter((s) => s.games > 0);
  let trend: "up" | "down" | "flat" = "flat";
  if (daysWithGames.length >= 2) {
    const firstHalf = daysWithGames.slice(0, Math.ceil(daysWithGames.length / 2));
    const secondHalf = daysWithGames.slice(Math.ceil(daysWithGames.length / 2));
    const firstAvg = firstHalf.reduce((s, d) => s + d.winRate, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, d) => s + d.winRate, 0) / secondHalf.length;
    if (secondAvg > firstAvg + 5) trend = "up";
    else if (secondAvg < firstAvg - 5) trend = "down";
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.78_0.16_80)]" />
            <CardTitle className="text-base">Win Rate This Week</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {trend === "up" && (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-500">Improving</span>
              </>
            )}
            {trend === "down" && (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                <span className="text-red-500">Declining</span>
              </>
            )}
            {trend === "flat" && (
              <>
                <Minus className="h-3.5 w-3.5" />
                <span>Steady</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={30}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload as DayStat & { day: string };
                  return (
                    <div className="rounded-lg bg-popover border border-border px-3 py-2 text-xs shadow-lg">
                      <p className="font-medium">{data.day}</p>
                      <p className="text-muted-foreground">
                        {data.wins}/{data.games} games ({data.winRate}%)
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="winRate"
                fill="oklch(0.75 0.18 165)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
