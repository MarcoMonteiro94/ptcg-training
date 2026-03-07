/**
 * Maps card names to Limitless TCG CDN card image URLs.
 *
 * CDN pattern: https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/{SET}/{SET}_{NUM}_R_EN_LG.png
 *
 * All mappings verified against actual Limitless TCG card pages and decklists.
 */

const BASE = "https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci";

function cardUrl(set: string, num: number): string {
  return `${BASE}/${set}/${set}_${String(num).padStart(3, "0")}_R_EN_LG.png`;
}

/** Set code + card number for each card name */
const CARD_DATA: Record<string, string> = {
  // --- Pokemon: Dragapult line ---
  "Dreepy": cardUrl("TWM", 128),
  "Drakloak": cardUrl("TWM", 129),
  "Dragapult ex": cardUrl("TWM", 130),

  // --- Pokemon: Charizard line ---
  "Charmander": cardUrl("PAF", 7),
  "Charmeleon": cardUrl("PFL", 12),
  "Charizard ex": cardUrl("OBF", 125),

  // --- Pokemon: Dusknoir line ---
  "Duskull": cardUrl("PRE", 35),
  "Dusclops": cardUrl("PRE", 36),
  "Dusknoir": cardUrl("PRE", 37),

  // --- Pokemon: Gardevoir line ---
  "Ralts": cardUrl("MEG", 58),
  "Kirlia": cardUrl("MEG", 59),
  "Gardevoir ex": cardUrl("SVI", 86),

  // --- Pokemon: Pidgeot line ---
  "Pidgey": cardUrl("MEW", 16),
  "Pidgeotto": cardUrl("MEW", 17),
  "Pidgeot ex": cardUrl("OBF", 164),

  // --- Pokemon: Alakazam line ---
  "Abra": cardUrl("MEG", 54),
  "Kadabra": cardUrl("MEG", 55),
  "Alakazam ex": cardUrl("MEW", 65),

  // --- Pokemon: Greninja line ---
  "Froakie": cardUrl("OBF", 56),
  "Frogadier": cardUrl("TWM", 57),
  "Greninja ex": cardUrl("TWM", 106),

  // --- Pokemon: Blaziken line ---
  "Torchic": cardUrl("DRI", 40),
  "Combusken": cardUrl("DRI", 41),
  "Blaziken": cardUrl("DRI", 42),

  // --- Pokemon: Conkeldurr line ---
  "Timburr": cardUrl("BLK", 47),
  "Gurdurr": cardUrl("BLK", 48),
  "Conkeldurr": cardUrl("TWM", 105),

  // --- Pokemon: Hydreigon line ---
  "Deino": cardUrl("WHT", 65),
  "Zweilous": cardUrl("WHT", 66),
  "Hydreigon ex": cardUrl("WHT", 67),

  // --- Pokemon: Crustle line ---
  "Dwebble": cardUrl("DRI", 11),
  "Crustle": cardUrl("DRI", 12),

  // --- Pokemon: Lucario line ---
  "Riolu": cardUrl("MEG", 76),
  "Lucario": cardUrl("SVI", 114),
  "Mega Lucario ex": cardUrl("MEG", 77),

  // --- Pokemon: Hariyama line ---
  "Makuhita": cardUrl("MEG", 72),
  "Hariyama": cardUrl("MEG", 73),

  // --- Pokemon: Ogerpon ---
  "Teal Mask Ogerpon ex": cardUrl("TWM", 25),

  // --- Pokemon: Meganium line ---
  "Chikorita": cardUrl("MEG", 8),
  "Bayleef": cardUrl("MEG", 9),
  "Meganium": cardUrl("MEG", 10),

  // --- Pokemon: Raging Bolt ---
  "Raging Bolt": cardUrl("SCR", 111),
  "Raging Bolt ex": cardUrl("TEF", 123),

  // --- Pokemon: Gholdengo line ---
  "Gimmighoul": cardUrl("SSP", 97),
  "Gholdengo ex": cardUrl("PAR", 139),

  // --- Pokemon: N's Zoroark line ---
  "N's Zorua": cardUrl("JTG", 97),
  "N's Zoroark": cardUrl("JTG", 98),

  // --- Pokemon: Marnie's Grimmsnarl line ---
  "Marnie's Impidimp": cardUrl("DRI", 134),
  "Marnie's Morgrem": cardUrl("DRI", 135),
  "Marnie's Grimmsnarl ex": cardUrl("DRI", 136),

  // --- Pokemon: Cynthia's Garchomp line ---
  "Cynthia's Gible": cardUrl("DRI", 102),
  "Cynthia's Gabite": cardUrl("DRI", 103),
  "Cynthia's Garchomp ex": cardUrl("DRI", 104),

  // --- Pokemon: Ethan's Typhlosion line ---
  "Ethan's Cyndaquil": cardUrl("DRI", 32),
  "Ethan's Quilava": cardUrl("DRI", 33),
  "Ethan's Typhlosion ex": cardUrl("DRI", 34),

  // --- Pokemon: Hop's Zacian ---
  "Hop's Zacian V": cardUrl("JTG", 111),
  "Hop's Cramorant": cardUrl("JTG", 138),

  // --- Pokemon: Froslass line ---
  "Snorunt": cardUrl("TWM", 51),
  "Froslass": cardUrl("TWM", 53),

  // --- Pokemon: Jellicent ---
  "Frillish": cardUrl("WHT", 44),
  "Jellicent": cardUrl("WHT", 45),

  // --- Pokemon: Ho-Oh + Armarouge ---
  "Ho-Oh ex": cardUrl("DRI", 39),
  "Charcadet": cardUrl("PFL", 19),
  "Armarouge": cardUrl("SVI", 41),

  // --- Pokemon: Other notable Pokemon ---
  "Fezandipiti ex": cardUrl("ASC", 142),
  "Munkidori": cardUrl("TWM", 95),
  "Bloodmoon Ursaluna ex": cardUrl("TWM", 141),
  "Mew ex": cardUrl("MEW", 151),
  "Latias ex": cardUrl("SSP", 76),
  "Iron Leaves ex": cardUrl("TEF", 25),
  "Squawkabilly ex": cardUrl("PAL", 169),
  "Ditto": cardUrl("MEW", 132),
  "Klefki": cardUrl("SVI", 96),
  "Fan Rotom": cardUrl("SCR", 118),
  "Budew": cardUrl("ASC", 16),
  "Hawlucha": cardUrl("SVI", 118),
  "Scream Tail": cardUrl("PAR", 86),
  "Hoothoot": cardUrl("SCR", 114),
  "Noctowl": cardUrl("SCR", 115),
  "Slither Wing": cardUrl("SFA", 26),
  "Terapagos ex": cardUrl("SCR", 128),
  "Entei V": cardUrl("BRS", 22),
  "Moltres": cardUrl("PFL", 14),
  "Lunatone": cardUrl("MEG", 74),
  "Solrock": cardUrl("MEG", 75),
  "Yveltal": cardUrl("MEG", 88),
  "Pecharunt ex": cardUrl("SFA", 39),
  "Mega Absol ex": cardUrl("MEG", 86),
  "Mega Kangaskhan ex": cardUrl("MEG", 104),
  "Mega Mawile ex": cardUrl("MEG", 94),
  "Genesect": cardUrl("SFA", 40),
  "Genesect ex": cardUrl("BLK", 67),
  "Psyduck": cardUrl("ASC", 39),
  "Shaymin": cardUrl("DRI", 10),
  "Lillie's Clefairy ex": cardUrl("JTG", 56),
  "Toedscool": cardUrl("PAR", 16),
  "Toedscruel": cardUrl("PAR", 17),
  "Chi-Yu": cardUrl("PAR", 29),
  "N's Zoroark ex": cardUrl("JTG", 98),
  "N's Darumaka": cardUrl("JTG", 26),
  "N's Darmanitan": cardUrl("JTG", 27),
  "N's Reshiram": cardUrl("JTG", 116),
  "Wellspring Mask Ogerpon ex": cardUrl("TWM", 64),

  // --- Supporters ---
  "Iono": cardUrl("PAL", 185),
  "Boss's Orders": cardUrl("MEG", 114),
  "Lillie's Determination": cardUrl("MEG", 119),
  "Professor's Research": cardUrl("JTG", 155),
  "Arven": cardUrl("OBF", 186),
  "Professor Sada's Vitality": cardUrl("PAR", 170),
  "Professor Turo's Scenario": cardUrl("PAR", 171),
  "Crispin": cardUrl("SCR", 133),
  "Judge": cardUrl("DRI", 167),
  "Penny": cardUrl("SVI", 183),
  "Dawn": cardUrl("PFL", 87),
  "Briar": cardUrl("SCR", 132),
  "Hilda": cardUrl("WHT", 84),
  "Cynthia's Ambition": cardUrl("BRS", 138),
  "Ethan's Adventure": cardUrl("DRI", 165),
  "Hop": cardUrl("SSH", 165),
  "Korrina": cardUrl("FFI", 95),
  "Erika's Invitation": cardUrl("MEW", 160),
  "Ciphermaniac's Codebreaking": cardUrl("TEF", 145),
  "Cyrano": cardUrl("SSP", 170),
  "Black Belt's Training": cardUrl("JTG", 143),
  "Xerosic's Machinations": cardUrl("SFA", 64),
  "Acerola's Mischief": cardUrl("MEG", 113),

  // --- Items ---
  "Ultra Ball": cardUrl("MEG", 131),
  "Nest Ball": cardUrl("SVI", 181),
  "Buddy-Buddy Poffin": cardUrl("TEF", 144),
  "Rare Candy": cardUrl("MEG", 125),
  "Night Stretcher": cardUrl("ASC", 196),
  "Counter Catcher": cardUrl("PAR", 160),
  "Super Rod": cardUrl("PAL", 188),
  "Secret Box": cardUrl("TWM", 163),
  "Earthen Vessel": cardUrl("PAR", 163),
  "Prime Catcher": cardUrl("TEF", 157),
  "Energy Switch": cardUrl("MEG", 115),
  "Energy Retrieval": cardUrl("SVI", 171),
  "Pokegear 3.0": cardUrl("SVI", 186),
  "Precious Trolley": cardUrl("SSP", 185),
  "Superior Energy Retrieval": cardUrl("PAL", 189),
  "Fighting Gong": cardUrl("MEG", 116),
  "Air Balloon": cardUrl("ASC", 181),
  "Unfair Stamp": cardUrl("TWM", 165),
  "N's PP Up": cardUrl("JTG", 153),
  "Pal Pad": cardUrl("SVI", 182),
  "Powerglass": cardUrl("SFA", 63),
  "Jumbo Ice Cream": cardUrl("PFL", 91),
  "Enhanced Hammer": cardUrl("TWM", 148),

  // --- Pokemon Tools ---
  "Bravery Charm": cardUrl("PAL", 173),
  "Luxurious Cape": cardUrl("PAR", 166),
  "Vitality Band": cardUrl("SVI", 197),

  // --- Technical Machines ---
  "Technical Machine: Evolution": cardUrl("PAR", 178),
  "Technical Machine: Devolution": cardUrl("PAR", 177),
  "Technical Machine: Turbo Energize": cardUrl("PAR", 179),

  // --- Stadiums ---
  "Jamming Tower": cardUrl("TWM", 153),
  "Artazon": cardUrl("PAL", 171),
  "Area Zero Underdepths": cardUrl("SCR", 131),
  "Battle Cage": cardUrl("PFL", 85),
  "Spikemuth Gym": cardUrl("DRI", 169),
  "Magma Basin": cardUrl("BRS", 144),
  "Town Store": cardUrl("OBF", 196),
  "Team Rocket's Watchtower": cardUrl("DRI", 180),
  "N's Castle": cardUrl("JTG", 152),
  "Lively Stadium": cardUrl("SSP", 180),

  // --- Energy ---
  "Fire Energy": cardUrl("MEE", 2),
  "Psychic Energy": cardUrl("MEE", 5),
  "Luminous Energy": cardUrl("PAL", 191),
  "Neo Upper Energy": cardUrl("TEF", 162),
  "Grass Energy": cardUrl("MEE", 1),
  "Lightning Energy": cardUrl("MEE", 4),
  "Fighting Energy": cardUrl("MEE", 6),
  "Darkness Energy": cardUrl("MEE", 7),
  "Water Energy": cardUrl("MEE", 3),
  "Metal Energy": cardUrl("MEE", 8),
  "Mist Energy": cardUrl("TEF", 161),
  "Jet Energy": cardUrl("PAL", 190),
  "Reversal Energy": cardUrl("PAL", 192),
};

/**
 * Returns the card image URL for a given card name.
 * Returns null if the card is not in our mapping.
 */
export function getCardImageUrl(cardName: string): string | null {
  return CARD_DATA[cardName] ?? null;
}

/**
 * Returns the high-resolution card image URL.
 * (Limitless CDN LG size is already high-res)
 */
export function getCardImageUrlHires(cardName: string): string | null {
  return CARD_DATA[cardName] ?? null;
}

/**
 * Check if we have a card image for this name.
 */
export function hasCardImage(cardName: string): boolean {
  return cardName in CARD_DATA;
}
