import * as cheerio from "cheerio";

export interface TrainerHillMatchup {
  archetypeA: string;
  archetypeB: string;
  winRate: number;
  totalGames: number;
}

export interface TrainerHillMetaEntry {
  archetype: string;
  usageRate: number;
  winRate: number;
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Pokemon-TCG-Trainer/1.0",
          Accept: "text/html",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
  throw new Error("Exhausted retries");
}

export async function scrapeMetaData(): Promise<TrainerHillMetaEntry[]> {
  const html = await fetchWithRetry("https://trainerhill.com/meta");
  const $ = cheerio.load(html);
  const entries: TrainerHillMetaEntry[] = [];

  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 3) {
      const archetype = $(cells[0]).text().trim();
      const usageRate = parseFloat($(cells[1]).text().replace("%", "")) / 100;
      const winRate = parseFloat($(cells[2]).text().replace("%", "")) / 100;

      if (archetype && !isNaN(usageRate) && !isNaN(winRate)) {
        entries.push({ archetype, usageRate, winRate });
      }
    }
  });

  return entries;
}

export async function scrapeMatchupData(): Promise<TrainerHillMatchup[]> {
  const html = await fetchWithRetry("https://trainerhill.com/matchups");
  const $ = cheerio.load(html);
  const matchups: TrainerHillMatchup[] = [];

  const archetypeNames: string[] = [];
  $("table thead th").each((i, th) => {
    if (i > 0) archetypeNames.push($(th).text().trim());
  });

  $("table tbody tr").each((rowIdx, row) => {
    const rowArchetype = $(row).find("td").first().text().trim();
    $(row)
      .find("td")
      .each((colIdx, cell) => {
        if (colIdx === 0) return;
        const text = $(cell).text().trim();
        const winRate = parseFloat(text.replace("%", ""));
        if (!isNaN(winRate) && archetypeNames[colIdx - 1]) {
          matchups.push({
            archetypeA: rowArchetype,
            archetypeB: archetypeNames[colIdx - 1],
            winRate: winRate / 100,
            totalGames: 0,
          });
        }
      });
  });

  return matchups;
}
