import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";

interface MatchupEntry {
  archetypeId: string;
  name: string;
  winRate: number;
  games: number;
}

interface MatchupInsightsProps {
  strongest: MatchupEntry[];
  weakest: MatchupEntry[];
}

function MatchupItem({ entry, variant }: { entry: MatchupEntry; variant: "strong" | "weak" }) {
  const imgUrl = getArchetypeImageUrl(entry.archetypeId);
  const color = variant === "strong"
    ? "text-[oklch(0.80_0.15_155)]"
    : "text-[oklch(0.80_0.15_25)]";

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {imgUrl ? (
        <Image src={imgUrl} alt="" width={24} height={24} className="h-6 w-6 object-contain shrink-0" unoptimized />
      ) : (
        <div className="h-6 w-6 rounded-full bg-muted/30 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.name}</p>
        <p className="text-[11px] font-mono text-muted-foreground">{entry.games} games</p>
      </div>
      <span className={`text-sm font-bold font-mono ${color}`}>
        {Math.round(entry.winRate * 100)}%
      </span>
    </div>
  );
}

export function MatchupInsights({ strongest, weakest }: MatchupInsightsProps) {
  const hasData = strongest.length > 0 || weakest.length > 0;

  if (!hasData) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_oklch(0.75_0.18_165/0.5)]" />
            <CardTitle className="text-sm font-semibold">Matchup Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <p className="text-sm text-muted-foreground text-center py-4">
            Play more games to see your strongest and weakest matchups.
            <br />
            <span className="text-xs text-muted-foreground/60">Minimum 3 games per matchup.</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_oklch(0.75_0.18_165/0.5)]" />
          <CardTitle className="text-sm font-semibold">Matchup Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Strongest */}
          <div>
            <p className="text-xs font-medium text-[oklch(0.80_0.15_155)] mb-2">Strongest</p>
            <div className="space-y-0.5">
              {strongest.map((entry) => (
                <MatchupItem key={entry.archetypeId} entry={entry} variant="strong" />
              ))}
            </div>
          </div>

          {/* Weakest */}
          <div>
            <p className="text-xs font-medium text-[oklch(0.80_0.15_25)] mb-2">Weakest</p>
            <div className="space-y-0.5">
              {weakest.map((entry) => (
                <MatchupItem key={entry.archetypeId} entry={entry} variant="weak" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
