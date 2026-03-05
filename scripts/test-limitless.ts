/**
 * Quick test script to validate Limitless API integration.
 * Run with: npx tsx scripts/test-limitless.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import {
  fetchTournaments,
  fetchStandings,
  fetchPairings,
} from "../src/server/services/limitless/client";

async function main() {
  console.log("=== Testing Limitless API ===\n");

  // 1. Fetch tournaments
  console.log("1. Fetching Standard tournaments...");
  const tournaments = await fetchTournaments("standard", 5);
  console.log(`   Found ${tournaments.length} tournaments:`);
  for (const t of tournaments) {
    console.log(`   - ${t.name} (${t.date}) [${t.id}] ${t.players ?? "?"} players`);
  }

  if (tournaments.length === 0) {
    console.log("\nNo tournaments found. Check API access.");
    return;
  }

  // 2. Fetch standings for first tournament
  const target = tournaments[0];
  console.log(`\n2. Fetching standings for: ${target.name} [${target.id}]...`);
  const standings = await fetchStandings(target.id);
  console.log(`   Found ${standings.length} standings`);

  const withDecks = standings.filter((s) => s.deck);
  console.log(`   ${withDecks.length} have deck archetype info`);

  // Show top 5
  for (const s of standings.slice(0, 5)) {
    console.log(
      `   #${s.placing ?? "?"} ${s.name} - ${s.deck?.name ?? "Unknown deck"} (${s.record?.wins ?? 0}-${s.record?.losses ?? 0}-${s.record?.ties ?? 0})`
    );
  }

  // Show unique deck names
  const deckNames = new Set(withDecks.map((s) => s.deck!.name));
  console.log(`\n   Unique deck archetypes: ${deckNames.size}`);
  for (const name of [...deckNames].sort()) {
    console.log(`   - ${name}`);
  }

  // 3. Fetch pairings
  console.log(`\n3. Fetching pairings for: ${target.name}...`);
  const pairings = await fetchPairings(target.id);
  console.log(`   Found ${pairings.length} pairings`);

  if (pairings.length > 0) {
    const rounds = new Set(pairings.map((p) => p.round));
    console.log(`   Rounds: ${[...rounds].sort((a, b) => a - b).join(", ")}`);

    const withWinner = pairings.filter((p) => p.winner !== null);
    const byes = pairings.filter((p) => !p.player2);
    console.log(`   ${withWinner.length} completed, ${byes.length} byes`);

    // Show sample pairing
    const sample = pairings[0];
    console.log(`\n   Sample pairing: R${sample.round} ${sample.player1} vs ${sample.player2 ?? "BYE"} → winner: ${sample.winner}`);
  }

  // 4. Calculate matchup data
  if (pairings.length > 0 && withDecks.length > 0) {
    console.log("\n4. Calculating matchup data from pairings...");

    const playerDeckMap = new Map<string, string>();
    for (const s of standings) {
      if (s.deck) playerDeckMap.set(s.player, s.deck.name);
    }

    const matchups = new Map<string, { wins: number; losses: number; draws: number }>();
    let resolvable = 0;
    let unresolvable = 0;

    for (const p of pairings) {
      if (!p.player2) continue;

      const deckA = playerDeckMap.get(p.player1);
      const deckB = playerDeckMap.get(p.player2);

      if (!deckA || !deckB || deckA === deckB) {
        unresolvable++;
        continue;
      }

      resolvable++;
      const [first, second] = deckA < deckB ? [deckA, deckB] : [deckB, deckA];
      const key = `${first} vs ${second}`;
      const current = matchups.get(key) ?? { wins: 0, losses: 0, draws: 0 };

      if (p.winner === null || p.winner === 0) {
        current.draws++;
      } else {
        const winnerDeck = playerDeckMap.get(String(p.winner));
        if (winnerDeck === first) current.wins++;
        else current.losses++;
      }

      matchups.set(key, current);
    }

    console.log(`   Resolvable pairings: ${resolvable}/${resolvable + unresolvable}`);
    console.log(`   Unique matchups: ${matchups.size}`);

    // Show top matchups by sample size
    const sorted = [...matchups.entries()].sort(
      (a, b) => (b[1].wins + b[1].losses + b[1].draws) - (a[1].wins + a[1].losses + a[1].draws)
    );

    console.log("\n   Top matchups by sample size:");
    for (const [matchup, result] of sorted.slice(0, 10)) {
      const total = result.wins + result.losses + result.draws;
      const wr = total > 0 ? ((result.wins / total) * 100).toFixed(1) : "N/A";
      console.log(`   ${matchup}: ${result.wins}W-${result.losses}L-${result.draws}D (${wr}% WR, n=${total})`);
    }
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
