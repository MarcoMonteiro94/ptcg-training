import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/journal/match-list";
import { getUserMatchLogs, getUserDecks } from "@/server/queries/journal";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BarChart3, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { DeckFilter } from "@/components/journal/deck-filter";
import { MatchTypeFilter, type MatchTypeFilter as MatchTypeFilterValue } from "@/components/journal/match-type-filter";
import { QuickLogDialog } from "@/components/journal/quick-log-dialog";
import { PageSizeSelector } from "@/components/journal/page-size-selector";

export const metadata: Metadata = {
  title: "Battle Journal",
  description: "Track your Pokemon TCG matches, analyze win rates, and identify patterns in your competitive play.",
};

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string; page?: string; type?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { deck: deckFilter, page: pageParam, type: typeParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1") || 1);
  const cookieStore = await cookies();
  const sizeCookie = Number(cookieStore.get("journal-page-size")?.value);
  const pageSize = [10, 20, 50].includes(sizeCookie) ? sizeCookie : 20;
  const matchType: MatchTypeFilterValue = ["tournament", "online"].includes(typeParam || "") ? (typeParam as MatchTypeFilterValue) : "all";

  let matchData: Awaited<ReturnType<typeof getUserMatchLogs>> = {
    matches: [],
    total: 0,
    page: 1,
    pageSize,
    totalPages: 0,
  };
  let archetypeNames: Record<string, string> = {};
  let userDecks: Awaited<ReturnType<typeof getUserDecks>> = [];
  let archetypeList: Array<{ id: string; name: string }> = [];

  try {
    [matchData, userDecks] = await Promise.all([
      getUserMatchLogs(user.id, currentPage, deckFilter, pageSize, matchType === "all" ? undefined : matchType),
      getUserDecks(user.id),
    ]);
    const archetypes = await getAllArchetypes();
    archetypeNames = Object.fromEntries(archetypes.map((a) => [a.id, a.name]));
    archetypeList = archetypes.map((a) => ({ id: a.id, name: a.name }));
  } catch {
    // DB not connected
  }

  function buildPageUrl(page: number) {
    const params = new URLSearchParams();
    if (deckFilter) params.set("deck", deckFilter);
    if (matchType !== "all") params.set("type", matchType);
    if (page > 1) params.set("page", page.toString());
    const qs = params.toString();
    return `/journal${qs ? `?${qs}` : ""}`;
  }

  const { matches, total, totalPages } = matchData;

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Battle Journal</h1>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
            Track your matches and analyze performance
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={deckFilter ? `/journal/stats?deck=${deckFilter}` : "/journal/stats"}>
            <Button variant="outline" size="sm" className="border-border/30 text-xs h-8">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Stats</span>
            </Button>
          </Link>
          <Link href="/journal/new">
            <Button variant="outline" size="sm" className="border-border/30 text-xs h-8">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Import Log</span>
            </Button>
          </Link>
          <QuickLogDialog archetypes={archetypeList} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MatchTypeFilter active={matchType} />
        {userDecks.length > 0 && (
          <DeckFilter decks={userDecks} activeDeckId={deckFilter || null} />
        )}
      </div>

      <div className="rounded-xl border border-border/30 glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">
            {deckFilter
              ? `Matches with ${archetypeNames[deckFilter] || "Selected Deck"}`
              : "Recent Matches"}
          </h3>
          {total > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground/40">
              {total} match{total !== 1 ? "es" : ""}
            </span>
          )}
        </div>
        <MatchList
          matches={matches}
          archetypeNames={archetypeNames}
          archetypes={Object.entries(archetypeNames).map(([id, name]) => ({ id, name }))}
        />

        {/* Pagination & page size */}
        {total > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
            {totalPages > 1 ? (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none" : ""}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/30 text-xs h-8"
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Prev
                </Button>
              </Link>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <PageSizeSelector currentSize={pageSize} />
              {totalPages > 1 && (
                <span className="text-xs font-mono text-muted-foreground/60">
                  {currentPage} / {totalPages}
                </span>
              )}
            </div>

            {totalPages > 1 ? (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none" : ""}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/30 text-xs h-8"
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
