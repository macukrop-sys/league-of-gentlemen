import type { League, LuckIndexEntry } from "@/lib/types";
import { computeAllPlayStats } from "./allPlay";

/**
 * Luck Index = actual wins - expected wins, where expected wins is derived
 * from the All-Play record (the sum, week by week, of the fraction of the
 * league a team's score would have beaten). A positive index means a team
 * has won more than its weekly scoring would predict (favorable schedule /
 * close-game luck); negative means the opposite.
 */
export function computeLuckIndex(league: League): LuckIndexEntry[] {
  const throughWeek = league.settings.currentWeek - 1;
  const { expectedWins } = computeAllPlayStats(
    league.teams.map((t) => ({ teamId: t.id, scoreHistory: t.scoreHistory })),
    throughWeek,
  );

  return league.teams
    .map((t) => {
      const actualWins = t.wins + t.ties * 0.5;
      const expected = expectedWins[t.id] ?? 0;
      return {
        teamId: t.id,
        actualWins,
        expectedWins: +expected.toFixed(2),
        luckIndex: +(actualWins - expected).toFixed(2),
      };
    })
    .sort((a, b) => b.luckIndex - a.luckIndex);
}
