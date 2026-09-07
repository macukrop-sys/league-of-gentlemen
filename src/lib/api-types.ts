import type { OptimalLineupResult, Roster, Team, WinProbability } from "@/lib/types";

/** Shape returned by GET /api/live — shared between the server-rendered overview and the client-polled live page. */
export interface LiveMatchupView {
  week: number;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number;
  awayScore: number;
  winProbability: WinProbability | null;
}

export interface LiveResponse {
  week: number;
  matchups: LiveMatchupView[];
  optimalLineups: OptimalLineupResult[];
  rosters: Record<string, Roster>;
  teams: Team[];
}
