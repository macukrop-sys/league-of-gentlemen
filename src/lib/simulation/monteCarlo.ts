import type { League, MatchupOverride, SimulationResponse, SimulationResult, Team } from "@/lib/types";
import { mulberry32, randNormal } from "@/lib/random";
import { rankTeams, type TrialMatchupResult, type TrialTeamStat } from "./tiebreakers";

export interface SimulationOptions {
  /** Number of Monte Carlo trials. Defaults to 10,000 per the product spec. */
  trials?: number;
  /** Deterministic seed for reproducible trials (tests / snapshots). Omit for true randomness. */
  seed?: number;
  /**
   * Manual winner overrides for the Interactive Playoff Machine — when a
   * remaining matchup is overridden, every trial forces that winner instead
   * of sampling it, letting the rest of the schedule stay randomized.
   */
  overrides?: MatchupOverride[];
}

interface TeamDistribution {
  mean: number;
  stdDev: number;
}

/**
 * Approximates each team's weekly scoring as Normal(mean, stdDev) fit from
 * its own completed-week history. A floor on stdDev keeps teams with very
 * few games played (or an improbably consistent start) from being modeled
 * as unrealistically predictable.
 */
function teamDistribution(team: Team): TeamDistribution {
  const scores = team.scoreHistory.filter((s): s is number => typeof s === "number");
  if (scores.length === 0) return { mean: 112, stdDev: 22 };
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.length > 1 ? scores.reduce((a, b) => a + (b - mean) ** 2, 0) / (scores.length - 1) : 400;
  return { mean, stdDev: Math.max(9, Math.sqrt(variance)) };
}

/**
 * Monte Carlo playoff simulator: simulates the remaining regular-season
 * schedule `trials` times (10,000 by default), each time sampling every
 * remaining matchup's outcome from the two teams' fitted scoring
 * distributions, then resolving final standings (with tiebreakers) and
 * playoff seeding (division winners auto-qualify + best-record wildcards,
 * top N seeds get a first-round bye). Odds are simply
 * (times a team qualified) / trials, i.e. the model's estimate of the true
 * probability, accurate to within Monte Carlo sampling error
 * (~±1pp at n=10,000 for odds near 50%).
 */
