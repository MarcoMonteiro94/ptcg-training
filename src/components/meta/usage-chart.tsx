"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface UsageChartProps {
  data: Array<{
    name: string;
    usageRate: number;
    winRate: number;
  }>;
}

export function UsageChart({ data }: UsageChartProps) {
  const chartData = data
    .sort((a, b) => b.usageRate - a.usageRate)
    .map((d) => ({
      name: d.name.length > 14 ? d.name.slice(0, 11) + "..." : d.name,
      "Usage %": Math.round(d.usageRate * 1000) / 10,
      "Win %": Math.round(d.winRate * 1000) / 10,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <span className="text-muted-foreground text-lg font-mono">%</span>
        </div>
        <p className="text-muted-foreground text-sm">No usage data available yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(0.25 0.015 260)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={11}
          tick={{ fill: "oklch(0.60 0.02 260)" }}
          axisLine={{ stroke: "oklch(0.25 0.015 260)" }}
          tickLine={false}
        />
        <YAxis
          unit="%"
          fontSize={11}
          tick={{ fill: "oklch(0.60 0.02 260)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.15 0.012 260)",
            border: "1px solid oklch(0.25 0.015 260)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "oklch(0.95 0.01 260)", fontWeight: 600 }}
          itemStyle={{ color: "oklch(0.80 0.01 260)" }}
        />
        <Bar dataKey="Usage %" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={`oklch(0.72 0.19 155 / ${0.4 + (chartData.length - i) * (0.6 / chartData.length)})`}
            />
          ))}
        </Bar>
        <Bar
          dataKey="Win %"
          radius={[4, 4, 0, 0]}
          fill="oklch(0.70 0.15 200 / 0.5)"
          maxBarSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
