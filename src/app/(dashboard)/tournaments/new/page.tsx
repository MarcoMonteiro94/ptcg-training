import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { NewTournamentForm } from "@/components/tournaments/new-tournament-form";

export const metadata: Metadata = {
  title: "New Tournament",
  description: "Create a new tournament report.",
};

export default async function NewTournamentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let archetypeList: Array<{ id: string; name: string }> = [];

  try {
    const archetypes = await getAllArchetypes();
    archetypeList = archetypes.map((a) => ({ id: a.id, name: a.name }));
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">New Tournament</h1>
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
          Create a tournament to start logging rounds
        </p>
      </div>

      <div className="rounded-xl border border-border/30 glass-card p-3 sm:p-4">
        <NewTournamentForm archetypes={archetypeList} />
      </div>
    </div>
  );
}
