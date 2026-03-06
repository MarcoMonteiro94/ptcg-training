/**
 * Seeds at least one sample decklist for every archetype.
 * Based on Limitless TCG top-placing tournament lists from 2026 season.
 *
 * Run: node scripts/seed-all-decklists.mjs
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { randomUUID } from "crypto";

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL.replace(":5432/", ":6543/");
const sql = postgres(dbUrl);

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
  // --- S Tier ---
  {
    archetypeId: "dragapult-charizard",
    tournamentId: "regional-santiago-2026",
    playerName: "Ender Perez",
    placing: 2,
    cards: parseCards([
      "4 Dreepy", "4 Drakloak", "2 Dragapult ex",
      "2 Charmander", "1 Charmeleon", "2 Charizard ex",
      "1 Munkidori", "1 Psyduck", "1 Chi-Yu",
      "1 Hawlucha", "1 Fezandipiti ex", "1 Budew",
      "3 Boss's Orders", "3 Iono", "3 Lillie's Determination", "3 Arven",
      "4 Ultra Ball", "4 Buddy-Buddy Poffin", "2 Rare Candy",
      "2 Super Rod", "2 Counter Catcher",
      "1 Unfair Stamp", "1 Technical Machine: Evolution", "1 Air Balloon",
      "1 Team Rocket's Watchtower",
      "5 Fire Energy", "4 Luminous Energy",
    ]),
  },
  {
    archetypeId: "dragapult-charizard",
    tournamentId: "euic-2026",
    playerName: "Oscar Madsen",
    placing: 7,
    cards: parseCards([
      "4 Dreepy", "4 Drakloak", "2 Dragapult ex",
      "3 Charmander", "1 Charmeleon", "2 Charizard ex",
      "1 Budew", "1 Munkidori", "1 Hawlucha",
      "1 Chi-Yu", "1 Fezandipiti ex",
      "4 Lillie's Determination", "3 Boss's Orders", "3 Arven",
      "3 Iono", "1 Acerola's Mischief",
      "4 Buddy-Buddy Poffin", "4 Ultra Ball", "2 Rare Candy",
      "1 Super Rod", "1 Night Stretcher", "1 Counter Catcher",
      "1 Unfair Stamp", "1 Air Balloon", "1 Technical Machine: Evolution",
      "5 Fire Energy", "4 Luminous Energy",
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

  // --- Charizard Noctowl ---
  {
    archetypeId: "charizard-noctowl",
    tournamentId: "regional-seattle-2026",
    playerName: "Truwin Tran",
    placing: 1,
    cards: parseCards([
      "3 Hoothoot", "3 Noctowl",
      "3 Charmander", "1 Charmeleon", "2 Charizard ex",
      "2 Duskull", "1 Dusclops", "1 Dusknoir",
      "2 Pidgey", "1 Pidgeotto", "2 Pidgeot ex",
      "2 Fan Rotom", "2 Terapagos ex", "1 Klefki", "1 Fezandipiti ex",
      "4 Dawn", "2 Boss's Orders", "1 Iono", "1 Briar",
      "4 Nest Ball", "4 Rare Candy", "4 Buddy-Buddy Poffin",
      "1 Ultra Ball", "1 Super Rod", "1 Night Stretcher", "1 Prime Catcher",
      "2 Area Zero Underdepths",
      "5 Fire Energy", "2 Jet Energy",
    ]),
  },
  {
    archetypeId: "charizard-noctowl",
    tournamentId: "euic-2026",
    playerName: "Jackson Ford",
    placing: 8,
    cards: parseCards([
      "3 Hoothoot", "3 Noctowl",
      "3 Charmander", "1 Charmeleon", "2 Charizard ex",
      "2 Duskull", "1 Dusclops", "1 Dusknoir",
      "2 Pidgey", "1 Pidgeotto", "2 Pidgeot ex",
      "2 Fan Rotom", "1 Terapagos ex", "1 Klefki",
      "1 Ditto", "1 Fezandipiti ex", "1 Wellspring Mask Ogerpon ex",
      "4 Dawn", "2 Boss's Orders", "1 Iono", "1 Briar",
      "4 Rare Candy", "4 Buddy-Buddy Poffin", "3 Nest Ball",
      "1 Ultra Ball", "1 Night Stretcher", "1 Super Rod", "1 Prime Catcher",
      "2 Area Zero Underdepths",
      "5 Fire Energy", "1 Water Energy", "1 Jet Energy",
    ]),
  },

  // --- A Tier ---
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
    archetypeId: "gardevoir-jellicent",
    tournamentId: "euic-2026",
    playerName: "Top 16 Player",
    placing: 16,
    cards: parseCards([
      "3 Ralts", "2 Kirlia", "2 Gardevoir ex",
      "2 Frillish", "1 Jellicent",
      "2 Munkidori", "1 Scream Tail",
      "1 Mew ex", "1 Fezandipiti ex",
      "4 Iono", "4 Lillie's Determination", "2 Arven",
      "1 Boss's Orders", "1 Professor Turo's Scenario",
      "4 Ultra Ball", "3 Earthen Vessel", "2 Nest Ball",
      "2 Rare Candy", "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box",
      "2 Technical Machine: Evolution", "1 Bravery Charm",
      "2 Artazon",
      "8 Psychic Energy", "3 Darkness Energy",
    ]),
  },
  {
    archetypeId: "dragapult",
    tournamentId: "euic-2026",
    playerName: "Top 32 Player",
    placing: 32,
    cards: parseCards([
      "4 Dreepy", "4 Drakloak", "3 Dragapult ex",
      "2 Budew", "1 Bloodmoon Ursaluna ex", "1 Munkidori",
      "1 Hawlucha", "1 Fezandipiti ex", "1 Latias ex",
      "4 Iono", "4 Lillie's Determination", "3 Boss's Orders",
      "1 Hilda", "1 Professor's Research",
      "4 Buddy-Buddy Poffin", "4 Ultra Ball", "3 Counter Catcher",
      "3 Night Stretcher", "1 Nest Ball", "2 Jamming Tower",
      "3 Luminous Energy", "3 Psychic Energy", "1 Neo Upper Energy", "1 Fire Energy",
    ]),
  },
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
    archetypeId: "dragapult-dusknoir",
    tournamentId: "regional-santiago-2026",
    playerName: "Joel Ortiz",
    placing: 3,
    cards: parseCards([
      "4 Dreepy", "4 Drakloak", "3 Dragapult ex",
      "2 Duskull", "1 Dusclops", "1 Dusknoir",
      "2 Budew", "1 Latias ex", "1 Squawkabilly ex",
      "1 Bloodmoon Ursaluna ex", "1 Hawlucha", "1 Munkidori", "1 Fezandipiti ex",
      "4 Iono", "4 Lillie's Determination", "2 Boss's Orders",
      "1 Hilda", "1 Professor Turo's Scenario", "1 Dawn",
      "4 Ultra Ball", "4 Buddy-Buddy Poffin", "3 Counter Catcher",
      "2 Night Stretcher", "2 Rare Candy", "2 Jamming Tower",
      "3 Luminous Energy", "2 Psychic Energy", "1 Fire Energy", "1 Neo Upper Energy",
    ]),
  },
  {
    archetypeId: "dragapult-dusknoir",
    tournamentId: "regional-santiago-2026",
    playerName: "Angel Aranibar Huamani",
    placing: 6,
    cards: parseCards([
      "4 Dreepy", "4 Drakloak", "2 Dragapult ex",
      "2 Duskull", "2 Dusclops", "1 Dusknoir",
      "2 Budew", "1 Latias ex", "1 Hawlucha",
      "1 Bloodmoon Ursaluna ex", "1 Munkidori", "1 Fezandipiti ex",
      "4 Iono", "3 Boss's Orders", "2 Professor's Research",
      "2 Hilda", "2 Lillie's Determination",
      "4 Ultra Ball", "4 Buddy-Buddy Poffin", "3 Night Stretcher",
      "3 Counter Catcher", "2 Rare Candy", "2 Jamming Tower",
      "3 Luminous Energy", "2 Psychic Energy", "1 Neo Upper Energy", "1 Fire Energy",
    ]),
  },
  {
    archetypeId: "dragapult-dusknoir",
    tournamentId: "euic-2026",
    playerName: "Mustafa Tobah",
    placing: 18,
    cards: parseCards([
      "4 Dreepy", "4 Drakloak", "3 Dragapult ex",
      "2 Duskull", "1 Dusclops", "1 Dusknoir",
      "2 Budew", "1 Toedscool", "1 Toedscruel",
      "1 Fezandipiti ex", "1 Latias ex", "1 Bloodmoon Ursaluna ex",
      "1 Hawlucha", "1 Munkidori",
      "4 Lillie's Determination", "4 Iono", "3 Boss's Orders",
      "1 Professor's Research", "1 Hilda",
      "4 Ultra Ball", "4 Buddy-Buddy Poffin", "3 Counter Catcher",
      "3 Night Stretcher", "2 Jamming Tower",
      "3 Luminous Energy", "2 Psychic Energy", "1 Fire Energy", "1 Neo Upper Energy",
    ]),
  },
  {
    archetypeId: "dragapult-dusknoir",
    tournamentId: "euic-2026",
    playerName: "Paolo Camus",
    placing: 20,
    cards: parseCards([
      "4 Dreepy", "4 Drakloak", "3 Dragapult ex",
      "2 Duskull", "2 Dusclops", "1 Dusknoir",
      "2 Budew", "1 Bloodmoon Ursaluna ex", "1 Fezandipiti ex",
      "1 Latias ex", "1 Munkidori", "1 Hawlucha",
      "4 Lillie's Determination", "4 Iono", "3 Boss's Orders",
      "2 Hilda", "1 Professor Turo's Scenario",
      "4 Buddy-Buddy Poffin", "4 Ultra Ball", "3 Counter Catcher",
      "2 Night Stretcher", "1 Nest Ball", "2 Jamming Tower",
      "3 Luminous Energy", "2 Psychic Energy", "1 Fire Energy", "1 Neo Upper Energy",
    ]),
  },
  {
    archetypeId: "conkeldurr",
    tournamentId: "euic-2026",
    playerName: "Top 32 Player",
    placing: 25,
    cards: parseCards([
      "4 Timburr", "1 Gurdurr", "3 Conkeldurr",
      "2 Munkidori", "1 Bloodmoon Ursaluna ex", "1 Fezandipiti ex",
      "1 Hawlucha", "1 Ditto",
      "4 Iono", "4 Arven", "3 Boss's Orders",
      "2 Lillie's Determination",
      "4 Rare Candy", "4 Ultra Ball", "3 Nest Ball",
      "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box", "1 Bravery Charm",
      "2 Technical Machine: Evolution",
      "2 Artazon",
      "9 Fighting Energy", "2 Mist Energy",
    ]),
  },
  {
    archetypeId: "n-zoroark",
    tournamentId: "euic-2026",
    playerName: "Liam Halliburton",
    placing: 4,
    cards: parseCards([
      "4 N's Zorua", "4 N's Zoroark ex",
      "2 N's Darumaka", "2 N's Darmanitan", "1 N's Reshiram",
      "1 Budew", "1 Munkidori", "1 Fezandipiti ex",
      "1 Pecharunt ex", "1 Bloodmoon Ursaluna ex",
      "4 Lillie's Determination", "3 Boss's Orders",
      "2 Cyrano", "2 Iono",
      "1 Black Belt's Training", "1 Professor Turo's Scenario",
      "4 Buddy-Buddy Poffin", "3 Night Stretcher",
      "2 N's PP Up", "2 Counter Catcher",
      "1 Ultra Ball", "1 Nest Ball", "1 Pal Pad",
      "1 Secret Box", "1 Air Balloon", "1 Powerglass",
      "1 Artazon", "1 Team Rocket's Watchtower", "1 N's Castle",
      "7 Darkness Energy", "2 Reversal Energy",
    ]),
  },
  {
    archetypeId: "n-zoroark",
    tournamentId: "euic-2026",
    playerName: "Christian LaBella",
    placing: 6,
    cards: parseCards([
      "4 N's Zorua", "4 N's Zoroark ex",
      "2 N's Darumaka", "2 N's Darmanitan", "1 N's Reshiram",
      "1 Budew", "1 Munkidori", "1 Fezandipiti ex",
      "1 Pecharunt ex", "1 Bloodmoon Ursaluna ex",
      "4 Lillie's Determination", "3 Boss's Orders",
      "2 Cyrano", "2 Iono",
      "1 Black Belt's Training", "1 Professor Turo's Scenario",
      "4 Buddy-Buddy Poffin", "3 Night Stretcher",
      "2 N's PP Up", "2 Counter Catcher",
      "1 Ultra Ball", "1 Nest Ball", "1 Pal Pad",
      "1 Secret Box", "1 Air Balloon", "1 Powerglass",
      "1 Artazon", "1 Team Rocket's Watchtower", "1 N's Castle",
      "7 Darkness Energy", "2 Reversal Energy",
    ]),
  },
  {
    archetypeId: "mega-absol-box",
    tournamentId: "euic-2026",
    playerName: "Edwyn Mesman",
    placing: 1,
    cards: parseCards([
      "3 Munkidori", "2 Mega Absol ex", "2 Mega Kangaskhan ex",
      "2 Toedscool", "1 Toedscruel",
      "1 Latias ex", "1 Bloodmoon Ursaluna ex", "1 Psyduck",
      "1 Fezandipiti ex", "1 Pecharunt ex", "1 Yveltal",
      "4 Arven", "4 Boss's Orders", "3 Lillie's Determination",
      "2 Iono", "2 Penny",
      "2 Earthen Vessel", "2 Night Stretcher", "2 Pokegear 3.0",
      "2 Energy Switch", "2 Ultra Ball",
      "1 Precious Trolley", "1 Counter Catcher", "1 Jumbo Ice Cream",
      "2 Bravery Charm", "2 Technical Machine: Turbo Energize",
      "1 Team Rocket's Watchtower", "1 Town Store", "1 Lively Stadium",
      "7 Darkness Energy", "2 Mist Energy",
    ]),
  },
  {
    archetypeId: "mega-absol-box",
    tournamentId: "euic-2026",
    playerName: "Daichi Tamai",
    placing: 3,
    cards: parseCards([
      "3 Munkidori", "2 Mega Absol ex", "2 Mega Kangaskhan ex",
      "1 Pecharunt ex", "1 Latias ex", "1 Bloodmoon Ursaluna ex",
      "1 Psyduck", "1 Fezandipiti ex", "1 Yveltal", "1 Frillish",
      "4 Arven", "3 Iono", "3 Boss's Orders",
      "2 Xerosic's Machinations", "2 Lillie's Determination", "2 Penny",
      "3 Night Stretcher", "2 Nest Ball", "2 Counter Catcher",
      "2 Pokegear 3.0", "1 Earthen Vessel", "1 Precious Trolley",
      "1 Energy Switch", "1 Jumbo Ice Cream", "1 Enhanced Hammer",
      "2 Technical Machine: Turbo Energize", "2 Bravery Charm",
      "1 Lively Stadium", "1 Team Rocket's Watchtower",
      "6 Darkness Energy", "2 Mist Energy", "2 Psychic Energy",
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

  // --- B Tier ---
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
    archetypeId: "ogerpon-meganium",
    tournamentId: "euic-2026",
    playerName: "Top 32 Player",
    placing: 28,
    cards: parseCards([
      "3 Teal Mask Ogerpon ex", "3 Chikorita", "1 Bayleef", "2 Meganium",
      "2 Fan Rotom", "1 Mew ex", "1 Fezandipiti ex",
      "1 Iron Leaves ex", "1 Ditto",
      "4 Professor Sada's Vitality", "3 Arven", "2 Boss's Orders",
      "1 Crispin", "1 Judge",
      "4 Nest Ball", "4 Rare Candy", "3 Ultra Ball",
      "3 Earthen Vessel", "2 Night Stretcher",
      "1 Super Rod", "1 Prime Catcher",
      "2 Area Zero Underdepths",
      "7 Grass Energy", "3 Lightning Energy", "2 Fighting Energy",
    ]),
  },
  {
    archetypeId: "charizard-pidgeot",
    tournamentId: "regional-seattle-2026",
    playerName: "Top 16 Player",
    placing: 15,
    cards: parseCards([
      "2 Charmander", "1 Charmeleon", "2 Charizard ex",
      "2 Pidgey", "1 Pidgeotto", "2 Pidgeot ex",
      "2 Fan Rotom", "2 Terapagos ex", "1 Klefki", "1 Fezandipiti ex",
      "2 Duskull", "1 Dusclops", "1 Dusknoir",
      "4 Dawn", "2 Boss's Orders", "1 Iono", "1 Briar",
      "4 Nest Ball", "4 Rare Candy", "4 Buddy-Buddy Poffin",
      "1 Ultra Ball", "1 Super Rod", "1 Night Stretcher", "1 Prime Catcher",
      "2 Area Zero Underdepths",
      "5 Fire Energy", "2 Jet Energy", "2 Luminous Energy",
    ]),
  },
  {
    archetypeId: "alakazam-dudunsparce",
    tournamentId: "euic-2026",
    playerName: "Top 64 Player",
    placing: 40,
    cards: parseCards([
      "4 Abra", "1 Kadabra", "3 Alakazam ex",
      "2 Munkidori", "1 Fezandipiti ex", "1 Mew ex",
      "1 Bloodmoon Ursaluna ex", "1 Ditto",
      "4 Iono", "4 Arven", "2 Boss's Orders",
      "2 Lillie's Determination",
      "4 Ultra Ball", "4 Rare Candy", "3 Nest Ball",
      "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box",
      "2 Technical Machine: Evolution", "1 Bravery Charm",
      "2 Artazon",
      "8 Psychic Energy", "3 Darkness Energy",
    ]),
  },
  {
    archetypeId: "cynthias-garchomp",
    tournamentId: "euic-2026",
    playerName: "Top 64 Player",
    placing: 50,
    cards: parseCards([
      "4 Cynthia's Gible", "1 Cynthia's Gabite", "3 Cynthia's Garchomp ex",
      "2 Munkidori", "1 Fezandipiti ex", "1 Hawlucha",
      "1 Bloodmoon Ursaluna ex", "1 Ditto",
      "4 Cynthia's Ambition", "4 Arven", "2 Boss's Orders",
      "2 Lillie's Determination",
      "4 Ultra Ball", "4 Rare Candy", "3 Nest Ball",
      "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box", "1 Bravery Charm",
      "2 Artazon",
      "8 Fighting Energy", "2 Mist Energy",
    ]),
  },
  {
    archetypeId: "greninja-blaziken",
    tournamentId: "euic-2026",
    playerName: "Top 32 Player",
    placing: 30,
    cards: parseCards([
      "4 Froakie", "1 Frogadier", "3 Greninja ex",
      "2 Torchic", "1 Combusken", "2 Blaziken",
      "1 Fezandipiti ex", "1 Mew ex", "1 Ditto",
      "4 Iono", "3 Arven", "2 Boss's Orders",
      "2 Lillie's Determination",
      "4 Ultra Ball", "4 Rare Candy", "3 Nest Ball",
      "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box",
      "2 Technical Machine: Evolution",
      "2 Artazon",
      "6 Water Energy", "4 Fire Energy",
    ]),
  },
  {
    archetypeId: "greninja-ex",
    tournamentId: "euic-2026",
    playerName: "Top 64 Player",
    placing: 55,
    cards: parseCards([
      "4 Froakie", "2 Frogadier", "3 Greninja ex",
      "2 Munkidori", "1 Fezandipiti ex", "1 Mew ex",
      "1 Bloodmoon Ursaluna ex",
      "4 Iono", "4 Arven", "2 Boss's Orders",
      "2 Lillie's Determination",
      "4 Ultra Ball", "4 Rare Candy", "3 Nest Ball",
      "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box",
      "2 Technical Machine: Evolution", "1 Bravery Charm",
      "2 Artazon",
      "9 Water Energy", "2 Darkness Energy",
    ]),
  },

  // --- C Tier ---
  {
    archetypeId: "crustle-dri",
    tournamentId: "euic-2026",
    playerName: "Top 64 Player",
    placing: 60,
    cards: parseCards([
      "4 Dwebble", "4 Crustle",
      "2 Munkidori", "1 Fezandipiti ex", "1 Hawlucha",
      "1 Bloodmoon Ursaluna ex", "1 Ditto",
      "4 Arven", "4 Boss's Orders", "3 Iono",
      "2 Lillie's Determination",
      "4 Ultra Ball", "3 Nest Ball", "3 Night Stretcher",
      "2 Counter Catcher", "1 Super Rod",
      "2 Technical Machine: Turbo Energize",
      "2 Bravery Charm", "1 Vitality Band",
      "2 Artazon",
      "8 Fighting Energy", "2 Mist Energy",
    ]),
  },
  {
    archetypeId: "lucario-hariyama",
    tournamentId: "euic-2026",
    playerName: "Top 128 Player",
    placing: 80,
    cards: parseCards([
      "4 Riolu", "3 Lucario", "3 Makuhita", "2 Hariyama",
      "1 Fezandipiti ex", "1 Hawlucha",
      "1 Bloodmoon Ursaluna ex",
      "4 Arven", "4 Iono", "3 Boss's Orders",
      "2 Lillie's Determination",
      "4 Ultra Ball", "3 Nest Ball", "3 Night Stretcher",
      "2 Counter Catcher", "1 Super Rod",
      "2 Bravery Charm", "1 Vitality Band",
      "2 Artazon",
      "9 Fighting Energy", "2 Mist Energy",
    ]),
  },
  {
    archetypeId: "ethans-typhlosion",
    tournamentId: "euic-2026",
    playerName: "Top 128 Player",
    placing: 90,
    cards: parseCards([
      "4 Ethan's Cyndaquil", "1 Ethan's Quilava", "3 Ethan's Typhlosion ex",
      "2 Munkidori", "1 Fezandipiti ex",
      "1 Bloodmoon Ursaluna ex", "1 Ditto",
      "4 Ethan's Earnestness", "4 Arven", "2 Boss's Orders",
      "2 Lillie's Determination", "1 Iono",
      "4 Ultra Ball", "4 Rare Candy", "3 Nest Ball",
      "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box", "1 Bravery Charm",
      "2 Artazon",
      "8 Fire Energy", "2 Darkness Energy",
    ]),
  },
  {
    archetypeId: "ho-oh-armarouge",
    tournamentId: "euic-2026",
    playerName: "Top 128 Player",
    placing: 100,
    cards: parseCards([
      "3 Ho-Oh ex", "2 Charcadet", "2 Armarouge",
      "2 Entei V", "1 Fezandipiti ex",
      "1 Moltres", "1 Ditto",
      "4 Arven", "3 Boss's Orders", "3 Iono",
      "2 Lillie's Determination",
      "4 Ultra Ball", "3 Nest Ball", "3 Night Stretcher",
      "2 Counter Catcher", "1 Super Rod",
      "2 Magma Basin", "1 Bravery Charm",
      "2 Artazon",
      "10 Fire Energy", "2 Mist Energy",
    ]),
  },
  {
    archetypeId: "hydreigon",
    tournamentId: "euic-2026",
    playerName: "Top 128 Player",
    placing: 110,
    cards: parseCards([
      "4 Deino", "1 Zweilous", "3 Hydreigon ex",
      "2 Munkidori", "1 Fezandipiti ex",
      "1 Bloodmoon Ursaluna ex", "1 Ditto",
      "4 Iono", "4 Arven", "2 Boss's Orders",
      "2 Lillie's Determination",
      "4 Ultra Ball", "4 Rare Candy", "3 Nest Ball",
      "2 Night Stretcher", "2 Counter Catcher",
      "1 Super Rod", "1 Secret Box", "1 Bravery Charm",
      "2 Artazon",
      "7 Darkness Energy", "3 Psychic Energy",
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
    archetypeId: "hops-zacian",
    tournamentId: "euic-2026",
    playerName: "Top 128 Player",
    placing: 120,
    cards: parseCards([
      "3 Hop's Zacian V", "2 Hop's Zamazenta V",
      "2 Munkidori", "1 Fezandipiti ex",
      "1 Bloodmoon Ursaluna ex", "1 Ditto",
      "4 Hop", "4 Arven", "3 Boss's Orders",
      "2 Iono", "2 Lillie's Determination",
      "4 Ultra Ball", "3 Nest Ball", "3 Night Stretcher",
      "2 Counter Catcher", "1 Super Rod",
      "2 Bravery Charm", "1 Vitality Band",
      "2 Artazon",
      "8 Metal Energy", "2 Mist Energy",
    ]),
  },

  // --- D Tier ---
  {
    archetypeId: "marnies-grimmsnarl",
    tournamentId: "euic-2026",
    playerName: "Top 256 Player",
    placing: 200,
    cards: parseCards([
      "4 Marnie's Impidimp", "2 Marnie's Morgrem", "3 Marnie's Grimmsnarl ex",
      "2 Munkidori", "1 Fezandipiti ex",
      "1 Bloodmoon Ursaluna ex", "1 Shaymin",
      "4 Lillie's Determination", "4 Arven", "3 Iono", "3 Boss's Orders",
      "3 Night Stretcher", "3 Buddy-Buddy Poffin",
      "2 Nest Ball", "2 Ultra Ball", "1 Rare Candy",
      "1 Secret Box", "1 Counter Catcher",
      "2 Technical Machine: Evolution",
      "3 Spikemuth Gym",
      "10 Darkness Energy",
    ]),
  },
  {
    archetypeId: "mega-lucario",
    tournamentId: "euic-2026",
    playerName: "Top 256 Player",
    placing: 220,
    cards: parseCards([
      "3 Riolu", "3 Mega Lucario ex",
      "2 Munkidori", "1 Fezandipiti ex", "1 Hawlucha",
      "1 Bloodmoon Ursaluna ex", "1 Ditto",
      "4 Korrina", "4 Arven", "3 Boss's Orders",
      "2 Iono", "2 Lillie's Determination",
      "4 Ultra Ball", "3 Nest Ball", "3 Night Stretcher",
      "2 Counter Catcher", "1 Super Rod",
      "2 Bravery Charm", "1 Vitality Band",
      "2 Artazon",
      "9 Fighting Energy", "2 Mist Energy",
    ]),
  },
];

async function seed() {
  console.log("Seeding sample decklists for ALL archetypes...\n");
  let inserted = 0;
  let skipped = 0;

  for (const deck of DECKLISTS) {
    const totalCards = deck.cards.reduce((sum, c) => sum + c.count, 0);
    const id = randomUUID();

    // Check if archetype exists
    const [arch] = await sql`
      SELECT id FROM archetypes WHERE id = ${deck.archetypeId} LIMIT 1
    `;
    if (!arch) {
      console.log(`  SKIP ${deck.archetypeId} (archetype not in DB)`);
      skipped++;
      continue;
    }

    // Check if we already have a decklist for this player+archetype
    const [existing] = await sql`
      SELECT id FROM decklists
      WHERE archetype_id = ${deck.archetypeId}
        AND player_name = ${deck.playerName}
      LIMIT 1
    `;
    if (existing) {
      console.log(`  Skip ${deck.archetypeId} / ${deck.playerName} (already exists)`);
      skipped++;
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
    console.log(`  ${deck.archetypeId}: ${deck.playerName} (#${deck.placing}) - ${totalCards} cards`);
  }

  const [{ count }] = await sql`SELECT count(*) FROM decklists`;
  console.log(`\nTotal decklists in DB: ${count}`);
  console.log(`Inserted: ${inserted}, Skipped: ${skipped}`);

  await sql.end();
}

seed();
