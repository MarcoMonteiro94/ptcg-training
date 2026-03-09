import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getUserTournament } from "@/server/queries/tournaments";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { TournamentDetail } from "@/components/tournaments/tournament-detail";
import { TournamentRounds } from "@/components/tournaments/tournament-rounds";

export const metadata: Metadata = {
  title: "Tournament Detail",
  description: "View tournament rounds and results.",
};

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  let tournament: Awaited<ReturnType<typeof getUserTournament>> = null;
  let archetypeList: Array<{ id: string; name: string }> = [];
  let archetypeNames: Record<string, string> = {};

  try {
    const [t, archetypes] = await Promise.all([
      getUserTournament(user.id, id),
      getAllArchetypes(),
    ]);
    tournament = t;
    archetypeList = archetypes.map((a) => ({ id: a.id, name: a.name }));
    archetypeNames = Object.fromEntries(archetypes.map((a) => [a.id, a.name]));
  } catch {
    // DB not connected
  }

  if (!tournament) notFound();

  return (
    <div className="space-y-6">
      <TournamentDetail
        tournament={tournament}
        archetypeNames={archetypeNames}
        archetypes={archetypeList}
      />

      <div className="rounded-xl border border-border/30 glass-card p-3 sm:p-4">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
          Rounds
        </h3>
        <TournamentRounds
          tournament={tournament}
          archetypes={archetypeList}
          archetypeNames={archetypeNames}
        />
      </div>
    </div>
  );
}
