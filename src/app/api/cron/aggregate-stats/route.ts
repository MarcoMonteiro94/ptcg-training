import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { syncLogs } from "@/server/db/schema";
import { aggregateMatchupStats, generateMetaSnapshot } from "@/server/services/stats-aggregator";
import { generateAITierList } from "@/server/services/ai/tier-list-generator";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const syncId = randomUUID();

  await db.insert(syncLogs).values({
    id: syncId,
    source: "aggregation",
    status: "running",
    recordsProcessed: 0,
  });

  try {
    const matchupResult = await aggregateMatchupStats("standard");

    // Generate AI tier list before snapshot so tiers are fresh
    let tierListCount = 0;
    try {
      const tierResult = await generateAITierList("standard");
      tierListCount = tierResult.entries.length;
    } catch (err) {
      console.error("AI tier list generation failed, using existing tiers:", err);
    }

    const snapshotResult = await generateMetaSnapshot("standard");

    await db
      .update(syncLogs)
      .set({
        status: "completed",
        recordsProcessed: matchupResult.processed + snapshotResult.archetypes,
        completedAt: new Date(),
        metadata: {
          tierListGenerated: tierListCount > 0,
          tierListEntries: tierListCount,
        },
      })
      .where(eq(syncLogs.id, syncId));

    return NextResponse.json({
      status: "completed",
      matchups: matchupResult.processed,
      snapshot: snapshotResult.archetypes,
      tierList: tierListCount,
    });
  } catch (err) {
    await db
      .update(syncLogs)
      .set({
        status: "failed",
        errors: [{ message: err instanceof Error ? err.message : "Unknown error" }],
        completedAt: new Date(),
      })
      .where(eq(syncLogs.id, syncId));

    return NextResponse.json({ status: "failed", error: String(err) }, { status: 500 });
  }
}
