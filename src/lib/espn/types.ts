/**
 * Minimal typed slices of ESPN's fantasy football API.
 *
 * This API is undocumented (no official public spec) — these shapes are
 * reverse-engineered from what the ESPN Fantasy web app itself calls, and
 * ESPN has changed field names across seasons before. Treat this file as
 * the single place to patch if a response shape drifts.
 */

export interface EspnLeagueResponse {
  id: number;
  seasonId: number;
  status: {
    currentMatchupPeriod: number;
    latestScoringPeriod: number;
  };
  settings: {
    name: string;
    scheduleSettings: {
      matchupPeriodCount: number;
      playoffTeamCount: number;
      divisions?: { id: number; name: string }[];
    };
    rosterSettings: {
      lineupSlotCounts: Record<string, number>;
    };
  };
  teams: EspnTeam[];
  members: EspnMember[];
  schedule: EspnScheduleMatchup[];
}

export interface EspnTeam {
  id: number;
  name?: string;
  location?: string;
  nickname?: string;
  abbrev?: string;
  divisionId?: number;
  owners?: string[];
  record: {
    overall: {
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
    };
  };
  roster?: { entries: EspnRosterEntry[] };
}

export interface EspnMember {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

export interface EspnScheduleMatchup {
  matchupPeriodId: number;
  home: { teamId: number; totalPoints: number };
  away?: { teamId: number; totalPoints: number };
  winner: "HOME" | "AWAY" | "TIE" | "UNDECIDED";
}

export interface EspnRosterEntry {
  playerId: number;
  lineupSlotId: number;
  playerPoolEntry: {
    player: EspnPlayer;
  };
}

export interface EspnPlayer {
  id: number;
  fullName: string;
  defaultPositionId: number;
  proTeamId: number;
  injuryStatus?: string;
  stats?: EspnPlayerStat[];
}

export interface EspnPlayerStat {
  scoringPeriodId: number;
  /** 0 = actual, 1 = projected */
  statSourceId: 0 | 1;
  statSplitTypeId?: number;
  appliedTotal?: number;
}

/** `view=mBoxscore` response: schedule entries carry a live roster snapshot per side. */
export interface EspnBoxscoreResponse {
  schedule: EspnBoxscoreMatchup[];
}

export interface EspnBoxscoreMatchup {
  matchupPeriodId: number;
  home: EspnBoxscoreSide;
  away?: EspnBoxscoreSide;
}

export interface EspnBoxscoreSide {
  teamId: number;
  totalPoints: number;
  rosterForCurrentScoringPeriod?: { entries: EspnRosterEntry[] };
}
