import type { Matchup, Player, Roster, WinProbability } from "@/lib/types";
import { normalCdf } from "@/lib/random";

/**
 * Rough weekly scoring stdDev by position — used only to size the remaining
 * uncertainty for players who haven't finished (or started) their game yet.
 * Independent of the mock data generator's talent model so this module
 * works unchanged against a real (Sleeper/ESPN/Yahoo) roster.
 */
const POSITION_STD_DEV: Record<Player["position"], number> = {
  QB: 6.5,
  RB: 7.2,
  WR: 7.0,
  TE: 5.0,
  DST: 4.2,
  K: 3.2,
};

/** Mean + variance of a player's final point total, given what's known right now. */
function playerProjection(p: Player): { mean: number; variance: number } {
  if (p.gameFinal) return { mean: p.actualPoints, variance: 0 };
  const stdDev = POSITION_STD_DEV[p.position];
  if (p.gameInProgress) {
    // Already-scored points are locked in; remaining game time still carries
    // roughly half a full game's worth of uncertainty.
    const remainingMean = Math.max(0, p.projectedPoints - p.actualPoints) * 0.5;
    return { mean: p.actualPoints + remainingMean, variance: (stdDev * 0.5) ** 2 };
  }
  return { mean: p.projectedPoints, variance: stdDev ** 2 };
}

function teamProjection(roster: Roster): { mean: number; variance: number } {
  let mean = 0;
  let variance = 0;
  for (const slot of roster.starters) {
    if (!slot.playerId) continue;
    const player = roster.players[slot.playerId];
    if (!player) continue;
    const p = playerProjection(player);
    mean += p.mean;
    variance += p.variance;
  }
  return { mean, variance };
}

/**
 * Live win probability via a normal approximation: each team's remaining
 * score is Normal(mean, variance) built from summing independent
 * player-level projections (locked-in actuals have zero variance), then
 * P(home wins) = P(homeScore - awayScore > 0) using the CDF of the
 * resulting difference distribution. Clamped away from exactly 0%/100% —
 * a lineup is never truly a lock until the final whistle.
 */
export function computeWinProbability(matchup: Matchup, homeRoster: Roster, awayRoster: Roster): WinProbability {
  const home = teamProjection(homeRoster);
  const away = teamProjection(awayRoster);

  const diffMean = home.mean - away.mean;
  const diffStdDev = Math.sqrt(home.variance + away.variance) || 0.0001;
  const rawHomeWinProb = 1 - normalCdf(0, diffMean, diffStdDev);
  const homeWinProb = Math.min(0.99, Math.max(0.01, rawHomeWinProb));

  return {
    homeTeamId: matchup.homeTeamId,
    awayTeamId: matchup.awayTeamId,
    homeWinProb: +homeWinProb.toFixed(3),
    awayWinProb: +(1 - homeWinProb).toFixed(3),
    homeProjectedFinal: +home.mean.toFixed(1),
    awayProjectedFinal: +away.mean.toFixed(1),
  };
}
