import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserTournaments } from "@/server/queries/tournaments";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { Plus, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Track your Pokemon TCG tournament results and performance.",
};

export default async function TournamentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let tournaments: Awaited<ReturnType<typeof getUserTournaments>> = [];
  let archetypeNames: Record<string, string> = {};

  try {
    const [t, archetypes] = await Promise.all([
      getUserTournaments(user.id),
      getAllArchetypes(),
    ]);
    tournaments = t;
    archetypeNames = Object.fromEntries(archetypes.map((a) => [a.id, a.name]));
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
            Track your tournament results and performance
          </p>
        </div>
        <Link href="/tournaments/new">
          <Button
            size="sm"
            className="holo-gradient text-background text-xs h-8 shadow-[0_0_10px_oklch(0.75_0.18_165/0.15)]"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Tournament</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border/30 glass-card p-3 sm:p-4">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
          Tournament History
        </h3>

        {tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No tournaments yet.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Create a tournament to start tracking your competitive results.
            </p>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                archetypeNames={archetypeNames}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