export function runMonteCarloSimulation(league: League, options: SimulationOptions = {}): SimulationResponse {
  const trials = options.trials ?? 10000;
  const rand = options.seed !== undefined ? mulberry32(options.seed) : Math.random;

  const distributions = new Map<string, TeamDistribution>();
  for (const t of league.teams) distributions.set(t.id, teamDistribution(t));

  const remainingMatchups = league.matchups.filter((m) => m.week >= league.settings.currentWeek);

  const overrideByKey = new Map<string, string>();
  for (const o of options.overrides ?? []) {
    overrideByKey.set(`${o.week}:${o.homeTeamId}:${o.awayTeamId}`, o.winnerTeamId);
  }

  const completedResultsBase: TrialMatchupResult[] = league.matchups
    .filter((m) => m.completed)
    .map((m) => ({
      week: m.week,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      winnerTeamId: m.homeScore === m.awayScore ? null : m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId,
    }));

  const madePlayoffs = new Map<string, number>();
  const wonDivision = new Map<string, number>();
  const gotBye = new Map<string, number>();
  const sumWins = new Map<string, number>();
  const sumPointsFor = new Map<string, number>();
  const sumSeed = new Map<string, number>();
  for (const t of league.teams) {
    madePlayoffs.set(t.id, 0);
    wonDivision.set(t.id, 0);
    gotBye.set(t.id, 0);
    sumWins.set(t.id, 0);
    sumPointsFor.set(t.id, 0);
    sumSeed.set(t.id, 0);
  }

  for (let trial = 0; trial < trials; trial++) {
    const trialStats = new Map<string, TrialTeamStat>();
    for (const t of league.teams) {
      trialStats.set(t.id, {
        teamId: t.id,
        divisionId: t.divisionId,
        wins: t.wins,
        losses: t.losses,
        ties: t.ties,
        pointsFor: t.pointsFor,
      });
    }

    const results = completedResultsBase.slice();

    for (const m of remainingMatchups) {
      const homeDist = distributions.get(m.homeTeamId)!;
      const awayDist = distributions.get(m.awayTeamId)!;
      let homeScore = Math.max(30, randNormal(rand, homeDist.mean, homeDist.stdDev));
      let awayScore = Math.max(30, randNormal(rand, awayDist.mean, awayDist.stdDev));

      const forcedWinner = overrideByKey.get(`${m.week}:${m.homeTeamId}:${m.awayTeamId}`);
      let winnerId: string;
      if (forcedWinner) {
        winnerId = forcedWinner;
        if (forcedWinner === m.homeTeamId && homeScore <= awayScore) homeScore = awayScore + 0.1;
        if (forcedWinner === m.awayTeamId && awayScore <= homeScore) awayScore = homeScore + 0.1;
      } else if (homeScore === awayScore) {
        winnerId = rand() < 0.5 ? m.homeTeamId : m.awayTeamId;
      } else {
        winnerId = homeScore > awayScore ? m.homeTeamId : m.awayTeamId;
      }

      const homeStat = trialStats.get(m.homeTeamId)!;
      const awayStat = trialStats.get(m.awayTeamId)!;
      homeStat.pointsFor += homeScore;
      awayStat.pointsFor += awayScore;
      if (winnerId === m.homeTeamId) {
        homeStat.wins++;
        awayStat.losses++;
      } else {
        awayStat.wins++;
        homeStat.losses++;
      }
      results.push({ week: m.week, homeTeamId: m.homeTeamId, awayTeamId: m.awayTeamId, winnerTeamId: winnerId });
    }

    const order = rankTeams([...trialStats.values()], results);

    const divisionWinners: string[] = [];
    if (league.settings.divisionWinnersAutoQualify) {
      for (const div of league.divisions) {
        const winner = order.find((id) => trialStats.get(id)!.divisionId === div.id);
        if (winner) divisionWinners.push(winner);
      }
    }

    const wildcardSlots = Math.max(0, league.settings.playoffTeams - divisionWinners.length);
    const nonDivisionWinners = order.filter((id) => !divisionWinners.includes(id));
    const wildcards = nonDivisionWinners.slice(0, wildcardSlots);

    const seededDivisionWinners = order.filter((id) => divisionWinners.includes(id));
    const seededWildcards = order.filter((id) => wildcards.includes(id));
    const playoffSeeds = [...seededDivisionWinners, ...seededWildcards];

    playoffSeeds.forEach((teamId, i) => {
      madePlayoffs.set(teamId, madePlayoffs.get(teamId)! + 1);
      if (i < league.settings.firstRoundByes) gotBye.set(teamId, gotBye.get(teamId)! + 1);
    });
    for (const teamId of divisionWinners) wonDivision.set(teamId, wonDivision.get(teamId)! + 1);

    order.forEach((teamId, idx) => {
      sumSeed.set(teamId, sumSeed.get(teamId)! + idx + 1);
      const st = trialStats.get(teamId)!;
      sumWins.set(teamId, sumWins.get(teamId)! + st.wins);
      sumPointsFor.set(teamId, sumPointsFor.get(teamId)! + st.pointsFor);
    });
  }

  const results: SimulationResult[] = league.teams.map((t) => ({
    teamId: t.id,
    playoffOdds: madePlayoffs.get(t.id)! / trials,
    divisionOdds: wonDivision.get(t.id)! / trials,
    byeOdds: gotBye.get(t.id)! / trials,
    avgFinalWins: +(sumWins.get(t.id)! / trials).toFixed(2),
    avgFinalPointsFor: +(sumPointsFor.get(t.id)! / trials).toFixed(1),
    avgSeed: +(sumSeed.get(t.id)! / trials).toFixed(2),
  }));

  results.sort((a, b) => b.playoffOdds - a.playoffOdds || b.divisionOdds - a.divisionOdds || a.avgSeed - b.avgSeed);

  return { trials, asOfWeek: league.settings.currentWeek, results };
}
