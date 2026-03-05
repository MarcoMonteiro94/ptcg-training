/**
 * Seeds sample decklists for each major archetype.
 * Source: Limitless TCG top-placing tournament lists.
 *
 * Run: node scripts/seed-decklists.mjs
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { randomUUID } from "crypto";

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL.replace(":5432/", ":6543/");
const sql = postgres(dbUrl);

// Helper: convert "count CardName" to { card_id, count }
function parseCards(lines) {
  return lines
    .filter((l) => l.trim())
    .map((l) => {
      const match = l.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return { card_id: match[2].trim(), count: parseInt(match[1]) };
    })
    .filter(Boolean);
}

const DECKLISTS = [
  {
    archetypeId: "dragapult-dusknoir",
    tournamentId: "regional-seattle-2026",
    playerName: "Andrew Hedrick",
    placing: 9,
    cards: parseCards([
      "4 Dreepy", "4 Drakloak", "3 Dragapult ex",
      "2 Duskull", "2 Dusclops", "1 Dusknoir",
      "2 Budew", "1 Bloodmoon Ursaluna ex", "1 Munkidori",
      "1 Hawlucha", "1 Fezandipiti ex", "1 Latias ex",
      "4 Iono", "4 Lillie's Determination", "3 Boss's Orders",
      "1 Hilda", "1 Professor's Research",
      "4 Buddy-Buddy Poffin", "4 Ultra Ball", "3 Counter Catcher",
      "3 Night Stretcher", "1 Nest Ball", "2 Jamming Tower",
      "3 Luminous Energy", "2 Psychic Energy", "1 Neo Upper Energy", "1 Fire Energy",
    ]),
  },
  {
    archetypeId: "gardevoir-ex-sv",
    tournamentId: "euic-2026",
    playerName: "Makani Tran",
    placing: 5,
    cards: parseCards([
      "3 Ralts", "2 Kirlia", "2 Gardevoir ex",
      "3 Munkidori", "1 Scream Tail", "1 Frillish",
      "1 Mew ex", "1 Lillie's Clefairy ex", "1 Fezandipiti ex",
      "4 Iono", "4 Lillie's Determination", "2 Arven",
      "1 Professor Turo's Scenario",
      "4 Ultra Ball", "3 Earthen Vessel", "2 Nest Ball",
      "2 Rare Candy", "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box",
      "2 Technical Machine: Evolution", "1 Bravery Charm",
      "1 Luxurious Cape", "2 Artazon",
      "8 Psychic Energy", "3 Darkness Energy",
    ]),
  },
  {
    archetypeId: "gholdengo-lunatone",
    tournamentId: "euic-2026",
    playerName: "Drew Stephenson",
    placing: 2,
    cards: parseCards([
      "4 Gimmighoul", "4 Gholdengo ex", "2 Solrock", "2 Lunatone",
      "1 Genesect ex", "1 Fezandipiti ex", "1 Mega Mawile ex", "1 Hop's Cramorant",
      "4 Arven", "4 Boss's Orders", "2 Professor Turo's Scenario",
      "4 Superior Energy Retrieval", "4 Nest Ball",
      "3 Earthen Vessel", "3 Fighting Gong",
      "2 Buddy-Buddy Poffin", "1 Secret Box", "1 Super Rod",
      "2 Air Balloon", "1 Vitality Band", "1 Bravery Charm", "1 Artazon",
      "7 Fighting Energy", "4 Metal Energy",
    ]),
  },
  {
    archetypeId: "charizard-noctowl",
    tournamentId: "regional-seattle-2026",
    playerName: "Truwin Tran",
    placing: 1,
    cards: parseCards([
      "3 Hoothoot", "3 Noctowl", "2 Charmander", "1 Charmander",
      "1 Charmeleon", "2 Charizard ex",
      "2 Duskull", "1 Dusclops", "1 Dusknoir",
      "1 Pidgey", "1 Pidgey", "1 Pidgeotto", "2 Pidgeot ex",
      "2 Fan Rotom", "2 Terapagos ex", "1 Klefki", "1 Fezandipiti ex",
      "4 Dawn", "2 Boss's Orders", "1 Iono", "1 Briar",
      "4 Nest Ball", "4 Rare Candy", "4 Buddy-Buddy Poffin",
      "1 Ultra Ball", "1 Super Rod", "1 Night Stretcher", "1 Prime Catcher",
      "2 Area Zero Underdepths",
      "5 Fire Energy", "2 Jet Energy",
    ]),
  },
  {
    archetypeId: "mega-absol-box",
    tournamentId: "regional-seattle-2026",
    playerName: "Grant Shen",
    placing: 2,
    cards: parseCards([
      "2 Yveltal", "2 Munkidori", "2 Mega Kangaskhan ex", "2 Mega Absol ex",
      "1 Genesect", "1 Psyduck", "1 Fezandipiti ex", "1 Pecharunt ex",
      "1 Latias ex", "1 Bloodmoon Ursaluna ex",
      "4 Boss's Orders", "4 Arven", "3 Penny",
      "2 Erika's Invitation", "2 Iono", "2 Ciphermaniac's Codebreaking",
      "1 Lillie's Determination",
      "3 Pokegear 3.0", "3 Night Stretcher", "2 Counter Catcher",
      "2 Nest Ball", "1 Precious Trolley", "1 Energy Switch",
      "1 Earthen Vessel", "2 Technical Machine: Turbo Energize",
      "2 Bravery Charm", "1 Town Store", "1 Team Rocket's Watchtower",
      "7 Darkness Energy", "2 Mist Energy",
    ]),
  },
  {
    archetypeId: "grimmsnarl-froslass",
    tournamentId: "regional-seattle-2026",
    playerName: "Zach Cohen",
    placing: 11,
    cards: parseCards([
      "4 Munkidori", "3 Marnie's Impidimp", "2 Marnie's Morgrem",
      "2 Marnie's Grimmsnarl ex", "3 Snorunt", "2 Froslass",
      "1 Shaymin", "1 Bloodmoon Ursaluna ex", "1 Budew",
      "4 Lillie's Determination", "4 Arven", "3 Iono", "3 Boss's Orders",
      "3 Night Stretcher", "2 Buddy-Buddy Poffin",
      "1 Nest Ball", "1 Ultra Ball", "1 Rare Candy",
      "1 Secret Box", "1 Counter Catcher",
      "2 Technical Machine: Evolution", "1 Technical Machine: Devolution",
      "1 Air Balloon", "3 Spikemuth Gym", "1 Artazon",
      "9 Darkness Energy",
    ]),
  },
  {
    archetypeId: "raging-bolt-ogerpon",
    tournamentId: "regional-seattle-2026",
    playerName: "David Andrews",
    placing: 6,
    cards: parseCards([
      "3 Hoothoot", "3 Noctowl", "3 Teal Mask Ogerpon ex",
      "2 Raging Bolt", "2 Raging Bolt ex", "2 Fan Rotom",
      "1 Latias ex", "1 Fezandipiti ex", "1 Iron Leaves ex",
      "1 Mew ex", "1 Slither Wing", "1 Squawkabilly ex", "1 Ditto",
      "4 Professor Sada's Vitality", "2 Crispin",
      "1 Boss's Orders", "1 Professor Turo's Scenario", "1 Judge",
      "4 Nest Ball", "3 Ultra Ball", "3 Earthen Vessel",
      "2 Night Stretcher", "1 Energy Switch", "1 Energy Retrieval",
      "1 Prime Catcher", "2 Area Zero Underdepths", "1 Battle Cage",
      "5 Grass Energy", "3 Lightning Energy", "3 Fighting Energy",
    ]),
  },
];

async function seed() {
  console.log("Seeding sample decklists...\n");
  let inserted = 0;

  for (const deck of DECKLISTS) {
    const totalCards = deck.cards.reduce((sum, c) => sum + c.count, 0);
    const id = randomUUID();

    // Check if we already have a decklist for this archetype
    const [existing] = await sql`
      SELECT id FROM decklists WHERE archetype_id = ${deck.archetypeId} LIMIT 1
    `;
    if (existing) {
      console.log(`  Skip ${deck.archetypeId} (already has a list)`);
      continue;
    }

    // Find matching standing if possible
    const [standing] = await sql`
      SELECT id FROM tournament_standings
      WHERE tournament_id = ${deck.tournamentId}
        AND player_name = ${deck.playerName}
      LIMIT 1
    `;

    await sql`
      INSERT INTO decklists (id, tournament_id, standing_id, archetype_id, cards, player_name, "placing", created_at)
      VALUES (
        ${id},
        ${deck.tournamentId},
        ${standing?.id || null},
        ${deck.archetypeId},
        ${JSON.stringify(deck.cards)}::jsonb,
        ${deck.playerName},
        ${deck.placing},
        now()
      )
    `;
    inserted++;
    console.log(`  ${deck.archetypeId}: ${deck.playerName} (#${deck.placing}) — ${totalCards} cards`);
  }

  const [{ count }] = await sql`SELECT count(*) FROM decklists`;
  console.log(`\nTotal decklists in DB: ${count}`);
  console.log(`Inserted: ${inserted}`);

  await sql.end();
}

seed();
