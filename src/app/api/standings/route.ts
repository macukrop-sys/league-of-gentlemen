import { NextResponse } from "next/server";
import { getLeague } from "@/lib/data/provider";
import { computeStandings, computeDivisionStandings } from "@/lib/stats/standings";
import { computeAllPlayStats } from "@/lib/stats/allPlay";
import { computePowerRankingsWithTrend } from "@/lib/stats/powerRankings";
import { computeLuckIndex } from "@/lib/stats/luckIndex";

export const dynamic = "force-dynamic";

export async function GET() {
  const league = await getLeague();
  const throughWeek = league.settings.currentWeek - 1;

  const allPlay = computeAllPlayStats(
    league.teams.map((t) => ({ teamId: t.id, scoreHistory: t.scoreHistory })),
    throughWeek,
  );

  return NextResponse.json({
    settings: league.settings,
    teams: league.teams,
    standings: computeStandings(league),
    divisionStandings: computeDivisionStandings(league),
    allPlay: allPlay.records,
    powerRankings: computePowerRankingsWithTrend(league),
    luckIndex: computeLuckIndex(league),
  });
}
