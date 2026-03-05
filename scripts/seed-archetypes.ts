/**
 * Seed script for current Standard meta archetypes (March 2026).
 * Based on Limitless TCG tournament data.
 *
 * Run: npx tsx scripts/seed-archetypes.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { archetypes } from "../src/server/db/schema/game-data";
import { STANDARD_ARCHETYPES } from "../src/server/services/seed-archetypes";

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(client);

async function seed() {
  console.log("Seeding archetypes...");

  for (const arch of STANDARD_ARCHETYPES) {
    await db
      .insert(archetypes)
      .values({
        ...arch,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: archetypes.id,
        set: {
          name: arch.name,
          slug: arch.slug,
          identifierCards: arch.identifierCards,
          tier: arch.tier,
          updatedAt: new Date(),
        },
      });
    console.log(`  + ${arch.name} (${arch.tier})`);
  }

  console.log(`\nSeeded ${STANDARD_ARCHETYPES.length} archetypes.`);
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  client.end();
  process.exit(1);
});
