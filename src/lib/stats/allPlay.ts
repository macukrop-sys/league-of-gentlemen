import type { AllPlayRecord } from "@/lib/types";

export interface AllPlayInput {
  teamId: string;
  /** Weekly score history, index 0 = week 1. Only indices < throughWeek are read. */
  scoreHistory: number[];
}

export interface AllPlayStats {
  records: AllPlayRecord[];
  /** teamId -> sum across weeks of (that week's all-play win fraction). */
  expectedWins: Record<string, number>;
}

/**
 * All-Play record: for every completed week, pit each team's score against
 * every other team's score that week (as if they played the whole league),
 * and tally the resulting W/L/T. This is the standard "record if you played
 * everyone every week" advanced stat, and it also doubles as the basis for
 * the Luck Index (expected wins = the sum of each week's all-play win rate).
 */
export function computeAllPlayStats(teams: AllPlayInput[], throughWeek: number): AllPlayStats {
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const ties = new Map<string, number>();
  const expectedWins = new Map<string, number>();
  for (const t of teams) {
    wins.set(t.teamId, 0);
    losses.set(t.teamId, 0);
    ties.set(t.teamId, 0);
    expectedWins.set(t.teamId, 0);
  }

  const opponentCount = teams.length - 1;

  for (let week = 1; week <= throughWeek; week++) {
    const weekScores = teams.map((t) => ({ teamId: t.teamId, score: t.scoreHistory[week - 1] }));
    if (weekScores.some((w) => w.score === undefined)) continue; // week not actually played yet

    for (const a of weekScores) {
      let weekWins = 0;
      let weekTies = 0;
      for (const b of weekScores) {
        if (a.teamId === b.teamId) continue;
        if (a.score! > b.score!) weekWins++;
        else if (a.score! === b.score!) weekTies++;
      }
      wins.set(a.teamId, wins.get(a.teamId)! + weekWins);
      ties.set(a.teamId, ties.get(a.teamId)! + weekTies);
      losses.set(a.teamId, losses.get(a.teamId)! + (opponentCount - weekWins - weekTies));
      const weekWinFraction = opponentCount > 0 ? (weekWins + weekTies * 0.5) / opponentCount : 0;
      expectedWins.set(a.teamId, expectedWins.get(a.teamId)! + weekWinFraction);
    }
  }

  const records: AllPlayRecord[] = teams.map((t) => {
    const w = wins.get(t.teamId)!;
    const l = losses.get(t.teamId)!;
    const ty = ties.get(t.teamId)!;
    const total = w + l + ty;
    return { teamId: t.teamId, wins: w, losses: l, ties: ty, winPct: total > 0 ? (w + ty * 0.5) / total : 0 };
  });
  records.sort((a, b) => b.winPct - a.winPct);

  return { records, expectedWins: Object.fromEntries(expectedWins) };
}
