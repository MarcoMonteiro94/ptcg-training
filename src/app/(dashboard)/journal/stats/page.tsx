import Image from "next/image";
import { getUserMatchStats, getUserDecks } from "@/server/queries/journal";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { Target, TrendingUp, TrendingDown, Hash } from "lucide-react";
import { DeckFilter } from "@/components/journal/deck-filter";
import { BackButton } from "@/components/shared/back-button";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";

export default async function JournalStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { deck: deckFilter } = await searchParams;

  let stats: Awaited<ReturnType<typeof getUserMatchStats>> | null = null;
  let archetypeNames: Record<string, string> = {};
  let userDecks: Awaited<ReturnType<typeof getUserDecks>> = [];

  try {
    [stats, userDecks] = await Promise.all([
      getUserMatchStats(user.id, deckFilter || undefined),
      getUserDecks(user.id),
    ]);
    const archetypes = await getAllArchetypes();
    archetypeNames = Object.fromEntries(archetypes.map((a) => [a.id, a.name]));
  } catch {
    // DB not connected
  }

  const activeDeckName = deckFilter ? (archetypeNames[deckFilter] || deckFilter) : null;

  if (!stats || stats.total === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackButton href="/journal" label="Journal" />
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Personal Stats</h1>
            <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
              {activeDeckName
                ? `No matches logged with ${activeDeckName}.`
                : "Start logging matches to see your stats."}
            </p>
          </div>
          {userDecks.length > 0 && (
            <DeckFilter decks={userDecks} activeDeckId={deckFilter || null} />
          )}
        </div>
      </div>
    );
  }

  const matchupEntries = Object.entries(stats.byOpponent)
    .map(([id, data]) => ({
      id,
      name: archetypeNames[id] || id,
      ...data,
      total: data.wins + data.losses + data.draws,
      winRate: (data.wins + data.losses + data.draws) > 0
        ? data.wins / (data.wins + data.losses + data.draws)
        : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const statCards = [
    {
      label: "Overall",
      value: `${Math.round(stats.winRate * 100)}%`,
      sub: `${stats.wins}W - ${stats.losses}L - ${stats.draws}D`,
      icon: Target,
      accent: stats.winRate >= 0.5
        ? "text-[oklch(0.80_0.15_155)]"
        : "text-[oklch(0.80_0.15_25)]",
    },
    {
      label: "Going First",
      value: stats.goingFirst.total > 0
        ? `${Math.round(stats.goingFirst.winRate * 100)}%`
        : "-",
      sub: `${stats.goingFirst.wins}W / ${stats.goingFirst.total} games`,
      icon: TrendingUp,
      accent: "text-[oklch(0.80_0.15_155)]",
    },
    {
      label: "Going Second",
      value: stats.goingSecond.total > 0
        ? `${Math.round(stats.goingSecond.winRate * 100)}%`
        : "-",
      sub: `${stats.goingSecond.wins}W / ${stats.goingSecond.total} games`,
      icon: TrendingDown,
      accent: "text-[oklch(0.78_0.12_250)]",
    },
    {
      label: "Total Games",
      value: stats.total.toString(),
      sub: activeDeckName ? `With ${activeDeckName}` : "Matches logged",
      icon: Hash,
      accent: "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton href="/journal" label="Journal" />
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {activeDeckName ? activeDeckName : "Personal Stats"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
            {activeDeckName
              ? "Win rates and matchup spread for this deck"
              : "Your win rates, matchup spread, and performance trends"}
          </p>
        </div>
        {userDecks.length > 0 && (
          <DeckFilter decks={userDecks} activeDeckId={deckFilter || null} />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border/50 bg-card/30 p-4 glass-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={cn("h-3.5 w-3.5", card.accent)} />
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
            </div>
            <div className={cn("text-2xl font-bold font-mono", card.accent)}>
              {card.value}
            </div>
            <p className="text-[11px] font-mono text-muted-foreground/60 mt-0.5">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 p-4 glass-card">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
          Matchup Breakdown
        </h3>
        {matchupEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No matchup data yet.</p>
        ) : (
          <div className="space-y-1.5">
            {matchupEntries.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between border-b border-border/30 pb-1.5 last:border-0"
              >
                <div className="flex items-center gap-1.5 truncate mr-2">
                  {(() => {
                    const img = getArchetypeImageUrl(entry.id);
                    return img ? (
                      <Image src={img} alt="" width={20} height={20} className="h-5 w-5 shrink-0" unoptimized />
                    ) : null;
                  })()}
                  <span className="text-sm truncate">{entry.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "font-mono text-sm",
                      entry.winRate >= 0.55
                        ? "text-[oklch(0.80_0.15_155)]"
                        : entry.winRate < 0.45
                          ? "text-[oklch(0.80_0.15_25)]"
                          : "text-foreground/70"
                    )}
                  >
                    {Math.round(entry.winRate * 100)}%
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground/60">
                    {entry.wins}W-{entry.losses}L-{entry.draws}D
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
