import PQueue from "p-queue";
import {
  limitlessTournamentSchema,
  limitlessStandingSchema,
  limitlessPairingSchema,
  type LimitlessTournament,
  type LimitlessStanding,
  type LimitlessPairing,
} from "./schemas";

const BASE_URL = process.env.LIMITLESS_API_BASE_URL || "https://play.limitlesstcg.com/api";
const API_KEY = process.env.LIMITLESS_API_KEY;

const queue = new PQueue({ concurrency: 2, interval: 1000, intervalCap: 2 });

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) {
    headers["X-Access-Key"] = API_KEY;
  }
  return headers;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, { headers: buildHeaders() });

    if (response.ok) return response;

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    if (attempt === retries - 1) {
      throw new Error(`Limitless API error: ${response.status} ${response.statusText} for ${url}`);
    }

    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
  }

  throw new Error("Exhausted retries");
}

export async function fetchTournaments(
  format?: string,
  limit = 50,
  page = 1
): Promise<LimitlessTournament[]> {
  return queue.add(async () => {
    const params = new URLSearchParams({ game: "PTCG", limit: String(limit), page: String(page) });
    if (format) params.set("format", format.toUpperCase());

    const response = await fetchWithRetry(`${BASE_URL}/tournaments?${params}`);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data
      .map((item: unknown) => {
        const parsed = limitlessTournamentSchema.safeParse(item);
        return parsed.success ? parsed.data : null;
      })
      .filter((t): t is LimitlessTournament => t !== null);
  }) as Promise<LimitlessTournament[]>;
}

export async function fetchStandings(tournamentId: string): Promise<LimitlessStanding[]> {
  return queue.add(async () => {
    const response = await fetchWithRetry(`${BASE_URL}/tournaments/${tournamentId}/standings`);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data
      .map((item: unknown) => {
        const parsed = limitlessStandingSchema.safeParse(item);
        return parsed.success ? parsed.data : null;
      })
      .filter((s): s is LimitlessStanding => s !== null);
  }) as Promise<LimitlessStanding[]>;
}

export async function fetchTournamentById(tournamentId: string): Promise<LimitlessTournament | null> {
  return queue.add(async () => {
    const response = await fetchWithRetry(`${BASE_URL}/tournaments/${tournamentId}`);
    const data = await response.json();

    const parsed = limitlessTournamentSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  }) as Promise<LimitlessTournament | null>;
}

export async function fetchPairings(tournamentId: string): Promise<LimitlessPairing[]> {
  return queue.add(async () => {
    const response = await fetchWithRetry(`${BASE_URL}/tournaments/${tournamentId}/pairings`);
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data
      .map((item: unknown) => {
        const parsed = limitlessPairingSchema.safeParse(item);
        return parsed.success ? parsed.data : null;
      })
      .filter((p): p is LimitlessPairing => p !== null);
  }) as Promise<LimitlessPairing[]>;
}
