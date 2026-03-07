"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getArchetypeImages, getPokemonImageUrl } from "@/lib/pokemon-images";

interface MetaBreakdownProps {
  data: Array<{
    archetypeId: string;
    name: string;
    usageRate: number;
    winRate: number;
    tier: string;
    metaScore: number;
  }>;
}

const tierColor: Record<string, string> = {
  S: "bg-[oklch(0.70_0.20_15)]",
  A: "bg-[oklch(0.78_0.16_80)]",
  B: "bg-[oklch(0.75_0.18_165)]",
  C: "bg-[oklch(0.70_0.15_200)]",
  D: "bg-muted-foreground",
};

const tierTextColor: Record<string, string> = {
  S: "text-[oklch(0.70_0.20_15)]",
  A: "text-[oklch(0.78_0.16_80)]",
  B: "text-[oklch(0.75_0.18_165)]",
  C: "text-[oklch(0.70_0.15_200)]",
  D: "text-muted-foreground",
};

function getWinRateColor(wr: number): string {
  if (wr >= 0.52) return "text-[oklch(0.80_0.15_155)]";
  if (wr >= 0.48) return "text-foreground/60";
  if (wr >= 0.44) return "text-[oklch(0.80_0.12_60)]";
  return "text-[oklch(0.80_0.15_25)]";
}

export function MetaBreakdown({ data }: MetaBreakdownProps) {
  const sorted = [...data].sort((a, b) => b.metaScore - a.metaScore);
  const maxUsage = sorted[0]?.usageRate || 0.2;

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <span className="text-muted-foreground text-lg font-mono">%</span>
        </div>
        <p className="text-muted-foreground text-sm">No usage data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header — hidden on mobile, shown on sm+ */}
      <div className="hidden sm:flex items-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 px-1 pb-2">
        <span className="w-7 shrink-0">Tier</span>
        <span className="flex-1 pl-1">Archetype</span>
        <span className="w-12 text-right">Score</span>
        <span className="w-14 text-right">Usage</span>
        <span className="w-14 text-right">WR</span>
      </div>

      {sorted.map((entry, i) => {
        const barWidth = Math.max(4, (entry.usageRate / maxUsage) * 100);
        const barColor = tierColor[entry.tier] || tierColor.D;
        const textColor = tierTextColor[entry.tier] || tierTextColor.D;
        const wrColor = getWinRateColor(entry.winRate);

        return (
          <div
            key={entry.name}
            className="group relative flex items-center gap-1.5 sm:gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/20 transition-colors"
            style={{ animationDelay: `${i * 25}ms` }}
          >
            {/* Tier badge */}
            <span className={cn("w-7 shrink-0 text-[11px] font-mono font-bold text-center", textColor)}>
              {entry.tier}
            </span>

            {/* Name + usage bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {(() => {
                  const images = getArchetypeImages(entry.archetypeId);
                  const srcs = images.length > 0 ? images : [getPokemonImageUrl(entry.name)];
                  return srcs.slice(0, 2).map((src, idx) => (
                    <Image
                      key={idx}
                      src={src}
                      alt=""
                      width={20}
                      height={20}
                      className={cn("h-5 w-5 object-contain shrink-0", idx > 0 && "-ml-2")}
                      unoptimized
                    />
                  ));
                })()}
                <span className="text-[13px] font-medium truncate">
                  {entry.name}
                </span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-muted/20 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barColor)}
                  style={{ width: `${barWidth}%`, opacity: 0.6 }}
                />
              </div>
            </div>

            {/* Meta Score */}
            <span className="w-10 sm:w-12 text-right text-[11px] font-mono font-semibold text-foreground/80 tabular-nums">
              {Math.round(entry.metaScore)}
            </span>

            {/* Usage % */}
            <span className="w-12 sm:w-14 text-right text-[11px] font-mono text-muted-foreground/70 tabular-nums">
              {(entry.usageRate * 100).toFixed(1)}%
            </span>

            {/* Win Rate */}
            <span className={cn("w-12 sm:w-14 text-right text-[11px] font-mono font-medium tabular-nums", wrColor)}>
              {entry.winRate > 0 ? `${(entry.winRate * 100).toFixed(1)}%` : "—"}
            </span>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-border/20 mt-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-mono">
          <div className="h-1 w-3 rounded-full bg-[oklch(0.80_0.15_155)] opacity-70" />
          <span>&ge;52% WR</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-mono">
          <div className="h-1 w-3 rounded-full bg-foreground/20" />
          <span>48-52%</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-mono">
          <div className="h-1 w-3 rounded-full bg-[oklch(0.80_0.15_25)] opacity-70" />
          <span>&lt;44% WR</span>
        </div>
        <span className="text-[10px] text-muted-foreground/40 font-mono ml-auto">
          Score = WR 30% + Top Cut 30% + Usage 20% + Matchups 20%
        </span>
      </div>
    </div>
  );
}
