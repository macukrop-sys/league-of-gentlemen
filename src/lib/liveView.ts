import type { League } from "@/lib/types";
import type { LiveResponse } from "@/lib/api-types";
import { computeWinProbability } from "@/lib/winProbability";
import { computeOptimalLineup } from "@/lib/optimalLineup";

/** Shared by the `/api/live` route handler and any server component that wants the same view without a self-fetch. */
export function buildLiveView(league: League): LiveResponse {
  const week = league.settings.currentWeek;
  const currentMatchups = league.matchups.filter((m) => m.week === week);
  const teamsById = new Map(league.teams.map((t) => [t.id, t]));

  const matchups = currentMatchups.map((m) => {
    const homeRoster = league.rosters[m.homeTeamId];
    const awayRoster = league.rosters[m.awayTeamId];
    const winProbability = homeRoster && awayRoster ? computeWinProbability(m, homeRoster, awayRoster) : null;
    return {
      week: m.week,
      homeTeam: teamsById.get(m.homeTeamId) ?? null,
      awayTeam: teamsById.get(m.awayTeamId) ?? null,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      winProbability,
    };
  });

  const optimalLineups = Object.values(league.rosters).map((roster) => computeOptimalLineup(roster));

  return { week, matchups, optimalLineups, rosters: league.rosters, teams: league.teams };
}
