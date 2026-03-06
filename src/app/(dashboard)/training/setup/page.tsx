import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveArchetypes } from "@/server/queries/archetypes";
import { getLatestCompletedPlan, getWeeklyProgress } from "@/server/queries/training";
import { TrainingSetupForm } from "@/components/training/setup-form";
import { BackButton } from "@/components/shared/back-button";

export default async function TrainingSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let archetypes: Awaited<ReturnType<typeof getActiveArchetypes>> = [];
  let previousPlan: {
    focusAreas: string[] | null;
    completionRate: number | null;
    difficulty: string | null;
  } | null = null;

  try {
    archetypes = await getActiveArchetypes();
    const latest = await getLatestCompletedPlan(user.id);
    if (latest) {
      const progress = await getWeeklyProgress(user.id, latest.id);
      previousPlan = {
        focusAreas: latest.focusAreas ?? latest.plan.focusAreas ?? null,
        completionRate: progress?.completionRate ?? null,
        difficulty: latest.difficulty ?? latest.plan.difficulty ?? null,
      };
    }
  } catch {
    // DB not connected
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <BackButton href="/training" label="Training" />
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Set Up Training Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your deck and weekly goals. AI will generate a personalized training plan.
        </p>
      </div>

      <TrainingSetupForm
        archetypes={archetypes.map((a) => ({ id: a.id, name: a.name, tier: a.tier }))}
        previousPlan={previousPlan}
      />
    </div>
  );
}
