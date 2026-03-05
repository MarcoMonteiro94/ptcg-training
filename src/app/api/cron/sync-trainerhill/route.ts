import { NextResponse } from "next/server";

export const maxDuration = 10;

/**
 * TrainerHill sync is disabled.
 * TrainerHill uses a Dash/Plotly app with client-side rendering,
 * so it cannot be scraped with Cheerio.
 * Matchup data is now calculated from Limitless pairings instead.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "skipped",
    reason: "TrainerHill scraping disabled — matchup data sourced from Limitless pairings",
  });
}
