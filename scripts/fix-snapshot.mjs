import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { randomUUID } from "crypto";

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL.replace(":5432/", ":6543/");
const sql = postgres(dbUrl);

async function fix() {
  await sql`DELETE FROM meta_snapshots`;
  console.log("Deleted all snapshots");

  const archWinRates = await sql`
    WITH stats AS (
      SELECT
        a.id, a.name, a.tier,
        COALESCE(SUM(CASE WHEN ms.archetype_a_id = a.id THEN ms.wins ELSE ms.losses END), 0) as total_wins,
        COALESCE(SUM(ms.total_games), 0) as total_games
      FROM archetypes a
      LEFT JOIN matchup_stats ms ON (ms.archetype_a_id = a.id OR ms.archetype_b_id = a.id) AND ms.format = 'standard'
      WHERE a.is_active = true AND a.format = 'standard'
      GROUP BY a.id, a.name, a.tier
    )
    SELECT id, name, tier,
      CASE WHEN total_games > 0 THEN total_wins::float / total_games ELSE 0 END as win_rate
    FROM stats
  `;

  const usageMap = {
    "dragapult-dusknoir": 0.1937,
    "gardevoir-ex-sv": 0.1693,
    "gholdengo-lunatone": 0.1494,
    "charizard-noctowl": 0.1119,
    "mega-absol-box": 0.0800,
    "grimmsnarl-froslass": 0.0714,
    "raging-bolt-ogerpon": 0.0540,
    "n-zoroark": 0.0257,
    "charizard-pidgeot": 0.0200,
    "gardevoir-jellicent": 0.0180,
    "dragapult-charizard": 0.0160,
    "alakazam-dudunsparce": 0.0148,
    "joltik-box": 0.0130,
    "ceruledge-ex": 0.0120,
    "crustle-dri": 0.0110,
    "flareon-noctowl": 0.0100,
    "kangaskhan-bouffalant": 0.0090,
    "tera-box": 0.0080,
    "froslass-munkidori": 0.0070,
  };

  const snapshotData = archWinRates.map((a) => ({
    archetype_id: a.id,
    usage_rate: usageMap[a.id] || 0.005,
    win_rate: Math.round(Number(a.win_rate) * 1000) / 1000,
    tier: a.tier || "C",
  }));

  await sql`
    INSERT INTO meta_snapshots (id, date, format, data)
    VALUES (${randomUUID()}, now(), 'standard', ${JSON.stringify(snapshotData)}::jsonb)
  `;

  console.log("Inserted clean snapshot with", snapshotData.length, "archetypes");
  snapshotData.sort((a, b) => b.usage_rate - a.usage_rate);
  for (const d of snapshotData) {
    console.log(`  ${d.archetype_id}: ${(d.usage_rate * 100).toFixed(1)}% usage, ${(d.win_rate * 100).toFixed(1)}% WR, tier ${d.tier}`);
  }

  await sql.end();
}
fix();
