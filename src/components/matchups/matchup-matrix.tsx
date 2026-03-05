"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Archetype {
  id: string;
  name: string;
  slug: string;
}

interface MatchupMatrixProps {
  archetypes: Archetype[];
  matrix: Record<string, Record<string, { winRate: number | null; totalGames: number }>>;
}

function getCellColor(winRate: number | null, totalGames: number): string {
  if (winRate === null || totalGames < 10) return "bg-muted/30 text-muted-foreground/50";
  if (winRate >= 0.6) return "bg-[oklch(0.72_0.19_155/0.35)] text-[oklch(0.85_0.15_155)]";
  if (winRate >= 0.55) return "bg-[oklch(0.72_0.19_155/0.20)] text-[oklch(0.80_0.12_155)]";
  if (winRate >= 0.5) return "bg-[oklch(0.72_0.19_155/0.08)] text-foreground/70";
  if (winRate >= 0.45) return "bg-[oklch(0.65_0.22_25/0.08)] text-foreground/70";
  if (winRate >= 0.4) return "bg-[oklch(0.65_0.22_25/0.20)] text-[oklch(0.80_0.15_25)]";
  return "bg-[oklch(0.65_0.22_25/0.35)] text-[oklch(0.85_0.15_25)]";
}

function formatWinRate(winRate: number | null, totalGames: number): string {
  if (winRate === null || totalGames < 10) return "-";
  return `${Math.round(winRate * 100)}`;
}

export function MatchupMatrix({ archetypes, matrix }: MatchupMatrixProps) {
  if (archetypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <span className="text-muted-foreground text-lg font-mono">#</span>
        </div>
        <p className="text-muted-foreground text-sm">No matchup data available.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <table className="border-collapse text-xs w-max">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card p-2 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground min-w-[130px]">
                vs
              </th>
              {archetypes.map((arch) => (
                <th
                  key={arch.id}
                  className="p-1 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground min-w-[52px] max-w-[70px]"
                >
                  <span className="block truncate" title={arch.name}>
                    {arch.name.length > 8
                      ? arch.name.slice(0, 7) + "."
                      : arch.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {archetypes.map((rowArch) => (
              <tr key={rowArch.id} className="group">
                <td className="sticky left-0 z-10 bg-card p-2 font-medium text-sm border-r border-border/30 group-hover:bg-muted/30 transition-colors">
                  <Link
                    href={`/matchups/${rowArch.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {rowArch.name}
                  </Link>
                </td>
                {archetypes.map((colArch) => {
                  if (rowArch.id === colArch.id) {
                    return (
                      <td key={colArch.id} className="p-0">
                        <div className="flex items-center justify-center h-8 w-full bg-border/10 text-muted-foreground/30 font-mono text-[10px]">
                          -
                        </div>
                      </td>
                    );
                  }
                  const cell = matrix[rowArch.id]?.[colArch.id];
                  const winRate = cell?.winRate ?? null;
                  const totalGames = cell?.totalGames ?? 0;

                  return (
                    <td key={colArch.id} className="p-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/matchups/${rowArch.slug}?vs=${colArch.slug}`}
                            className={cn(
                              "flex items-center justify-center h-8 w-full text-xs font-mono font-medium transition-all hover:brightness-125",
                              getCellColor(winRate, totalGames)
                            )}
                          >
                            {formatWinRate(winRate, totalGames)}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover border-border">
                          <p className="font-medium text-xs">
                            {rowArch.name} vs {colArch.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {winRate !== null
                              ? `${Math.round(winRate * 100)}% win rate`
                              : "Insufficient data"}
                            {" / "}
                            {totalGames} games
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
