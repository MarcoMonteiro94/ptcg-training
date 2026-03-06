import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchupImprovement {
  archetypeId: string;
  archetypeName: string;
  before: number;
  after: number;
  beforeGames: number;
  duringGames: number;
}

interface MatchupImprovementCardProps {
  improvements: MatchupImprovement[];
}

export function MatchupImprovementCard({ improvements }: MatchupImprovementCardProps) {
  if (improvements.length === 0) return null;

  const hasAnyGames = improvements.some((m) => m.beforeGames > 0 || m.duringGames > 0);
  if (!hasAnyGames) return null;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.75_0.15_250)]" />
          <CardTitle className="text-base">Matchup Progress</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {improvements.map((matchup) => {
            const delta = matchup.after - matchup.before;
            const hasData = matchup.beforeGames > 0 || matchup.duringGames > 0;

            return (
              <div
                key={matchup.archetypeId}
                className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{matchup.archetypeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {matchup.beforeGames}g before / {matchup.duringGames}g during
                  </p>
                </div>
                {hasData ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {matchup.before}%
                    </span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span
                      className={cn(
                        "text-sm font-bold font-mono",
                        delta > 0 && "text-green-500",
                        delta < 0 && "text-red-500",
                        delta === 0 && "text-muted-foreground"
                      )}
                    >
                      {matchup.after}%
                    </span>
                    {delta > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    ) : delta < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No data</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
