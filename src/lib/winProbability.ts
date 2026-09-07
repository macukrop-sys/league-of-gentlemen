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

/**
 * Best current estimate of a player's FINAL point total, given what's
 * known right now: locked in once the game is final; the untouched
 * pregame projection before kickoff; and, while the game is live, an
 * extrapolation from their current pace rather than a number frozen at
 * kickoff — a player already well past their projection should show a
 * *higher* projected final, not the same pregame number, and one badly
 * short of it should trend down.
 *
 * Neither ESPN nor Sleeper expose real game-clock/time-remaining data at
 * the per-player level through what this app fetches, so "exactly how
 * much game is left" isn't knowable here — this reacts sensibly to the
 * score so far rather than tracking the clock precisely. It's the single
 * source of truth for "live projection": RosterTable's Proj column and
 * the win-probability model below both call this, so the numbers shown
 * next to a live player never disagree with each other.
 */
export function estimateLiveFinal(player: Player): number {
  if (player.gameFinal) return player.actualPoints;
  if (!player.gameInProgress) return player.projectedPoints;
  const { projectedPoints: pregame, actualPoints: actual } = player;
  // Short of pace: assume just over half the remaining gap to the pregame
  // number still closes. Ahead of pace: assume continued production
  // proportional to what's already on the board (a hot start keeps paying
  // off, just not indefinitely).
  const remaining = actual < pregame ? (pregame - actual) * 0.55 : actual * 0.25;
  return +(actual + remaining).toFixed(1);
}

function playerVariance(player: Player): number {
  if (player.gameFinal) return 0;
  const stdDev = POSITION_STD_DEV[player.position];
  return player.gameInProgress ? (stdDev * 0.5) ** 2 : stdDev ** 2;
}

function teamProjection(roster: Roster): { mean: number; variance: number } {
  let mean = 0;
  let variance = 0;
  for (const slot of roster.starters) {
    if (!slot.playerId) continue;
    const player = roster.players[slot.playerId];
    if (!player) continue;
    mean += estimateLiveFinal(player);
    variance += playerVariance(player);
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
