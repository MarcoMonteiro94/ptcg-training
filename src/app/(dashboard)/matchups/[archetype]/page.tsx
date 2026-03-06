import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { getArchetypeBySlug } from "@/server/queries/archetypes";
import { getMatchupsForArchetype } from "@/server/queries/matchups";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/shared/back-button";
import { getArchetypeImages, getPokemonImageUrl } from "@/lib/pokemon-images";

export const revalidate = 3600;

function getWinRateColor(winRate: number) {
  if (winRate >= 0.6) return "text-[oklch(0.80_0.15_155)]";
  if (winRate >= 0.55) return "text-[oklch(0.78_0.12_155)]";
  if (winRate >= 0.5) return "text-foreground/70";
  if (winRate >= 0.45) return "text-foreground/70";
  if (winRate >= 0.4) return "text-[oklch(0.78_0.12_25)]";
  return "text-[oklch(0.80_0.15_25)]";
}

function getWinRateBadge(winRate: number) {
  if (winRate >= 0.55) return { bg: "bg-[oklch(0.72_0.19_155/0.15)]", text: "text-[oklch(0.80_0.15_155)]", border: "border-[oklch(0.72_0.19_155/0.25)]" };
  if (winRate >= 0.45) return { bg: "bg-[oklch(0.78_0.16_80/0.15)]", text: "text-[oklch(0.85_0.12_80)]", border: "border-[oklch(0.78_0.16_80/0.25)]" };
  return { bg: "bg-[oklch(0.65_0.22_25/0.15)]", text: "text-[oklch(0.80_0.15_25)]", border: "border-[oklch(0.65_0.22_25/0.25)]" };
}

export default async function MatchupDetailPage({
  params,
}: {
  params: Promise<{ archetype: string }>;
}) {
  const { archetype: slug } = await params;

  let archetype: Awaited<ReturnType<typeof getArchetypeBySlug>> | null = null;

  try {
    archetype = await getArchetypeBySlug(slug);
  } catch {
    // DB not connected
  }

  if (!archetype) {
    notFound();
  }

  let matchups: Awaited<ReturnType<typeof getMatchupsForArchetype>> = [];

  try {
    matchups = await getMatchupsForArchetype(archetype.id);
  } catch {
    // Partial failure ok
  }

  const favorable = matchups.filter((m) => m.winRate !== null && m.winRate >= 0.55 && m.totalGames >= 10);
  const unfavorable = matchups.filter((m) => m.winRate !== null && m.winRate < 0.45 && m.totalGames >= 10);
  const even = matchups.filter(
    (m) => m.winRate !== null && m.winRate >= 0.45 && m.winRate < 0.55 && m.totalGames >= 10
  );

  const sections = [
    {
      title: "Favorable",
      count: favorable.length,
      items: favorable.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)),
      accent: { label: "text-[oklch(0.80_0.15_155)]", border: "border-[oklch(0.72_0.19_155/0.25)]" },
    },
    {
      title: "Even",
      count: even.length,
      items: even,
      accent: { label: "text-[oklch(0.85_0.12_80)]", border: "border-[oklch(0.78_0.16_80/0.25)]" },
    },
    {
      title: "Unfavorable",
      count: unfavorable.length,
      items: unfavorable.sort((a, b) => (a.winRate ?? 0) - (b.winRate ?? 0)),
      accent: { label: "text-[oklch(0.80_0.15_25)]", border: "border-[oklch(0.65_0.22_25/0.25)]" },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton href="/matchups" label="Matchups" />
      <div className="flex items-center gap-3">
        {(() => {
          const imgs = getArchetypeImages(archetype.slug);
          return imgs.length > 0 ? (
            <div className="flex -space-x-2">
              {imgs.slice(0, 2).map((url, i) => (
                <Image key={i} src={url} alt="" width={40} height={40} className="h-10 w-10 drop-shadow-md" unoptimized />
              ))}
            </div>
          ) : null;
        })()}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{archetype.name} Matchups</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed matchup breakdown and trends
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 stagger-children">
        {sections.map((section) => (
          <div
            key={section.title}
            className={cn(
              "rounded-xl border bg-card/30 p-4",
              section.accent.border
            )}
          >
            <h3 className={cn("text-xs font-mono uppercase tracking-wider mb-3", section.accent.label)}>
              {section.title} ({section.count})
            </h3>
            {section.items.length === 0 ? (
              <p className="text-muted-foreground/60 text-xs">No data</p>
            ) : (
              <div className="space-y-1.5">
                {section.items.map((m) => {
                  const badge = getWinRateBadge(m.winRate ?? 0);
                  return (
                    <div key={m.opponentId} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1.5 truncate mr-2">
                        <Image src={getPokemonImageUrl(m.opponentName)} alt="" width={20} height={20} className="h-5 w-5 shrink-0" unoptimized />
                        <span className="truncate">{m.opponentName}</span>
                      </div>
                      <Badge
                        className={cn(
                          "font-mono text-[10px] px-1.5 py-0 border-0 shrink-0",
                          badge.bg,
                          badge.text
                        )}
                      >
                        {Math.round((m.winRate ?? 0) * 100)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 p-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          All Matchups
        </h3>
        {matchups.length === 0 ? (
          <p className="text-muted-foreground text-sm">No matchup data available.</p>
        ) : (
          <div className="space-y-1">
            {matchups
              .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
              .map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center text-sm border-b border-border/30 pb-1.5 last:border-0"
                >
                  <div className="flex items-center gap-1.5">
                    <Image src={getPokemonImageUrl(m.opponentName)} alt="" width={20} height={20} className="h-5 w-5 shrink-0" unoptimized />
                    <span>vs {m.opponentName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("font-mono", m.winRate !== null ? getWinRateColor(m.winRate) : "text-muted-foreground")}>
                      {m.winRate !== null ? `${Math.round(m.winRate * 100)}%` : "-"}
                    </span>
                    <span className="text-xs text-muted-foreground/60 font-mono">
                      {m.totalGames}g
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
