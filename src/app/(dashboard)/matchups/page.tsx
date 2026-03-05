import { MatchupMatrix } from "@/components/matchups/matchup-matrix";
import { getMatchupMatrix } from "@/server/queries/matchups";

export const revalidate = 3600;

export default async function MatchupsPage() {
  const format = "standard" as const;

  let archetypes: Awaited<ReturnType<typeof getMatchupMatrix>>["archetypes"] = [];
  let matrix: Awaited<ReturnType<typeof getMatchupMatrix>>["matrix"] = {};

  try {
    const data = await getMatchupMatrix(format);
    archetypes = data.archetypes;
    matrix = data.matrix;
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Matchup Matrix</h1>
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
          Win rates between archetype pairs based on tournament data
        </p>
      </div>

      <div className="rounded-xl border border-border/30 glass-card p-3 sm:p-4 overflow-x-auto">
        <MatchupMatrix
          archetypes={archetypes.map((a) => ({
            id: a.id,
            name: a.name,
            slug: a.slug,
          }))}
          matrix={matrix}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2.5 text-[10px] font-mono text-muted-foreground/50">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.75_0.18_165/0.35)]" />
          <span>&gt;60%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.75_0.18_165/0.20)]" />
          <span>55-60%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.75_0.18_165/0.08)]" />
          <span>50-55%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.65_0.22_25/0.08)]" />
          <span>45-50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.65_0.22_25/0.20)]" />
          <span>40-45%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.65_0.22_25/0.35)]" />
          <span>&lt;40%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-muted/30" />
          <span>&lt;10 games</span>
        </div>
      </div>
    </div>
  );
}
