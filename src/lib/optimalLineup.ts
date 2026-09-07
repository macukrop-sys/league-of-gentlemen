import type { OptimalLineupResult, Player, Position, Roster, RosterSlot } from "@/lib/types";

/** A player's best current estimate of final points: locked in once their game starts. */
function effectivePoints(p: Player): number {
  return p.gameFinal || p.gameInProgress ? p.actualPoints : p.projectedPoints;
}

/**
 * Exact optimal-lineup solver. Slots whose eligibility is a single position
 * (QB, RB, WR, TE, DST, K) can only ever be filled by that position, so the
 * best assignment is simply "the top-N players at that position" — no
 * search needed. The only slot with real choice is FLEX (or any
 * multi-eligibility slot); those are resolved greedily, most-constrained
 * slot first, which is provably optimal whenever the flex slots don't
 * outnumber 1 (true for standard leagues) and a good heuristic otherwise.
 */
export function computeOptimalLineup(roster: Roster): OptimalLineupResult {
  const allPlayers = Object.values(roster.players);
  const used = new Set<string>();
  const resultByIndex = new Array<string | null>(roster.starters.length).fill(null);

  const exclusiveByPosition = new Map<Position, number[]>();
  const flexIndices: { slot: Position; index: number }[] = [];

  roster.starters.forEach((s, index) => {
    if (roster.eligibility[s.slot].length === 1) {
      if (!exclusiveByPosition.has(s.slot)) exclusiveByPosition.set(s.slot, []);
      exclusiveByPosition.get(s.slot)!.push(index);
    } else {
      flexIndices.push({ slot: s.slot, index });
    }
  });

  for (const [pos, indices] of exclusiveByPosition) {
    const eligiblePositions = roster.eligibility[pos];
    const candidates = allPlayers
      .filter((p) => eligiblePositions.includes(p.position) && !used.has(p.id))
      .sort((a, b) => effectivePoints(b) - effectivePoints(a));
    indices.forEach((slotIndex, i) => {
      const player = candidates[i];
      if (player) used.add(player.id);
      resultByIndex[slotIndex] = player?.id ?? null;
    });
  }

  const remainingFlex = [...flexIndices];
  while (remainingFlex.length > 0) {
    let bestPos = 0;
    let bestCandidates: Player[] = [];
    let fewest = Infinity;
    remainingFlex.forEach((item, i) => {
      const eligiblePositions = roster.eligibility[item.slot];
      const candidates = allPlayers.filter((p) => eligiblePositions.includes(p.position) && !used.has(p.id));
      if (candidates.length < fewest) {
        fewest = candidates.length;
        bestPos = i;
        bestCandidates = candidates;
      }
    });
    const chosen = remainingFlex.splice(bestPos, 1)[0]!;
    bestCandidates.sort((a, b) => effectivePoints(b) - effectivePoints(a));
    const player = bestCandidates[0];
    if (player) used.add(player.id);
    resultByIndex[chosen.index] = player?.id ?? null;
  }

  const optimalStarters: RosterSlot[] = roster.starters.map((s, i) => ({ slot: s.slot, playerId: resultByIndex[i] ?? null }));

  const sumEff = (slots: RosterSlot[]) =>
    slots.reduce((sum, s) => sum + (s.playerId ? effectivePoints(roster.players[s.playerId]!) : 0), 0);

  const optimalPoints = sumEff(optimalStarters);
  const actualPoints = sumEff(roster.starters);

  const suggestedSwaps: OptimalLineupResult["suggestedSwaps"] = [];
  optimalStarters.forEach((opt, i) => {
    const actual = roster.starters[i]!;
    if (opt.playerId && actual.playerId && opt.playerId !== actual.playerId) {
      const gain = effectivePoints(roster.players[opt.playerId]!) - effectivePoints(roster.players[actual.playerId]!);
      if (gain > 0.05) {
        suggestedSwaps.push({
          slot: opt.slot,
          benchPlayerId: opt.playerId,
          startingPlayerId: actual.playerId,
          gain: +gain.toFixed(1),
        });
      }
    }
  });
  suggestedSwaps.sort((a, b) => b.gain - a.gain);

  return {
    teamId: roster.teamId,
    optimalPoints: +optimalPoints.toFixed(1),
    actualPoints: +actualPoints.toFixed(1),
    pointsLeftOnBench: +Math.max(0, optimalPoints - actualPoints).toFixed(1),
    optimalStarters,
    suggestedSwaps,
  };
}
