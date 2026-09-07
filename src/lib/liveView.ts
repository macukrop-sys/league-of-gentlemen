import type { League, Roster } from "@/lib/types";
import type { LiveResponse } from "@/lib/api-types";
import { computeWinProbability } from "@/lib/winProbability";
import { computeOptimalLineup } from "@/lib/optimalLineup";

/**
 * Builds the matchups/rosters/optimal-lineups view for any single week —
 * shared by the current-week live dashboard and the week-by-week box score
 * page, so they stay consistent. Win probability only makes sense for the
 * week that's actually in progress right now (a finished week's outcome is
 * already known; a future week has no roster/injury info to project from),
 * so it's only computed when `week` is the league's current week.
 */
export function buildWeekView(league: League, week: number, rosters: Record<string, Roster>): LiveResponse {
  const weekMatchups = league.matchups.filter((m) => m.week === week);
  const teamsById = new Map(league.teams.map((t) => [t.id, t]));
  const isCurrentWeek = week === league.settings.currentWeek;

  const matchups = weekMatchups.map((m) => {
    const homeRoster = rosters[m.homeTeamId];
    const awayRoster = rosters[m.awayTeamId];
    const winProbability = isCurrentWeek && homeRoster && awayRoster ? computeWinProbability(m, homeRoster, awayRoster) : null;
    return {
      week: m.week,
      homeTeam: teamsById.get(m.homeTeamId) ?? null,
      awayTeam: teamsById.get(m.awayTeamId) ?? null,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      winProbability,
    };
  });

  const optimalLineups = Object.values(rosters).map((roster) => computeOptimalLineup(roster));

  return { week, matchups, optimalLineups, rosters, teams: league.teams };
}

/** Shared by the `/api/live` route handler and any server component that wants the current week's view without a self-fetch. */
export function buildLiveView(league: League): LiveResponse {
  return buildWeekView(league, league.settings.currentWeek, league.rosters);
}
