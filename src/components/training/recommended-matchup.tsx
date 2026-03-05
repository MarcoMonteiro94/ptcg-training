import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import Link from "next/link";

interface RecommendedMatchupProps {
  matchup: {
    archetypeId: string;
    archetypeName: string;
    reason: string;
  };
}

export function RecommendedMatchup({ matchup }: RecommendedMatchupProps) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.70_0.20_15)]" />
          <CardTitle className="text-base">Recommended Matchup Today</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.70_0.20_15/0.15)]">
              <Swords className="h-5 w-5 text-[oklch(0.70_0.20_15)]" />
            </div>
            <div>
              <p className="font-medium text-sm">{matchup.archetypeName}</p>
              <p className="text-xs text-muted-foreground">{matchup.reason}</p>
            </div>
          </div>
          <Link href={`/coach`}>
            <Button variant="outline" size="sm">
              Study with Coach
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
