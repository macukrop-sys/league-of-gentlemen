import type { League } from "@/lib/types";
import { rankTeams, type TrialMatchupResult, type TrialTeamStat } from "./tiebreakers";

/** Everything `resolveScenario` needs — deliberately omits `rosters` so the Playoff Machine's client bundle stays light. */
export type LeagueForScenario = Pick<League, "settings" | "teams" | "divisions" | "matchups">;

export interface ScenarioSeed {
  teamId: string;
  seed: number | null; // null = misses the playoffs under this scenario
  isDivisionWinner: boolean;
  hasBye: boolean;
}

export interface ScenarioResult {
  order: string[];
  seeds: ScenarioSeed[];
  statsByTeam: Map<string, TrialTeamStat>;
}

function teamAverage(scoreHistory: number[]): number {
  const scores = scoreHistory.filter((s): s is number => typeof s === "number");
  if (scores.length === 0) return 110;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Key format the Playoff Machine's override map uses: `${week}:${homeTeamId}:${awayTeamId}`. */
export function matchupKey(week: number, homeTeamId: string, awayTeamId: string): string {
  return `${week}:${homeTeamId}:${awayTeamId}`;
}

/**
 * Deterministically resolves one fully-specified "what if" scenario: every
 * remaining matchup not explicitly overridden defaults to the chalk pick
 * (the team with the higher season-average score), so standings and
 * seeding are always fully computed — this is the Interactive Playoff
 * Machine's engine. It's effectively a single non-random "trial" of the
 * same tiebreaker/seeding logic the Monte Carlo simulator runs 10,000
 * times over — reusing `rankTeams` keeps the two consistent.
 */
export function resolveScenario(league: LeagueForScenario, overrides: Map<string, string>): ScenarioResult {
  const stats = new Map<string, TrialTeamStat>();
  const averages = new Map<string, number>();
  for (const t of league.teams) {
    stats.set(t.id, { teamId: t.id, divisionId: t.divisionId, wins: t.wins, losses: t.losses, ties: t.ties, pointsFor: t.pointsFor });
    averages.set(t.id, teamAverage(t.scoreHistory));
  }

  const results: TrialMatchupResult[] = league.matchups
    .filter((m) => m.completed)
    .map((m) => ({
      week: m.week,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      winnerTeamId: m.homeScore === m.awayScore ? null : m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId,
    }));

  const remaining = league.matchups.filter((m) => m.week >= league.settings.currentWeek);
  for (const m of remaining) {
    const key = matchupKey(m.week, m.homeTeamId, m.awayTeamId);
    const chalkWinner = averages.get(m.homeTeamId)! >= averages.get(m.awayTeamId)! ? m.homeTeamId : m.awayTeamId;
    const winnerId = overrides.get(key) ?? chalkWinner;
    const loserId = winnerId === m.homeTeamId ? m.awayTeamId : m.homeTeamId;

    const winnerAvg = averages.get(winnerId)!;
    const loserAvg = averages.get(loserId)!;
    const winnerScore = Math.max(winnerAvg, loserAvg + 0.1);

    const winnerStat = stats.get(winnerId)!;
    const loserStat = stats.get(loserId)!;
    winnerStat.wins++;
    winnerStat.pointsFor += winnerScore;
    loserStat.losses++;
    loserStat.pointsFor += loserAvg;

    results.push({ week: m.week, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, winnerTeamId: winnerId });
  }

  const order = rankTeams([...stats.values()], results);

  const divisionWinners: string[] = [];
  if (league.settings.divisionWinnersAutoQualify) {
    for (const div of league.divisions) {
      const winner = order.find((id) => stats.get(id)!.divisionId === div.id);
      if (winner) divisionWinners.push(winner);
    }
  }
  const wildcardSlots = Math.max(0, league.settings.playoffTeams - divisionWinners.length);
  const nonDivisionWinners = order.filter((id) => !divisionWinners.includes(id));
  const wildcards = nonDivisionWinners.slice(0, wildcardSlots);
  const playoffSeeds = [...order.filter((id) => divisionWinners.includes(id)), ...order.filter((id) => wildcards.includes(id))];

  const seeds: ScenarioSeed[] = order.map((teamId) => {
    const seedIndex = playoffSeeds.indexOf(teamId);
    return {
      teamId,
      seed: seedIndex >= 0 ? seedIndex + 1 : null,
      isDivisionWinner: divisionWinners.includes(teamId),
      hasBye: seedIndex >= 0 && seedIndex < league.settings.firstRoundByes,
    };
  });

  return { order, seeds, statsByTeam: stats };
}
