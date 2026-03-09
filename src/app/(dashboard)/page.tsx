import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchList } from "@/components/journal/match-list";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { TrainingSummary } from "@/components/dashboard/training-summary";
import { MatchupInsights } from "@/components/dashboard/matchup-insights";
import { QuickLogDialog } from "@/components/journal/quick-log-dialog";
import { getUserMatchStats, getUserMatchLogs } from "@/server/queries/journal";
import { getActiveTrainingPlan, getWeeklyProgress, getTrainingStreak } from "@/server/queries/training";
import { getAllArchetypes } from "@/server/queries/archetypes";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal Pokemon TCG training dashboard.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [stats, matchData, activePlan, streak, archetypes] = await Promise.all([
    getUserMatchStats(user.id),
    getUserMatchLogs(user.id, 1, undefined, 50),
    getActiveTrainingPlan(user.id),
    getTrainingStreak(user.id),
    getAllArchetypes(),
  ]);

  // Weekly progress (only if active plan)
  const weeklyProgress = activePlan
    ? await getWeeklyProgress(user.id, activePlan.id)
    : null;

  // Derived: weekly win rate (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyMatches = matchData.matches.filter(
    (m) => new Date(m.playedAt) >= sevenDaysAgo
  );
  const weeklyWins = weeklyMatches.filter((m) => m.result === "win").length;
  const weeklyWinRate = weeklyMatches.length > 0 ? weeklyWins / weeklyMatches.length : 0;

  // Derived: current W/L streak
  const sortedMatches = [...matchData.matches].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );
  let streakCount = 0;
  let streakType: "W" | "L" | "" = "";
  for (const m of sortedMatches) {
    if (m.result === "draw") continue;
    const type = m.result === "win" ? "W" : "L";
    if (!streakType) streakType = type;
    if (type !== streakType) break;
    streakCount++;
  }
  const streakDisplay = streakCount > 0 ? `${streakCount}${streakType}` : "";

  // Derived: best/worst matchups (min 3 games)
  const archetypeMap = Object.fromEntries(archetypes.map((a) => [a.id, a.name]));
  const matchupEntries = Object.entries(stats.byOpponent)
    .map(([id, data]) => {
      const total = data.wins + data.losses + data.draws;
      return {
        archetypeId: id,
        name: archetypeMap[id] || id,
        winRate: total > 0 ? data.wins / total : 0,
        games: total,
      };
    })
    .filter((e) => e.games >= 3 && e.archetypeId !== "unknown");

  const strongest = [...matchupEntries]
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);
  const weakest = [...matchupEntries]
    .sort((a, b) => a.winRate - b.winRate)
    .slice(0, 3);

  // Recent matches (top 5)
  const recentMatches = matchData.matches.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
            Your personal training overview
          </p>
        </div>
        <QuickLogDialog archetypes={archetypes} />
      </div>

      {/* Quick Stats */}
      <QuickStats
        winRate={stats.winRate}
        totalGames={stats.total}
        streak={streakDisplay}
        weeklyWinRate={weeklyWinRate}
      />

      {/* Training Summary */}
      <TrainingSummary
        activePlan={activePlan}
        weeklyProgress={weeklyProgress}
        streak={streak}
      />

      {/* Recent Matches */}
      <Card className="glass-card">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_oklch(0.75_0.18_165/0.5)]" />
              <CardTitle className="text-sm font-semibold">Recent Matches</CardTitle>
            </div>
            <Link
              href="/journal"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View All →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <MatchList
            matches={recentMatches}
            archetypeNames={archetypeMap}
            archetypes={archetypes}
          />
        </CardContent>
      </Card>

      {/* Matchup Insights */}
      <MatchupInsights strongest={strongest} weakest={weakest} />
    </div>
  );
}
