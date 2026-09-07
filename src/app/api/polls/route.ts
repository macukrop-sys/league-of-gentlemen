import { NextResponse } from "next/server";
import { getLeague } from "@/lib/data/provider";
import { getPollsForWeek } from "@/lib/polls/matchupPolls";
import { getPollResults, isKvConfigured } from "@/lib/polls/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const league = await getLeague();
  const { searchParams } = new URL(request.url);

  const requestedWeek = Number(searchParams.get("week"));
  const week =
    Number.isInteger(requestedWeek) && requestedWeek >= 1 && requestedWeek <= league.settings.regularSeasonWeeks
      ? requestedWeek
      : league.settings.currentWeek;

  const voterId = searchParams.get("voterId");
  const polls = getPollsForWeek(league, week);
  const results = await Promise.all(polls.map((poll) => getPollResults(poll, voterId)));

  return NextResponse.json({ configured: isKvConfigured(), week, results });
}
