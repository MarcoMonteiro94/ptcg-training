/**
 * Maps card names (as used in our decklists) to pokemontcg.io card image URLs.
 *
 * Image CDN: https://images.pokemontcg.io/{set}/{number}.png
 * High-res:  https://images.pokemontcg.io/{set}/{number}_hires.png
 *
 * Uses most recent Standard-legal printings (Scarlet & Violet era).
 */

const BASE = "https://images.pokemontcg.io";

/** Set code + card number for each card name */
const CARD_DATA: Record<string, string> = {
  // --- Pokemon: Dragapult line ---
  "Dreepy": "sv6/88",
  "Drakloak": "sv6/89",
  "Dragapult ex": "sv6/91",

  // --- Pokemon: Charizard line ---
  "Charmander": "sv3/26",
  "Charmeleon": "sv3/27",
  "Charizard ex": "sv3/54",

  // --- Pokemon: Dusknoir line ---
  "Duskull": "sv6/70",
  "Dusclops": "sv6/71",
  "Dusknoir": "sv6/72",

  // --- Pokemon: Gardevoir line ---
  "Ralts": "sv2/67",
  "Kirlia": "sv2/68",
  "Gardevoir ex": "sv2/86",

  // --- Pokemon: Pidgeot line ---
  "Pidgey": "sv3pt5/16",
  "Pidgeotto": "sv3pt5/17",
  "Pidgeot ex": "sv3pt5/54",

  // --- Pokemon: Alakazam line ---
  "Abra": "sv8/63",
  "Kadabra": "sv8/64",
  "Alakazam ex": "sv8/65",

  // --- Pokemon: Greninja line ---
  "Froakie": "sv8/36",
  "Frogadier": "sv8/37",
  "Greninja ex": "sv8/38",

  // --- Pokemon: Blaziken line ---
  "Torchic": "sv8/22",
  "Combusken": "sv8/23",
  "Blaziken": "sv8/24",

  // --- Pokemon: Conkeldurr line ---
  "Timburr": "sv8/75",
  "Gurdurr": "sv8/76",
  "Conkeldurr": "sv8/77",

  // --- Pokemon: Hydreigon line ---
  "Deino": "sv6/105",
  "Zweilous": "sv6/106",
  "Hydreigon ex": "sv6/107",

  // --- Pokemon: Crustle line ---
  "Dwebble": "sv8/80",
  "Crustle": "sv8/81",

  // --- Pokemon: Lucario line ---
  "Riolu": "sv8/72",
  "Lucario": "sv8/73",
  "Mega Lucario ex": "sv8pt5/18",

  // --- Pokemon: Hariyama line ---
  "Makuhita": "sv8/78",
  "Hariyama": "sv8/79",

  // --- Pokemon: Ogerpon ---
  "Teal Mask Ogerpon ex": "sv6/24",

  // --- Pokemon: Meganium line ---
  "Chikorita": "sv6/1",
  "Bayleef": "sv6/2",
  "Meganium": "sv6/3",

  // --- Pokemon: Raging Bolt ---
  "Raging Bolt": "sv5/52",
  "Raging Bolt ex": "sv5/123",

  // --- Pokemon: Gholdengo line ---
  "Gimmighoul": "sv3/170",
  "Gholdengo ex": "sv3/184",

  // --- Pokemon: N's Zoroark line ---
  "N's Zorua": "sv8pt5/38",
  "N's Zoroark": "sv8pt5/39",

  // --- Pokemon: Marnie's Grimmsnarl line ---
  "Marnie's Impidimp": "sv8pt5/40",
  "Marnie's Morgrem": "sv8pt5/41",
  "Marnie's Grimmsnarl ex": "sv8pt5/42",

  // --- Pokemon: Cynthia's Garchomp line ---
  "Cynthia's Gible": "sv8pt5/26",
  "Cynthia's Gabite": "sv8pt5/27",
  "Cynthia's Garchomp ex": "sv8pt5/28",

  // --- Pokemon: Ethan's Typhlosion line ---
  "Ethan's Cyndaquil": "sv8pt5/4",
  "Ethan's Quilava": "sv8pt5/5",
  "Ethan's Typhlosion ex": "sv8pt5/6",

  // --- Pokemon: Hop's Zacian/Zamazenta ---
  "Hop's Zacian V": "sv8pt5/55",
  "Hop's Zamazenta V": "sv8pt5/56",
  "Hop's Cramorant": "sv8pt5/10",

  // --- Pokemon: Froslass line ---
  "Snorunt": "sv5/38",
  "Froslass": "sv5/39",

  // --- Pokemon: Jellicent ---
  "Frillish": "sv6/69",
  "Jellicent": "sv6/70",

  // --- Pokemon: Ho-Oh + Armarouge ---
  "Ho-Oh ex": "sv8/21",
  "Charcadet": "sv3/38",
  "Armarouge": "sv3/41",

  // --- Pokemon: Other notable Pokemon ---
  "Fezandipiti ex": "sv5/92",
  "Munkidori": "sv5/95",
  "Bloodmoon Ursaluna ex": "sv6/141",
  "Mew ex": "sv3pt5/51",
  "Latias ex": "sv5/108",
  "Iron Leaves ex": "sv5/123",
  "Squawkabilly ex": "sv2/169",
  "Ditto": "sv4/132",
  "Klefki": "sv4/96",
  "Fan Rotom": "sv5/31",
  "Budew": "sv6/14",
  "Hawlucha": "sv3/118",
  "Scream Tail": "sv4/86",
  "Hoothoot": "sv6/128",
  "Noctowl": "sv6/129",
  "Slither Wing": "sv4/107",
  "Terapagos ex": "sv7/167",
  "Entei V": "sv3/22",
  "Moltres": "sv6/30",
  "Lunatone": "sv3/72",
  "Solrock": "sv3/105",
  "Yveltal": "sv4/113",
  "Pecharunt ex": "sv6pt5/39",
  "Mega Absol ex": "sv8pt5/43",
  "Mega Kangaskhan ex": "sv8pt5/49",
  "Mega Mawile ex": "sv8pt5/50",
  "Genesect": "sv6/103",
  "Genesect ex": "sv6/104",
  "Psyduck": "sv3/55",
  "Shaymin": "sv5/15",
  "Lillie's Clefairy ex": "sv8pt5/34",

  // --- Supporters ---
  "Iono": "sv2/185",
  "Boss's Orders": "sv2/172",
  "Lillie's Determination": "sv8/171",
  "Professor's Research": "sv1/190",
  "Arven": "sv1/166",
  "Professor Sada's Vitality": "sv4/170",
  "Professor Turo's Scenario": "sv4/171",
  "Crispin": "sv6/145",
  "Judge": "sv1/176",
  "Penny": "sv1/183",
  "Dawn": "sv7/155",
  "Briar": "sv7/151",
  "Hilda": "sv8/163",
  "Cynthia's Ambition": "sv8pt5/60",
  "Ethan's Earnestness": "sv8pt5/58",
  "Hop": "sv8pt5/62",
  "Korrina": "sv8pt5/63",
  "Erika's Invitation": "sv8pt5/57",
  "Ciphermaniac's Codebreaking": "sv6/146",

  // --- Items ---
  "Ultra Ball": "sv1/196",
  "Nest Ball": "sv1/181",
  "Buddy-Buddy Poffin": "sv4/144",
  "Rare Candy": "sv1/191",
  "Night Stretcher": "sv6/152",
  "Counter Catcher": "sv4/148",
  "Super Rod": "sv2/188",
  "Secret Box": "sv6/153",
  "Earthen Vessel": "sv5/163",
  "Prime Catcher": "sv6/157",
  "Energy Switch": "sv1/173",
  "Energy Retrieval": "sv1/171",
  "Pokegear 3.0": "sv1/186",
  "Precious Trolley": "sv6pt5/47",
  "Superior Energy Retrieval": "sv3/189",
  "Fighting Gong": "sv3/165",
  "Air Balloon": "sv4/138",

  // --- Pokemon Tools ---
  "Bravery Charm": "sv5/154",
  "Luxurious Cape": "sv6/150",
  "Vitality Band": "sv1/197",

  // --- Technical Machines ---
  "Technical Machine: Evolution": "sv4/178",
  "Technical Machine: Devolution": "sv4/177",
  "Technical Machine: Turbo Energize": "sv6pt5/48",

  // --- Stadiums ---
  "Jamming Tower": "sv5/165",
  "Artazon": "sv2/171",
  "Area Zero Underdepths": "sv5/152",
  "Battle Cage": "sv6pt5/43",
  "Spikemuth Gym": "sv8pt5/67",
  "Magma Basin": "sv3/185",
  "Town Store": "sv6pt5/49",
  "Team Rocket's Watchtower": "sv8pt5/68",

  // --- Energy ---
  "Fire Energy": "sve/2",
  "Psychic Energy": "sve/5",
  "Luminous Energy": "sv4/191",
  "Neo Upper Energy": "sv8/167",
  "Grass Energy": "sve/1",
  "Lightning Energy": "sve/4",
  "Fighting Energy": "sve/6",
  "Darkness Energy": "sve/7",
  "Water Energy": "sve/3",
  "Metal Energy": "sve/8",
  "Mist Energy": "sv5/161",
  "Jet Energy": "sv2/190",
};

/**
 * Returns the card image URL for a given card name.
 * Returns null if the card is not in our mapping.
 */
export function getCardImageUrl(cardName: string): string | null {
  const data = CARD_DATA[cardName];
  if (!data) return null;
  return `${BASE}/${data}.png`;
}

/**
 * Returns the high-resolution card image URL.
 */
export function getCardImageUrlHires(cardName: string): string | null {
  const data = CARD_DATA[cardName];
  if (!data) return null;
  return `${BASE}/${data}_hires.png`;
}

/**
 * Check if we have a card image for this name.
 */
export function hasCardImage(cardName: string): boolean {
  return cardName in CARD_DATA;
}
