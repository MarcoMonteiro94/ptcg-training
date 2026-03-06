/**
 * Maps archetype identifiers to their primary Pokemon sprite URLs
 * from limitlesstcg's R2 CDN.
 *
 * Pattern: https://r2.limitlesstcg.net/pokemon/gen9/{pokemon-name}.png
 */

const BASE = "https://r2.limitlesstcg.net/pokemon/gen9";

/**
 * Maps an archetype ID to an array of Pokemon image URLs.
 * Multi-Pokemon archetypes return multiple images.
 */
const ARCHETYPE_IMAGES: Record<string, string[]> = {
  // S/A tier
  "dragapult-charizard": [`${BASE}/dragapult.png`, `${BASE}/charizard.png`],
  "raging-bolt-ogerpon": [`${BASE}/raging-bolt.png`, `${BASE}/ogerpon.png`],
  "gardevoir": [`${BASE}/gardevoir.png`],
  "gardevoir-ex-sv": [`${BASE}/gardevoir.png`],
  "gardevoir-jellicent": [`${BASE}/gardevoir.png`, `${BASE}/jellicent.png`],
  "dragapult": [`${BASE}/dragapult.png`],
  "dragapult-dusknoir": [`${BASE}/dragapult.png`, `${BASE}/dusknoir.png`],
  "dragapult-blaziken": [`${BASE}/dragapult.png`, `${BASE}/blaziken.png`],
  "conkeldurr": [`${BASE}/conkeldurr.png`],
  "ns-zoroark": [`${BASE}/zoroark.png`],
  "n-zoroark": [`${BASE}/zoroark.png`],
  "mega-absol-box": [`${BASE}/absol-mega.png`],
  "grimmsnarl-froslass": [`${BASE}/grimmsnarl.png`, `${BASE}/froslass.png`],
  "ogerpon-meganium": [`${BASE}/ogerpon.png`, `${BASE}/meganium.png`],
  "charizard-pidgeot": [`${BASE}/charizard.png`, `${BASE}/pidgeot.png`],
  "charizard-noctowl": [`${BASE}/charizard.png`, `${BASE}/noctowl.png`],
  "alakazam": [`${BASE}/alakazam.png`],
  "alakazam-dudunsparce": [`${BASE}/alakazam.png`, `${BASE}/dudunsparce.png`],
  "cynthias-garchomp": [`${BASE}/garchomp.png`],
  "greninja-blaziken": [`${BASE}/greninja.png`, `${BASE}/blaziken.png`],
  "greninja": [`${BASE}/greninja.png`],
  "greninja-ex": [`${BASE}/greninja.png`],
  "crustle": [`${BASE}/crustle.png`],
  "crustle-dri": [`${BASE}/crustle.png`],
  "lucario-hariyama": [`${BASE}/lucario.png`, `${BASE}/hariyama.png`],
  "ethans-typhlosion": [`${BASE}/typhlosion.png`],
  "ho-oh-armarouge": [`${BASE}/ho-oh.png`, `${BASE}/armarouge.png`],
  "hydreigon": [`${BASE}/hydreigon.png`],
  "gholdengo-lunatone": [`${BASE}/gholdengo.png`, `${BASE}/lunatone.png`],
  "hops-zacian": [`${BASE}/zacian-crowned.png`],
  "marnies-grimmsnarl": [`${BASE}/grimmsnarl.png`],
  "mega-lucario": [`${BASE}/lucario-mega.png`],

  // Additional archetypes from tournaments
  "joltik-box": [`${BASE}/joltik.png`],
  "ceruledge-ex": [`${BASE}/ceruledge.png`],
  "kangaskhan-bouffalant": [`${BASE}/kangaskhan.png`, `${BASE}/bouffalant.png`],
  "flareon-noctowl": [`${BASE}/flareon.png`, `${BASE}/noctowl.png`],
  "tera-box": [`${BASE}/terapagos.png`],
  "froslass-munkidori": [`${BASE}/froslass.png`, `${BASE}/munkidori.png`],
  "mega-venusaur-ex": [`${BASE}/venusaur-mega.png`],
  "slowking-scr": [`${BASE}/slowking.png`],
  "pidgeot-control": [`${BASE}/pidgeot.png`],
  "iron-hands-magneton": [`${BASE}/iron-hands.png`, `${BASE}/magneton.png`],
  "lopunny-dusknoir": [`${BASE}/lopunny.png`, `${BASE}/dusknoir.png`],
};

export function getArchetypeImages(archetypeId: string): string[] {
  return ARCHETYPE_IMAGES[archetypeId] ?? [];
}

/** Legacy single-image helper — returns first image */
export function getArchetypeImageUrl(archetypeId: string): string | null {
  return ARCHETYPE_IMAGES[archetypeId]?.[0] ?? null;
}

/**
 * Tries to construct a pokemon sprite URL from a card/pokemon name.
 * Handles "ex", "'s" prefixes, and other TCG naming quirks.
 */
export function getPokemonImageUrl(name: string): string {
  // Handle multi-Pokemon archetype names like "Dragapult/Charizard"
  const firstName = name.split("/")[0].trim();
  const cleaned = firstName
    .toLowerCase()
    .replace(/\s+ex$/i, "")
    .replace(/^.+'s\s+/i, "") // "Marnie's Grimmsnarl" → "grimmsnarl"
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `${BASE}/${cleaned}.png`;
}
