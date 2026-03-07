import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierList } from "@/components/meta/tier-list";
import { MetaBreakdown } from "@/components/meta/meta-breakdown";
import { getMetaStats, getLatestMetaSnapshot } from "@/server/queries/meta";

export const metadata: Metadata = {
  title: "Meta Dashboard",
  description: "Standard format tier list, usage rates, and win rates from official Pokemon TCG tournaments.",
};

export const revalidate = 3600;

export default async function MetaDashboardPage() {
  const format = "standard" as const;

  let archetypeStats: Awaited<ReturnType<typeof getMetaStats>> = [];
  let snapshotData: Array<{
    archetypeId: string;
    name: string;
    usageRate: number;
    winRate: number;
    tier: string;
    metaScore: number;
  }> = [];

  try {
    archetypeStats = await getMetaStats(format);
    const snapshot = await getLatestMetaSnapshot(format);
    if (snapshot?.data) {
      snapshotData = (snapshot.data as Array<{
        archetype_id: string;
        usage_rate: number;
        win_rate: number;
        tier: string;
        meta_score?: number;
      }>).map((d) => {
        const arch = archetypeStats.find((a) => a.id === d.archetype_id);
        return {
          archetypeId: d.archetype_id,
          name: arch?.name || d.archetype_id,
          usageRate: d.usage_rate,
          winRate: arch?.winRate ?? d.win_rate,
          tier: arch?.tier || d.tier,
          metaScore: d.meta_score ?? d.usage_rate * 100,
        };
      });
    }
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Meta Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
          Standard format competitive analysis and tier rankings
        </p>
      </div>

      {/* Tier List */}
      <Card className="glass-card">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_oklch(0.75_0.18_165/0.5)]" />
            <CardTitle className="text-sm font-semibold">Tier List</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <TierList
            archetypes={archetypeStats.map((a) => ({
              ...a,
              slug: a.slug,
              justification: a.description,
            }))}
          />
        </CardContent>
      </Card>

      {/* Meta Breakdown */}
      <Card className="glass-card">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.75_0.18_165)] shadow-[0_0_6px_oklch(0.75_0.18_165/0.5)]" />
            <CardTitle className="text-sm font-semibold">Meta Breakdown</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <MetaBreakdown data={snapshotData} />
        </CardContent>
      </Card>
    </div>
  );
}
