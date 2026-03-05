import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MatchList } from "@/components/journal/match-list";
import { getUserMatchLogs, getUserDecks } from "@/server/queries/journal";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus, BarChart3 } from "lucide-react";
import { DeckFilter } from "@/components/journal/deck-filter";

export default async function JournalPage({
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

  let matches: Awaited<ReturnType<typeof getUserMatchLogs>> = [];
  let archetypeNames: Record<string, string> = {};
  let userDecks: Awaited<ReturnType<typeof getUserDecks>> = [];

  try {
    [matches, userDecks] = await Promise.all([
      getUserMatchLogs(user.id),
      getUserDecks(user.id),
    ]);
    const archetypes = await getAllArchetypes();
    archetypeNames = Object.fromEntries(archetypes.map((a) => [a.id, a.name]));
  } catch {
    // DB not connected
  }

  // Filter matches client-side since we already have them all
  const filteredMatches = deckFilter
    ? matches.filter((m) => m.userArchetypeId === deckFilter)
    : matches;

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
            <Button size="sm" className="holo-gradient text-background text-xs h-8 shadow-[0_0_10px_oklch(0.75_0.18_165/0.15)]">
              <Plus className="mr-1 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Match</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {userDecks.length > 0 && (
        <DeckFilter decks={userDecks} activeDeckId={deckFilter || null} />
      )}

      <div className="rounded-xl border border-border/30 glass-card p-4">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
          {deckFilter
            ? `Matches with ${archetypeNames[deckFilter] || "Selected Deck"}`
            : "Recent Matches"}
        </h3>
        <MatchList
          matches={filteredMatches}
          archetypeNames={archetypeNames}
          archetypes={Object.entries(archetypeNames).map(([id, name]) => ({ id, name }))}
        />
      </div>
    </div>
  );
}
