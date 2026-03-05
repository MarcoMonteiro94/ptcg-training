/**
 * Discovers official Pokemon TCG tournaments from Limitless API.
 * Filters by player count > 200 and name patterns matching official events.
 * Run: npm run tournament:discover
 */

const BASE_URL = process.env.LIMITLESS_API_BASE_URL || "https://play.limitlesstcg.com/api";
const API_KEY = process.env.LIMITLESS_API_KEY;

const OFFICIAL_PATTERNS = [
  /regional/i,
  /international/i,
  /worlds/i,
  /world championships/i,
  /special event/i,
];

const MIN_PLAYER_COUNT = 200;

async function main() {
  console.log("Discovering official Pokemon TCG tournaments...\n");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) headers["X-Access-Key"] = API_KEY;

  const params = new URLSearchParams({
    game: "PTCG",
    limit: "100",
    page: "1",
  });

  const response = await fetch(`${BASE_URL}/tournaments?${params}`, { headers });
  if (!response.ok) {
    console.error(`API error: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    console.error("Unexpected response format");
    process.exit(1);
  }

  const candidates = data.filter((t: { name: string; players?: number }) => {
    const hasEnoughPlayers = (t.players ?? 0) >= MIN_PLAYER_COUNT;
    const matchesPattern = OFFICIAL_PATTERNS.some((p) => p.test(t.name));
    return hasEnoughPlayers || matchesPattern;
  });

  console.log(`Found ${candidates.length} potential official tournaments:\n`);
  console.log("─".repeat(100));
  console.log(
    `${"ID".padEnd(40)} ${"Name".padEnd(40)} ${"Players".padStart(8)} ${"Date".padStart(12)}`
  );
  console.log("─".repeat(100));

  for (const t of candidates) {
    const tier = inferTier(t.name);
    console.log(
      `${String(t.id).padEnd(40)} ${String(t.name).slice(0, 38).padEnd(40)} ${String(t.players ?? "?").padStart(8)} ${String(t.date).padStart(12)}  [${tier}]`
    );
  }

  console.log("\n─".repeat(100));
  console.log("\nCopy-paste format for official-tournaments.ts:\n");

  for (const t of candidates) {
    const tier = inferTier(t.name);
    console.log(
      `  { limitlessId: "${t.id}", name: "${t.name}", tier: "${tier}", date: "${t.date}" },`
    );
  }
}

function inferTier(name: string): string {
  if (/worlds|world championships/i.test(name)) return "major";
  if (/international/i.test(name)) return "international";
  if (/regional/i.test(name)) return "regional";
  return "regional";
}

main().catch(console.error);
