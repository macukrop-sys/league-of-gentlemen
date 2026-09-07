import type { League } from "@/lib/types";
import type { Poll } from "./types";

/**
 * One "who wins?" poll per matchup that week, generated straight from the
 * league's real schedule — nobody has to write a poll by hand, and the poll
 * set automatically changes every week as the schedule moves forward. The
 * poll id is deterministic (week + both team ids), so it doubles as the
 * Redis key without any separate "create poll" step.
 */
export function getPollsForWeek(league: League, week: number): Poll[] {
  const teamById = new Map(league.teams.map((t) => [t.id, t]));

  const polls: Poll[] = [];
  for (const m of league.matchups) {
    if (m.week !== week) continue;
    const home = teamById.get(m.homeTeamId);
    const away = teamById.get(m.awayTeamId);
    if (!home || !away) continue;
    polls.push({
      id: `w${week}-${m.homeTeamId}-${m.awayTeamId}`,
      week,
      question: `Who wins: ${home.name} or ${away.name}?`,
      options: [
        { id: m.homeTeamId, label: home.name },
        { id: m.awayTeamId, label: away.name },
      ],
    });
  }
  return polls;
}
