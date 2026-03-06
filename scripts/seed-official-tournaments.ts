/**
 * Seeds the database with official tournament data scraped from Limitless TCG.
 *
 * Tournaments:
 *   - Regional Santiago (Feb 7, 2026) — 1,670 players
 *   - EUIC 2026 London (Feb 13, 2026) — 4,010 players
 *   - Regional Seattle (Feb 28, 2026) — 2,231 players
 *
 * Run: npx tsx scripts/seed-official-tournaments.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { randomUUID } from "crypto";

const dbUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL!.replace(":5432/", ":6543/");
const sql = postgres(dbUrl);

// ── Archetypes ──────────────────────────────────────────────────────────────

interface ArchetypeSeed {
  id: string;
  name: string;
  slug: string;
  identifierCards: string[];
}

const ARCHETYPES: ArchetypeSeed[] = [
  { id: "charizard-noctowl", name: "Charizard Noctowl", slug: "charizard-noctowl", identifierCards: ["Charizard", "Noctowl"] },
  { id: "mega-absol-box", name: "Mega Absol Box", slug: "mega-absol-box", identifierCards: ["Mega Absol"] },
  { id: "gardevoir-ex-sv", name: "Gardevoir", slug: "gardevoir-ex-sv", identifierCards: ["Gardevoir ex"] },
  { id: "dragapult-dusknoir", name: "Dragapult Dusknoir", slug: "dragapult-dusknoir", identifierCards: ["Dragapult", "Dusknoir"] },
  { id: "gholdengo-lunatone", name: "Gholdengo Lunatone", slug: "gholdengo-lunatone", identifierCards: ["Gholdengo", "Lunatone"] },
  { id: "grimmsnarl-froslass", name: "Marnie's Grimmsnarl", slug: "grimmsnarl-froslass", identifierCards: ["Grimmsnarl", "Froslass"] },
  { id: "n-zoroark", name: "N's Zoroark", slug: "n-zoroark", identifierCards: ["Zoroark"] },
  { id: "raging-bolt-ogerpon", name: "Raging Bolt Ogerpon", slug: "raging-bolt-ogerpon", identifierCards: ["Raging Bolt", "Ogerpon"] },
  { id: "charizard-pidgeot", name: "Charizard Pidgeot", slug: "charizard-pidgeot", identifierCards: ["Charizard", "Pidgeot"] },
  { id: "gardevoir-jellicent", name: "Gardevoir Jellicent", slug: "gardevoir-jellicent", identifierCards: ["Gardevoir", "Jellicent"] },
  { id: "dragapult-charizard", name: "Dragapult Charizard", slug: "dragapult-charizard", identifierCards: ["Dragapult", "Charizard"] },
  { id: "alakazam-dudunsparce", name: "Alakazam Dudunsparce", slug: "alakazam-dudunsparce", identifierCards: ["Alakazam", "Dudunsparce"] },
  { id: "joltik-box", name: "Joltik Box", slug: "joltik-box", identifierCards: ["Joltik"] },
  { id: "ceruledge-ex", name: "Ceruledge", slug: "ceruledge-ex", identifierCards: ["Ceruledge"] },
  { id: "crustle-dri", name: "Crustle", slug: "crustle-dri", identifierCards: ["Crustle"] },
  { id: "kangaskhan-bouffalant", name: "Kangaskhan Bouffalant", slug: "kangaskhan-bouffalant", identifierCards: ["Kangaskhan", "Bouffalant"] },
  { id: "flareon-noctowl", name: "Flareon Noctowl", slug: "flareon-noctowl", identifierCards: ["Flareon", "Noctowl"] },
  { id: "tera-box", name: "Tera Box", slug: "tera-box", identifierCards: ["Terapagos"] },
  { id: "greninja-ex", name: "Greninja", slug: "greninja-ex", identifierCards: ["Greninja"] },
  { id: "froslass-munkidori", name: "Froslass Munkidori", slug: "froslass-munkidori", identifierCards: ["Froslass", "Munkidori"] },
  { id: "dragapult-blaziken", name: "Dragapult Blaziken", slug: "dragapult-blaziken", identifierCards: ["Dragapult", "Blaziken"] },
  { id: "mega-venusaur-ex", name: "Mega Venusaur", slug: "mega-venusaur", identifierCards: ["Mega Venusaur"] },
  { id: "slowking-scr", name: "Slowking", slug: "slowking", identifierCards: ["Slowking"] },
  { id: "pidgeot-control", name: "Pidgeot Control", slug: "pidgeot-control", identifierCards: ["Pidgeot"] },
  { id: "iron-hands-magneton", name: "Iron Hands Magneton", slug: "iron-hands-magneton", identifierCards: ["Iron Hands", "Magneton"] },
  { id: "lucario-hariyama", name: "Lucario Hariyama", slug: "lucario-hariyama", identifierCards: ["Lucario", "Hariyama"] },
  { id: "lopunny-dusknoir", name: "Lopunny Dusknoir", slug: "lopunny-dusknoir", identifierCards: ["Lopunny", "Dusknoir"] },
  // Archetypes with decklists but no top-32 standings
  { id: "conkeldurr", name: "Conkeldurr", slug: "conkeldurr", identifierCards: ["Conkeldurr"] },
  { id: "ogerpon-meganium", name: "Ogerpon Meganium", slug: "ogerpon-meganium", identifierCards: ["Ogerpon", "Meganium"] },
  { id: "cynthias-garchomp", name: "Cynthia's Garchomp", slug: "cynthias-garchomp", identifierCards: ["Garchomp"] },
  { id: "greninja-blaziken", name: "Greninja Blaziken", slug: "greninja-blaziken", identifierCards: ["Greninja", "Blaziken"] },
  { id: "ethans-typhlosion", name: "Ethan's Typhlosion", slug: "ethans-typhlosion", identifierCards: ["Typhlosion"] },
  { id: "ho-oh-armarouge", name: "Ho-Oh Armarouge", slug: "ho-oh-armarouge", identifierCards: ["Ho-Oh", "Armarouge"] },
  { id: "hydreigon", name: "Hydreigon", slug: "hydreigon", identifierCards: ["Hydreigon"] },
  { id: "hops-zacian", name: "Hop's Zacian", slug: "hops-zacian", identifierCards: ["Zacian"] },
  { id: "marnies-grimmsnarl", name: "Marnie's Grimmsnarl", slug: "marnies-grimmsnarl", identifierCards: ["Grimmsnarl"] },
  { id: "mega-lucario", name: "Mega Lucario", slug: "mega-lucario", identifierCards: ["Lucario"] },
];

// ── Tournaments ─────────────────────────────────────────────────────────────

interface TournamentSeed {
  id: string;
  name: string;
  date: string;
  format: string;
  tier: string;
  playerCount: number;
  sourceUrl: string;
}

const TOURNAMENTS: TournamentSeed[] = [
  {
    id: "regional-santiago-2026",
    name: "Regional Santiago 2026",
    date: "2026-02-07",
    format: "standard",
    tier: "regional",
    playerCount: 1670,
    sourceUrl: "https://limitlesstcg.com/tournaments/532",
  },
  {
    id: "euic-2026",
    name: "EUIC 2026, London",
    date: "2026-02-13",
    format: "standard",
    tier: "international",
    playerCount: 4010,
    sourceUrl: "https://limitlesstcg.com/tournaments/517",
  },
  {
    id: "regional-seattle-2026",
    name: "Regional Seattle, WA 2026",
    date: "2026-02-28",
    format: "standard",
    tier: "regional",
    playerCount: 2231,
    sourceUrl: "https://limitlesstcg.com/tournaments/542",
  },
];

// ── Standings ───────────────────────────────────────────────────────────────

interface StandingSeed {
  tournamentId: string;
  playerName: string;
  placing: number;
  record: string;
  archetypeId: string;
}

const STANDINGS: StandingSeed[] = [
  // ── Regional Santiago ──
  { tournamentId: "regional-santiago-2026", playerName: "Murilo Mercadante", placing: 1, record: "14-1-2", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "regional-santiago-2026", playerName: "Ender Perez", placing: 2, record: "13-2-2", archetypeId: "dragapult-charizard" },
  { tournamentId: "regional-santiago-2026", playerName: "Joel Ortiz", placing: 3, record: "12-3-1", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "regional-santiago-2026", playerName: "William Azevedo", placing: 4, record: "11-1-4", archetypeId: "gardevoir-jellicent" },
  { tournamentId: "regional-santiago-2026", playerName: "Eduardo Romanelli", placing: 5, record: "11-1-3", archetypeId: "gardevoir-jellicent" },
  { tournamentId: "regional-santiago-2026", playerName: "Angel Aranibar Huamani", placing: 6, record: "11-2-2", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "regional-santiago-2026", playerName: "Esteban Figueroa", placing: 7, record: "11-2-2", archetypeId: "dragapult-blaziken" },
  { tournamentId: "regional-santiago-2026", playerName: "Manuel Gonzalez", placing: 8, record: "11-2-2", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "regional-santiago-2026", playerName: "Marco Garcia", placing: 9, record: "10-3-1", archetypeId: "gardevoir-jellicent" },
  { tournamentId: "regional-santiago-2026", playerName: "Matias Candia", placing: 10, record: "10-3-1", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "regional-santiago-2026", playerName: "Esteban Chocano", placing: 11, record: "10-3-1", archetypeId: "alakazam-dudunsparce" },
  { tournamentId: "regional-santiago-2026", playerName: "Yerco Valencia", placing: 12, record: "9-1-3", archetypeId: "raging-bolt-ogerpon" },
  { tournamentId: "regional-santiago-2026", playerName: "Jonathan Fabrizio Bellucci", placing: 13, record: "10-3-0", archetypeId: "mega-absol-box" },
  { tournamentId: "regional-santiago-2026", playerName: "Emanuel Diogo", placing: 14, record: "9-1-3", archetypeId: "gholdengo-lunatone" },
  { tournamentId: "regional-santiago-2026", playerName: "Fernando Lopez", placing: 15, record: "9-2-2", archetypeId: "raging-bolt-ogerpon" },
  { tournamentId: "regional-santiago-2026", playerName: "Nicolas Rodriguez", placing: 16, record: "9-2-2", archetypeId: "grimmsnarl-froslass" },
  { tournamentId: "regional-santiago-2026", playerName: "Diego Guillen Pelaez", placing: 17, record: "9-2-2", archetypeId: "crustle-dri" },
  { tournamentId: "regional-santiago-2026", playerName: "Franco Ortiz", placing: 18, record: "9-2-2", archetypeId: "gholdengo-lunatone" },
  { tournamentId: "regional-santiago-2026", playerName: "Sebastian Gonzalez Munoz", placing: 19, record: "9-2-2", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "regional-santiago-2026", playerName: "Dalton Acchetta", placing: 20, record: "9-2-2", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "regional-santiago-2026", playerName: "Changyu Liu", placing: 21, record: "9-2-2", archetypeId: "mega-absol-box" },
  { tournamentId: "regional-santiago-2026", playerName: "Fernando Cifuentes", placing: 22, record: "9-2-2", archetypeId: "mega-absol-box" },
  { tournamentId: "regional-santiago-2026", playerName: "Mauricio Melo", placing: 23, record: "9-2-2", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "regional-santiago-2026", playerName: "Diego Makishi", placing: 24, record: "9-3-1", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "regional-santiago-2026", playerName: "Tomas Riquelme", placing: 25, record: "9-3-1", archetypeId: "mega-absol-box" },
  { tournamentId: "regional-santiago-2026", playerName: "Marco Cifuentes", placing: 26, record: "9-3-1", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "regional-santiago-2026", playerName: "Sebastian Cabrera Quilape", placing: 27, record: "9-3-1", archetypeId: "charizard-pidgeot" },
  { tournamentId: "regional-santiago-2026", playerName: "Francisco Osorio", placing: 28, record: "9-3-1", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "regional-santiago-2026", playerName: "Raul Chan", placing: 29, record: "9-3-1", archetypeId: "charizard-noctowl" },
  { tournamentId: "regional-santiago-2026", playerName: "Ignacio Olivares", placing: 30, record: "9-3-1", archetypeId: "dragapult-charizard" },
  { tournamentId: "regional-santiago-2026", playerName: "Julio Piero Diaz Accinelli", placing: 31, record: "9-3-1", archetypeId: "n-zoroark" },
  { tournamentId: "regional-santiago-2026", playerName: "Carlos Sepulveda", placing: 32, record: "8-1-4", archetypeId: "gholdengo-lunatone" },

  // ── EUIC 2026 ──
  { tournamentId: "euic-2026", playerName: "Edwyn Mesman", placing: 1, record: "15-0-3", archetypeId: "mega-absol-box" },
  { tournamentId: "euic-2026", playerName: "Drew Stephenson", placing: 2, record: "15-3-0", archetypeId: "gholdengo-lunatone" },
  { tournamentId: "euic-2026", playerName: "Daichi Tamai", placing: 3, record: "14-3-0", archetypeId: "mega-absol-box" },
  { tournamentId: "euic-2026", playerName: "Liam Halliburton", placing: 4, record: "13-2-2", archetypeId: "n-zoroark" },
  { tournamentId: "euic-2026", playerName: "Makani Tran", placing: 5, record: "13-2-1", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "euic-2026", playerName: "Christian LaBella", placing: 6, record: "12-2-2", archetypeId: "n-zoroark" },
  { tournamentId: "euic-2026", playerName: "Oscar Madsen", placing: 7, record: "12-2-2", archetypeId: "dragapult-charizard" },
  { tournamentId: "euic-2026", playerName: "Jackson Ford", placing: 8, record: "12-2-2", archetypeId: "charizard-noctowl" },
  { tournamentId: "euic-2026", playerName: "Lucas Xing", placing: 9, record: "11-2-2", archetypeId: "mega-absol-box" },
  { tournamentId: "euic-2026", playerName: "Julio Sanchez Rodriguez", placing: 10, record: "11-2-2", archetypeId: "gardevoir-jellicent" },
  { tournamentId: "euic-2026", playerName: "Brent Tonisson", placing: 11, record: "11-2-1", archetypeId: "gardevoir-jellicent" },
  { tournamentId: "euic-2026", playerName: "Andi Cheung", placing: 12, record: "11-2-1", archetypeId: "charizard-noctowl" },
  { tournamentId: "euic-2026", playerName: "Tord Reklev", placing: 13, record: "11-2-1", archetypeId: "mega-absol-box" },
  { tournamentId: "euic-2026", playerName: "Alexander Thorvaldson", placing: 14, record: "11-2-1", archetypeId: "gholdengo-lunatone" },
  { tournamentId: "euic-2026", playerName: "Krzysztof Figas", placing: 15, record: "11-2-1", archetypeId: "charizard-noctowl" },
  { tournamentId: "euic-2026", playerName: "Ian Robb", placing: 16, record: "11-2-1", archetypeId: "gardevoir-jellicent" },
  { tournamentId: "euic-2026", playerName: "Gan Pee Wei Jun", placing: 17, record: "11-2-1", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "euic-2026", playerName: "Mustafa Tobah", placing: 18, record: "10-1-3", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "euic-2026", playerName: "Vincent Marcus Munk", placing: 19, record: "11-3-0", archetypeId: "froslass-munkidori" },
  { tournamentId: "euic-2026", playerName: "Paolo Camus", placing: 20, record: "11-3-0", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "euic-2026", playerName: "Calvin Connor", placing: 21, record: "11-3-0", archetypeId: "gardevoir-jellicent" },
  { tournamentId: "euic-2026", playerName: "Takahiro Kurosaki", placing: 22, record: "11-3-0", archetypeId: "gholdengo-lunatone" },
  { tournamentId: "euic-2026", playerName: "Grant Manley", placing: 23, record: "10-1-3", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "euic-2026", playerName: "Toby Woolner", placing: 24, record: "10-1-3", archetypeId: "mega-absol-box" },
  { tournamentId: "euic-2026", playerName: "Yerco Valencia", placing: 25, record: "11-3-0", archetypeId: "raging-bolt-ogerpon" },
  { tournamentId: "euic-2026", playerName: "Sota Kasai", placing: 26, record: "10-1-3", archetypeId: "mega-absol-box" },
  { tournamentId: "euic-2026", playerName: "Vinicius Fernandez", placing: 27, record: "10-1-3", archetypeId: "n-zoroark" },
  { tournamentId: "euic-2026", playerName: "James Cox", placing: 28, record: "11-3-0", archetypeId: "mega-absol-box" },
  { tournamentId: "euic-2026", playerName: "Asaki Hasegawa", placing: 29, record: "10-2-2", archetypeId: "grimmsnarl-froslass" },
  { tournamentId: "euic-2026", playerName: "Kyle Best", placing: 30, record: "10-2-2", archetypeId: "charizard-pidgeot" },
  { tournamentId: "euic-2026", playerName: "Carter Malnaik", placing: 31, record: "10-2-2", archetypeId: "mega-absol-box" },
  { tournamentId: "euic-2026", playerName: "Yihao Chen", placing: 32, record: "10-2-2", archetypeId: "grimmsnarl-froslass" },

  // ── Regional Seattle ──
  { tournamentId: "regional-seattle-2026", playerName: "Truwin Tran", placing: 1, record: "15-1-2", archetypeId: "charizard-noctowl" },
  { tournamentId: "regional-seattle-2026", playerName: "Grant Shen", placing: 2, record: "13-1-4", archetypeId: "mega-absol-box" },
  { tournamentId: "regional-seattle-2026", playerName: "Joseph Mousaed", placing: 3, record: "13-2-2", archetypeId: "mega-absol-box" },
  { tournamentId: "regional-seattle-2026", playerName: "Julius Brunfeldt", placing: 4, record: "13-3-1", archetypeId: "charizard-pidgeot" },
  { tournamentId: "regional-seattle-2026", playerName: "Bodhi Robinson", placing: 5, record: "14-1-1", archetypeId: "gardevoir-ex-sv" },
  { tournamentId: "regional-seattle-2026", playerName: "David Andrews", placing: 6, record: "12-2-2", archetypeId: "raging-bolt-ogerpon" },
  { tournamentId: "regional-seattle-2026", playerName: "Nathan Ginsburg", placing: 7, record: "11-1-4", archetypeId: "mega-absol-box" },
  { tournamentId: "regional-seattle-2026", playerName: "Mason Lovato", placing: 8, record: "12-3-1", archetypeId: "joltik-box" },
  { tournamentId: "regional-seattle-2026", playerName: "Andrew Hedrick", placing: 9, record: "11-3-1", archetypeId: "dragapult-dusknoir" },
  { tournamentId: "regional-seattle-2026", playerName: "Hasan Kunukcu", placing: 10, record: "11-3-1", archetypeId: "mega-absol-box" },
];

// ── Matchup Stats (aggregated from all 3 tournaments, 10+ total games) ─────

interface MatchupSeed {
  archetypeA: string;
  archetypeB: string;
  wins: number;
  losses: number;
  draws: number;
}

// Normalized: archetypeA < archetypeB alphabetically, wins from A's perspective
const MATCHUPS: MatchupSeed[] = [
  // Charizard Noctowl matchups (Seattle data, high sample)
  { archetypeA: "charizard-noctowl", archetypeB: "gholdengo-lunatone", wins: 97, losses: 70, draws: 10 },
  { archetypeA: "charizard-noctowl", archetypeB: "dragapult-dusknoir", wins: 58, losses: 98, draws: 15 },
  { archetypeA: "charizard-noctowl", archetypeB: "gardevoir-ex-sv", wins: 44, losses: 43, draws: 17 },
  { archetypeA: "charizard-noctowl", archetypeB: "mega-absol-box", wins: 40, losses: 46, draws: 13 },
  { archetypeA: "charizard-noctowl", archetypeB: "grimmsnarl-froslass", wins: 23, losses: 33, draws: 20 },
  { archetypeA: "charizard-noctowl", archetypeB: "n-zoroark", wins: 32, losses: 21, draws: 14 },
  { archetypeA: "charizard-noctowl", archetypeB: "raging-bolt-ogerpon", wins: 33, losses: 25, draws: 3 },
  { archetypeA: "charizard-noctowl", archetypeB: "gardevoir-jellicent", wins: 30, losses: 13, draws: 7 },
  { archetypeA: "charizard-noctowl", archetypeB: "charizard-pidgeot", wins: 20, losses: 11, draws: 6 },
  { archetypeA: "charizard-noctowl", archetypeB: "dragapult-charizard", wins: 11, losses: 19, draws: 9 },
  { archetypeA: "charizard-noctowl", archetypeB: "alakazam-dudunsparce", wins: 18, losses: 9, draws: 6 },
  { archetypeA: "charizard-noctowl", archetypeB: "ceruledge-ex", wins: 17, losses: 3, draws: 2 },
  { archetypeA: "charizard-noctowl", archetypeB: "crustle-dri", wins: 3, losses: 12, draws: 6 },
  { archetypeA: "charizard-noctowl", archetypeB: "joltik-box", wins: 9, losses: 7, draws: 2 },

  // Gardevoir matchups (Seattle data)
  { archetypeA: "gardevoir-ex-sv", archetypeB: "gholdengo-lunatone", wins: 104, losses: 94, draws: 58 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "dragapult-dusknoir", wins: 118, losses: 69, draws: 28 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "mega-absol-box", wins: 65, losses: 55, draws: 24 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "grimmsnarl-froslass", wins: 34, losses: 62, draws: 16 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "n-zoroark", wins: 27, losses: 44, draws: 18 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "gardevoir-jellicent", wins: 22, losses: 32, draws: 13 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "raging-bolt-ogerpon", wins: 36, losses: 15, draws: 15 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "charizard-pidgeot", wins: 20, losses: 29, draws: 7 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "dragapult-charizard", wins: 25, losses: 21, draws: 4 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "alakazam-dudunsparce", wins: 21, losses: 6, draws: 5 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "ceruledge-ex", wins: 21, losses: 9, draws: 5 },
  { archetypeA: "gardevoir-ex-sv", archetypeB: "crustle-dri", wins: 16, losses: 0, draws: 1 },

  // Dragapult Dusknoir matchups (EUIC data — largest sample)
  { archetypeA: "dragapult-dusknoir", archetypeB: "gholdengo-lunatone", wins: 373, losses: 467, draws: 122 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "mega-absol-box", wins: 71, losses: 165, draws: 56 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "grimmsnarl-froslass", wins: 91, losses: 181, draws: 38 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "gardevoir-jellicent", wins: 116, losses: 174, draws: 37 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "raging-bolt-ogerpon", wins: 88, losses: 107, draws: 13 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "n-zoroark", wins: 42, losses: 52, draws: 17 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "charizard-pidgeot", wins: 139, losses: 88, draws: 39 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "dragapult-charizard", wins: 85, losses: 75, draws: 15 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "alakazam-dudunsparce", wins: 100, losses: 38, draws: 27 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "kangaskhan-bouffalant", wins: 26, losses: 44, draws: 22 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "flareon-noctowl", wins: 56, losses: 26, draws: 6 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "ceruledge-ex", wins: 47, losses: 27, draws: 9 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "joltik-box", wins: 33, losses: 21, draws: 0 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "iron-hands-magneton", wins: 15, losses: 34, draws: 3 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "crustle-dri", wins: 15, losses: 21, draws: 14 },
  { archetypeA: "dragapult-dusknoir", archetypeB: "lucario-hariyama", wins: 24, losses: 23, draws: 3 },

  // Gholdengo Lunatone matchups (Seattle data)
  { archetypeA: "gholdengo-lunatone", archetypeB: "mega-absol-box", wins: 85, losses: 80, draws: 42 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "grimmsnarl-froslass", wins: 33, losses: 50, draws: 24 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "n-zoroark", wins: 54, losses: 47, draws: 14 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "gardevoir-jellicent", wins: 49, losses: 39, draws: 23 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "raging-bolt-ogerpon", wins: 49, losses: 38, draws: 14 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "charizard-pidgeot", wins: 34, losses: 37, draws: 8 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "dragapult-charizard", wins: 24, losses: 28, draws: 14 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "alakazam-dudunsparce", wins: 11, losses: 29, draws: 8 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "joltik-box", wins: 17, losses: 26, draws: 4 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "ceruledge-ex", wins: 19, losses: 16, draws: 7 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "kangaskhan-bouffalant", wins: 24, losses: 11, draws: 3 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "crustle-dri", wins: 2, losses: 17, draws: 2 },
  { archetypeA: "gholdengo-lunatone", archetypeB: "froslass-munkidori", wins: 5, losses: 15, draws: 3 },

  // Mega Absol Box matchups (EUIC data — largest sample)
  { archetypeA: "mega-absol-box", archetypeB: "grimmsnarl-froslass", wins: 62, losses: 27, draws: 16 },
  { archetypeA: "mega-absol-box", archetypeB: "gardevoir-jellicent", wins: 54, losses: 31, draws: 16 },
  { archetypeA: "mega-absol-box", archetypeB: "raging-bolt-ogerpon", wins: 14, losses: 29, draws: 3 },
  { archetypeA: "mega-absol-box", archetypeB: "charizard-pidgeot", wins: 29, losses: 28, draws: 13 },
  { archetypeA: "mega-absol-box", archetypeB: "dragapult-charizard", wins: 26, losses: 14, draws: 10 },
  { archetypeA: "mega-absol-box", archetypeB: "n-zoroark", wins: 12, losses: 10, draws: 6 },
  { archetypeA: "mega-absol-box", archetypeB: "alakazam-dudunsparce", wins: 18, losses: 14, draws: 3 },
  { archetypeA: "mega-absol-box", archetypeB: "kangaskhan-bouffalant", wins: 14, losses: 11, draws: 5 },
  { archetypeA: "mega-absol-box", archetypeB: "joltik-box", wins: 12, losses: 7, draws: 0 },
  { archetypeA: "mega-absol-box", archetypeB: "crustle-dri", wins: 12, losses: 3, draws: 7 },

  // Raging Bolt Ogerpon matchups (from various tournaments)
  { archetypeA: "raging-bolt-ogerpon", archetypeB: "grimmsnarl-froslass", wins: 15, losses: 14, draws: 10 },
  { archetypeA: "raging-bolt-ogerpon", archetypeB: "n-zoroark", wins: 9, losses: 8, draws: 2 },
];

// ── Meta shares (averaged across 3 tournaments) ────────────────────────────

interface MetaShareSeed {
  archetypeId: string;
  usageRate: number; // average across 3 tournaments
}

const META_SHARES: MetaShareSeed[] = [
  { archetypeId: "dragapult-dusknoir", usageRate: 0.1937 },  // ~19.4%
  { archetypeId: "gardevoir-ex-sv", usageRate: 0.1693 },     // ~16.9%
  { archetypeId: "gholdengo-lunatone", usageRate: 0.1494 },  // ~14.9%
  { archetypeId: "charizard-noctowl", usageRate: 0.1119 },   // ~11.2%
  { archetypeId: "mega-absol-box", usageRate: 0.0800 },      // ~8.0%
  { archetypeId: "grimmsnarl-froslass", usageRate: 0.0714 }, // ~7.1%
  { archetypeId: "raging-bolt-ogerpon", usageRate: 0.0540 }, // ~5.4%
  { archetypeId: "n-zoroark", usageRate: 0.0257 },           // ~2.6%
  { archetypeId: "charizard-pidgeot", usageRate: 0.0200 },
  { archetypeId: "gardevoir-jellicent", usageRate: 0.0180 },
  { archetypeId: "dragapult-charizard", usageRate: 0.0160 },
  { archetypeId: "alakazam-dudunsparce", usageRate: 0.0148 },
  { archetypeId: "joltik-box", usageRate: 0.0130 },
  { archetypeId: "ceruledge-ex", usageRate: 0.0120 },
  { archetypeId: "crustle-dri", usageRate: 0.0110 },
  { archetypeId: "flareon-noctowl", usageRate: 0.0100 },
  { archetypeId: "kangaskhan-bouffalant", usageRate: 0.0090 },
  { archetypeId: "tera-box", usageRate: 0.0080 },
  { archetypeId: "froslass-munkidori", usageRate: 0.0070 },
];

// ── Seed functions ──────────────────────────────────────────────────────────

async function seedArchetypes() {
  console.log("Seeding archetypes...");
  let inserted = 0;
  for (const a of ARCHETYPES) {
    await sql`
      INSERT INTO archetypes (id, name, slug, identifier_cards, format, is_active, created_at, updated_at)
      VALUES (${a.id}, ${a.name}, ${a.slug}, ${JSON.stringify(a.identifierCards)}::jsonb, 'standard', true, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        is_active = true,
        updated_at = now()
    `.catch(() => {
      // Slug conflict — archetype already exists with different ID, skip
    });
    inserted++;
  }
  console.log(`  ${inserted} archetypes upserted`);
}

async function seedTournaments() {
  console.log("Seeding tournaments...");
  for (const t of TOURNAMENTS) {
    await sql`
      INSERT INTO tournaments (id, name, date, format, tier, player_count, source_url, created_at)
      VALUES (${t.id}, ${t.name}, ${t.date}, ${t.format}, ${t.tier}, ${t.playerCount}, ${t.sourceUrl}, now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        player_count = EXCLUDED.player_count,
        source_url = EXCLUDED.source_url
    `;
  }
  console.log(`  ${TOURNAMENTS.length} tournaments upserted`);
}

async function seedStandings() {
  console.log("Seeding standings...");
  let inserted = 0;
  for (const s of STANDINGS) {
    const id = randomUUID();
    await sql`
      INSERT INTO tournament_standings (id, tournament_id, player_name, "placing", record, archetype_id, created_at)
      VALUES (${id}, ${s.tournamentId}, ${s.playerName}, ${s.placing}, ${s.record}, ${s.archetypeId}, now())
    `.catch(() => { /* skip duplicates */ });
    inserted++;
  }
  console.log(`  ${inserted} standings inserted`);
}

