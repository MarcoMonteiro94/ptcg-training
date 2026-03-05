/**
 * Removes non-official tournaments (online/community) from the database.
 * Only keeps tournaments whose IDs are in the official-tournaments config.
 * Run: npm run tournament:cleanup
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { OFFICIAL_TOURNAMENTS } from "../src/server/config/official-tournaments";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  const officialIds = OFFICIAL_TOURNAMENTS.map((t) => t.limitlessId);

  console.log(`Official tournament IDs: ${officialIds.length}`);
  console.log("Checking for non-official tournaments in DB...\n");

  // Count tournaments to be removed
  const allTournaments = await db.execute<{ id: string; name: string }>(
    sql`SELECT id, name FROM tournaments`
  );

  const toRemove = allTournaments.filter(
    (t) => !officialIds.includes(t.id)
  );

  if (toRemove.length === 0) {
    console.log("No non-official tournaments found. Database is clean.");
    await client.end();
    return;
  }

  console.log(`Found ${toRemove.length} non-official tournaments to remove:`);
  for (const t of toRemove) {
    console.log(`  - ${t.id}: ${t.name}`);
  }

  const removeIds = toRemove.map((t) => t.id);

  // Delete standings first (FK constraint)
  const standingsResult = await db.execute(
    sql`DELETE FROM tournament_standings WHERE tournament_id = ANY(${removeIds})`
  );
  console.log(`\nDeleted ${standingsResult.count} standings`);

  // Delete matchup stats from these tournaments
  // Note: matchup_stats are aggregated, not per-tournament, so we skip those

  // Delete tournaments
  const tournamentsResult = await db.execute(
    sql`DELETE FROM tournaments WHERE id = ANY(${removeIds})`
  );
  console.log(`Deleted ${tournamentsResult.count} tournaments`);

  console.log("\nCleanup complete.");
  await client.end();
}

main().catch(console.error);
