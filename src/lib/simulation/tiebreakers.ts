export interface TrialTeamStat {
  teamId: string;
  divisionId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
}

export interface TrialMatchupResult {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  /** null = tie */
  winnerTeamId: string | null;
}

function winPct(s: TrialTeamStat): number {
  const gp = s.wins + s.losses + s.ties;
  return gp > 0 ? (s.wins + s.ties * 0.5) / gp : 0;
}

/**
 * Ranks teams best-to-worst using: win% -> head-to-head win% among the
 * subset of teams tied on win% (using only games actually played between
 * them) -> points for. This mirrors the tiebreaker chain most fantasy
 * platforms use, minus divisional-record (out of scope for this model) —
 * it's the single most-referenced tiebreaker after head-to-head, so this
 * chain resolves the overwhelming majority of real ties correctly.
 */
export function rankTeams(stats: TrialTeamStat[], results: TrialMatchupResult[]): string[] {
  const sorted = [...stats].sort((a, b) => winPct(b) - winPct(a) || b.pointsFor - a.pointsFor);

  const groups: TrialTeamStat[][] = [];
  for (const s of sorted) {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup && Math.abs(winPct(currentGroup[0]!) - winPct(s)) < 1e-9) {
      currentGroup.push(s);
    } else {
      groups.push([s]);
    }
  }

  const finalOrder: string[] = [];
  for (const group of groups) {
    if (group.length === 1) {
      finalOrder.push(group[0]!.teamId);
      continue;
    }

    const ids = new Set(group.map((g) => g.teamId));
    const h2h = new Map<string, { w: number; l: number; t: number }>();
    for (const g of group) h2h.set(g.teamId, { w: 0, l: 0, t: 0 });

    for (const r of results) {
      if (!ids.has(r.homeTeamId) || !ids.has(r.awayTeamId)) continue;
      if (r.winnerTeamId === null) {
        h2h.get(r.homeTeamId)!.t++;
        h2h.get(r.awayTeamId)!.t++;
      } else {
        const loser = r.winnerTeamId === r.homeTeamId ? r.awayTeamId : r.homeTeamId;
        h2h.get(r.winnerTeamId)!.w++;
        h2h.get(loser)!.l++;
      }
    }

    const withH2H = group.map((g) => {
      const h = h2h.get(g.teamId)!;
      const gp = h.w + h.l + h.t;
      // -1 sentinel when the tied teams never played each other: falls back
      // to the points-for order already established by the outer sort.
      return { ...g, h2hPct: gp > 0 ? (h.w + h.t * 0.5) / gp : -1 };
    });
    withH2H.sort((a, b) => b.h2hPct - a.h2hPct || b.pointsFor - a.pointsFor);
    for (const w of withH2H) finalOrder.push(w.teamId);
  }

  return finalOrder;
}
