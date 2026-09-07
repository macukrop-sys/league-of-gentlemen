import type { League, PowerRanking } from "@/lib/types";
import { computeAllPlayStats } from "./allPlay";

const WEIGHTS = {
  pointsFor: 0.35,
  allPlay: 0.4,
  rosterStrength: 0.25,
};

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 1e-9) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

function rosterStrength(league: League, teamId: string): number {
  const roster = league.rosters[teamId];
  if (!roster) return 0;
  return roster.starters.reduce((sum, slot) => {
    if (!slot.playerId) return sum;
    return sum + (roster.players[slot.playerId]?.projectedPoints ?? 0);
  }, 0);
}

/**
 * Power Rankings blend three signals so a team can't game the ranking by
 * being strong in only one dimension:
 *  - Points For (35%): season scoring output, min-max normalized across the league.
 *  - All-Play win% (40%): schedule-independent strength — the best proxy we
 *    have for "how good is this team's roster on paper each week."
 *  - Roster Strength (25%): sum of this week's starting lineup's projected
 *    points, i.e. is the roster currently healthy/well-constructed.
 *
 * `throughWeek` lets the same function compute a prior week's snapshot
 * (dropping the most recent completed week) so the UI can show a trend
 * arrow; roster strength has no historical snapshot available so it's held
 * constant across the two computations — documented simplification.
 */
export function computePowerRankings(league: League, throughWeek = league.settings.currentWeek - 1): PowerRanking[] {
  const teams = league.teams;
  const pointsFor = teams.map((t) => t.scoreHistory.slice(0, throughWeek).reduce((s, v) => s + v, 0));
  const { records } = computeAllPlayStats(
    teams.map((t) => ({ teamId: t.id, scoreHistory: t.scoreHistory })),
    throughWeek,
  );
  const allPlayByTeam = new Map(records.map((r) => [r.teamId, r.winPct]));
  const strength = teams.map((t) => rosterStrength(league, t.id));

  const normPF = normalize(pointsFor);
  const normAllPlay = normalize(teams.map((t) => allPlayByTeam.get(t.id) ?? 0));
  const normStrength = normalize(strength);

  const scored = teams.map((t, i) => {
    const pointsForScore = normPF[i]!;
    const allPlayScore = normAllPlay[i]!;
    const rosterStrengthScore = normStrength[i]!;
    const score =
      (pointsForScore * WEIGHTS.pointsFor + allPlayScore * WEIGHTS.allPlay + rosterStrengthScore * WEIGHTS.rosterStrength) * 100;
    return { teamId: t.id, score, components: { pointsForScore, allPlayScore, rosterStrengthScore } };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s, i) => ({ ...s, rank: i + 1, score: +s.score.toFixed(1), trend: 0 }));
}

/** Current power rankings with a week-over-week trend arrow (+ up, - down). */
export function computePowerRankingsWithTrend(league: League): PowerRanking[] {
  const current = computePowerRankings(league, league.settings.currentWeek - 1);
  const prevWeek = Math.max(1, league.settings.currentWeek - 2);
  const previous = league.settings.currentWeek > 2 ? computePowerRankings(league, prevWeek) : current;
  const prevRankByTeam = new Map(previous.map((p) => [p.teamId, p.rank]));

  return current.map((c) => {
    const prevRank = prevRankByTeam.get(c.teamId) ?? c.rank;
    return { ...c, trend: prevRank - c.rank };
  });
}
