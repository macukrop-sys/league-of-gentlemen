import type { League, StandingsRow } from "@/lib/types";

/**
 * Overall + division standings. Tiebreaker order is wins, then points for —
 * a simplification of most real leagues' fuller tiebreaker chain (which
 * typically also includes head-to-head and division record). The Playoff
 * Machine implements the fuller chain for seeding purposes since that's
 * where tiebreakers actually matter to the user; this view is for the
 * at-a-glance standings table.
 */
export function computeStandings(league: League): StandingsRow[] {
  const sorted = [...league.teams].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.ties !== a.ties) return b.ties - a.ties;
    return b.pointsFor - a.pointsFor;
  });

  const divisionRanks = new Map<string, number>();

  return sorted.map((team, i) => {
    const seenInDivision = (divisionRanks.get(team.divisionId) ?? 0) + 1;
    divisionRanks.set(team.divisionId, seenInDivision);
    return {
      team,
      rank: i + 1,
      divisionRank: seenInDivision,
      clinched: null,
    };
  });
}

export function computeDivisionStandings(league: League): Record<string, StandingsRow[]> {
  const overall = computeStandings(league);
  const byDivision: Record<string, StandingsRow[]> = {};
  for (const div of league.divisions) {
    byDivision[div.id] = overall
      .filter((row) => row.team.divisionId === div.id)
      .sort((a, b) => a.divisionRank - b.divisionRank);
  }
  return byDivision;
}