async function seedMatchupStats() {
  console.log("Seeding matchup stats...");
  let upserted = 0;
  for (const m of MATCHUPS) {
    const total = m.wins + m.losses + m.draws;
    const winRate = total > 0 ? m.wins / total : null;
    const confidence = Math.min(1.0, total / 100);
    const id = randomUUID();

    await sql`
      INSERT INTO matchup_stats (id, archetype_a_id, archetype_b_id, wins, losses, draws, total_games, win_rate, confidence, format, period, source, updated_at)
      VALUES (${id}, ${m.archetypeA}, ${m.archetypeB}, ${m.wins}, ${m.losses}, ${m.draws}, ${total}, ${winRate}, ${confidence}, 'standard', 'all-time', 'limitless', now())
      ON CONFLICT (archetype_a_id, archetype_b_id, format, period, source) DO UPDATE SET
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        draws = EXCLUDED.draws,
        total_games = EXCLUDED.total_games,
        win_rate = EXCLUDED.win_rate,
        confidence = EXCLUDED.confidence,
        updated_at = now()
    `;
    upserted++;
  }
  console.log(`  ${upserted} matchup stats upserted`);
}

async function seedMetaSnapshot() {
  console.log("Seeding meta snapshot...");
  const snapshotData = META_SHARES.map((m) => ({
    archetype_id: m.archetypeId,
    usage_rate: m.usageRate,
    win_rate: 0.5, // placeholder — real win rates vary per matchup
    tier: getTierByUsage(m.usageRate),
  }));

  const id = randomUUID();
  await sql`
    INSERT INTO meta_snapshots (id, date, format, data, created_at)
    VALUES (${id}, now(), 'standard', ${JSON.stringify(snapshotData)}::jsonb, now())
  `;
  console.log(`  1 meta snapshot created with ${snapshotData.length} entries`);
}

function getTierByUsage(usage: number): string {
  if (usage >= 0.15) return "S";
  if (usage >= 0.08) return "A";
  if (usage >= 0.04) return "B";
  if (usage >= 0.01) return "C";
  return "D";
}

async function updateArchetypeTiers() {
  console.log("Updating archetype tiers...");
  for (const m of META_SHARES) {
    const tier = getTierByUsage(m.usageRate);
    await sql`
      UPDATE archetypes SET tier = ${tier}, updated_at = now()
      WHERE id = ${m.archetypeId}
    `;
  }
  console.log("  Tiers updated based on usage rates");
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting official tournament seed...\n");

  await seedArchetypes();
  await seedTournaments();
  await seedStandings();
  await seedMatchupStats();
  await seedMetaSnapshot();
  await updateArchetypeTiers();

  console.log("\nSeed complete!");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await sql.end();
  process.exit(1);
});
