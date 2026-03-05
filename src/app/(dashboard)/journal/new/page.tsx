import { MatchLogForm } from "@/components/journal/match-log-form";
import { LogPasteForm } from "@/components/journal/log-paste-form";
import { NewMatchLogTabs } from "./tabs";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/shared/back-button";

export default async function NewMatchLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let archetypes: Awaited<ReturnType<typeof getAllArchetypes>> = [];
  try {
    archetypes = await getAllArchetypes();
  } catch {
    // DB not connected
  }

  const archetypeList = archetypes.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton href="/journal" label="Journal" />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Log Match</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record a new match result
        </p>
      </div>

      <NewMatchLogTabs
        manualForm={<MatchLogForm archetypes={archetypeList} />}
        logPasteForm={<LogPasteForm archetypes={archetypeList} />}
      />
    </div>
  );
}
