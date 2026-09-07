import type { League, Roster } from "@/lib/types";
import { computeOptimalLineup } from "@/lib/optimalLineup";

export type RecapSectionKind = "blowout" | "nailbiter" | "topScore" | "lowScore" | "upset" | "benchRegret" | "playerOfWeek";

export interface RecapSection {
  kind: RecapSectionKind;
  title: string;
  body: string;
  /** Team ids this section is "about," for optional linking in the UI. */
  teamIds?: string[];
  /** Player id this section is about, for optional linking in the UI. */
  playerId?: string;
}

/**
 * Builds a set of stats-driven recap "cards" for a given week, entirely from
 * data already fetched via `getLeague()` / `getRostersForWeek()` — no AI
 * generation, no extra API calls. Every sentence is a template filled from
 * real numbers, per the site owner's choice to avoid the cost/latency/
 * hallucination risk of an LLM-written recap. Sections are omitted (not
 * rendered with placeholder text) when the underlying week has no
 * qualifying data, e.g. a future week with no scores yet.
 */
export function generateWeeklyRecap(league: League, week: number, rosters: Record<string, Roster>): RecapSection[] {
  const sections: RecapSection[] = [];
  const teamById = new Map(league.teams.map((t) => [t.id, t]));
  const weekMatchups = league.matchups.filter((m) => m.week === week && m.completed);

  if (weekMatchups.length === 0) {
    return sections;
  }

  // Flatten every team's score for the week, one row per side of every matchup.
  const teamScores = weekMatchups.flatMap((m) => [
    { teamId: m.homeTeamId, score: m.homeScore, oppId: m.awayTeamId, oppScore: m.awayScore, won: m.homeScore > m.awayScore },
    { teamId: m.awayTeamId, score: m.awayScore, oppId: m.homeTeamId, oppScore: m.homeScore, won: m.awayScore > m.homeScore },
  ]);

  // --- Blowout of the Week ---
  const byMargin = [...weekMatchups].sort((a, b) => Math.abs(b.homeScore - b.awayScore) - Math.abs(a.homeScore - a.awayScore));
  const blowout = byMargin[0];
  if (blowout) {
    const margin = Math.abs(blowout.homeScore - blowout.awayScore);
    const winnerId = blowout.homeScore > blowout.awayScore ? blowout.homeTeamId : blowout.awayTeamId;
    const loserId = blowout.homeScore > blowout.awayScore ? blowout.awayTeamId : blowout.homeTeamId;
    const winner = teamById.get(winnerId);
    const loser = teamById.get(loserId);
    const winnerScore = Math.max(blowout.homeScore, blowout.awayScore);
    const loserScore = Math.min(blowout.homeScore, blowout.awayScore);
    if (winner && loser && margin > 0) {
      sections.push({
        kind: "blowout",
        title: "Blowout of the Week",
        body: `${winner.name} throttled ${loser.name} ${winnerScore.toFixed(1)}–${loserScore.toFixed(1)}, a ${margin.toFixed(1)}-point beatdown.`,
        teamIds: [winnerId, loserId],
      });
    }
  }

  // --- Down to the Wire (closest game) ---
  const byCloseness = [...weekMatchups].sort((a, b) => Math.abs(a.homeScore - a.awayScore) - Math.abs(b.homeScore - b.awayScore));
  const nailbiter = byCloseness[0];
  if (nailbiter && weekMatchups.length > 1) {
    const margin = Math.abs(nailbiter.homeScore - nailbiter.awayScore);
    const winnerId = nailbiter.homeScore > nailbiter.awayScore ? nailbiter.homeTeamId : nailbiter.awayTeamId;
    const loserId = nailbiter.homeScore > nailbiter.awayScore ? nailbiter.awayTeamId : nailbiter.homeTeamId;
    const winner = teamById.get(winnerId);
    const loser = teamById.get(loserId);
    if (winner && loser) {
      sections.push({
        kind: "nailbiter",
        title: "Down to the Wire",
        body:
          margin < 1
            ? `${winner.name} survived ${loser.name} by the slimmest of margins — just ${margin.toFixed(1)} point${margin === 1 ? "" : "s"}.`
            : `${winner.name} edged ${loser.name} by ${margin.toFixed(1)} points in the closest matchup of the week.`,
        teamIds: [winnerId, loserId],
      });
    }
  }

  // --- Team of the Week / Rough Week (highest / lowest score across all teams) ---
  const byScore = [...teamScores].sort((a, b) => b.score - a.score);
  const top = byScore[0];
  const low = byScore[byScore.length - 1];
  if (top) {
    const team = teamById.get(top.teamId);
    if (team) {
      sections.push({
        kind: "topScore",
        title: "Team of the Week",
        body: `${team.name} put up ${top.score.toFixed(1)} points, the best score of the week, in ${top.won ? "a win" : "a losing effort"}.`,
        teamIds: [top.teamId],
      });
    }
  }
  if (low && low.teamId !== top?.teamId) {
    const team = teamById.get(low.teamId);
    if (team) {
      sections.push({
        kind: "lowScore",
        title: "Rough Week",
        body: `${team.name} scored just ${low.score.toFixed(1)} points, the lowest total in the league this week${low.won ? " — and somehow still won" : ""}.`,
        teamIds: [low.teamId],
      });
    }
  }

  // --- Upset Alert (winner's season record was worse than the loser's, using the record entering this week's result) ---
  let biggestUpset: { winnerId: string; loserId: string; gap: number } | null = null;
  for (const m of weekMatchups) {
    const winnerId = m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
    const loserId = m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId;
    const winner = teamById.get(winnerId);
    const loser = teamById.get(loserId);
    if (!winner || !loser) continue;
    const winnerGames = winner.wins + winner.losses + winner.ties;
    const loserGames = loser.wins + loser.losses + loser.ties;
    if (winnerGames === 0 || loserGames === 0) continue;
    const winnerPct = (winner.wins + winner.ties * 0.5) / winnerGames;
    const loserPct = (loser.wins + loser.ties * 0.5) / loserGames;
    const gap = loserPct - winnerPct;
    if (gap >= 0.25 && (!biggestUpset || gap > biggestUpset.gap)) {
      biggestUpset = { winnerId, loserId, gap };
    }
  }
  if (biggestUpset) {
    const winner = teamById.get(biggestUpset.winnerId);
    const loser = teamById.get(biggestUpset.loserId);
    if (winner && loser) {
      sections.push({
        kind: "upset",
        title: "Upset Alert",
        body: `${winner.name} (${winner.wins}-${winner.losses}${winner.ties ? `-${winner.ties}` : ""}) knocked off ${loser.name} (${loser.wins}-${loser.losses}${loser.ties ? `-${loser.ties}` : ""}), the week's biggest upset on paper.`,
        teamIds: [biggestUpset.winnerId, biggestUpset.loserId],
      });
    }
  }

  // --- Bench Regret (team that left the most points on the bench) ---
  const rosterEntries = Object.values(rosters).filter((r) => weekMatchups.some((m) => m.homeTeamId === r.teamId || m.awayTeamId === r.teamId));
  let worstRegret: { teamId: string; pointsLeftOnBench: number } | null = null;
  for (const roster of rosterEntries) {
    const result = computeOptimalLineup(roster);
    if (!worstRegret || result.pointsLeftOnBench > worstRegret.pointsLeftOnBench) {
      worstRegret = { teamId: roster.teamId, pointsLeftOnBench: result.pointsLeftOnBench };
    }
  }
  if (worstRegret && worstRegret.pointsLeftOnBench > 5) {
    const team = teamById.get(worstRegret.teamId);
    if (team) {
      sections.push({
        kind: "benchRegret",
        title: "Bench Regret",
        body: `${team.name} left ${worstRegret.pointsLeftOnBench.toFixed(1)} points on the bench this week — the optimal lineup would have scored that much more.`,
        teamIds: [worstRegret.teamId],
      });
    }
  }

  // --- Performance of the Week (single highest-scoring player across all rosters) ---
  let bestPlayer: { playerId: string; name: string; position: string; teamId: string; points: number } | null = null;
  for (const roster of rosterEntries) {
    for (const player of Object.values(roster.players)) {
      if (!bestPlayer || player.actualPoints > bestPlayer.points) {
        bestPlayer = { playerId: player.id, name: player.name, position: player.position, teamId: roster.teamId, points: player.actualPoints };
      }
    }
  }
  if (bestPlayer && bestPlayer.points > 0) {
    const team = teamById.get(bestPlayer.teamId);
    if (team) {
      sections.push({
        kind: "playerOfWeek",
        title: "Performance of the Week",
        body: `${bestPlayer.name} (${bestPlayer.position}, ${team.name}) led all players with ${bestPlayer.points.toFixed(1)} fantasy points.`,
        teamIds: [bestPlayer.teamId],
        playerId: bestPlayer.playerId,
      });
    }
  }

  return sections;
}
