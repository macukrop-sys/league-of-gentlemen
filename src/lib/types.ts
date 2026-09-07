/**
 * Core domain model for the League of Gentlemen fantasy analytics platform.
 *
 * This shape is deliberately platform-agnostic: adapters in `lib/sleeper`
 * (or a future `lib/espn`, `lib/yahoo`) translate a provider's wire format
 * into these types, and every stats/simulation/UI module downstream only
 * ever depends on this file. Swapping platforms means writing one adapter,
 * not touching the analytics engine.
 */

export type Position = "QB" | "RB" | "WR" | "TE" | "FLEX" | "DST" | "K" | "BN" | "IR";

export interface Player {
  id: string;
  name: string;
  position: Exclude<Position, "FLEX" | "BN" | "IR">;
  nflTeam: string;
  /** Pre-game projection for the *current* week, in fantasy points. */
  projectedPoints: number;
  /** Live/final points scored this week (0 until the player's game starts). */
  actualPoints: number;
  /** Whether this player's game has finished (actualPoints is now final). */
  gameFinal: boolean;
  /** Whether this player is currently mid-game (actualPoints is live/partial). */
  gameInProgress: boolean;
  status?: "OUT" | "Q" | "D" | "IR" | "BYE";
  /**
   * Week-by-week fantasy scoring history, when the data source can supply
   * it without extra network round-trips (ESPN's boxscore response
   * embeds a player's whole-season stat history in the same payload as
   * the current week, so this rides along for free there; Sleeper's
   * per-week endpoint doesn't, so it's only populated on the roster
   * built alongside `League.rosters`, not on every arbitrary-week
   * fetch — see the adapters' comments). Absent/empty means "not
   * available from this path," not "no games played."
   */
  gameLog?: { week: number; actualPoints: number; projectedPoints: number }[];
}

export interface RosterSlot {
  slot: Position;
  playerId: string | null;
}

export interface Roster {
  teamId: string;
  /** Starting lineup slots for the *current* week. */
  starters: RosterSlot[];
  benchPlayerIds: string[];
  /** All rostered players (starters + bench), keyed by id, for quick lookup. */
  players: Record<string, Player>;
  /** Which positions are eligible for each starting slot (league settings). */
  eligibility: Record<Position, Position[]>;
}

export interface Team {
  id: string;
  name: string;
  ownerName: string;
  avatarSeed: string;
  divisionId: string;
  /** Regular-season record accumulated through the current week. */
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  /** Weekly score history, index 0 = week 1, only for completed weeks. */
  scoreHistory: number[];
  /** Current streak, e.g. "W3" or "L2". */
  streak: string;
}

export interface Division {
  id: string;
  name: string;
  teamIds: string[];
}

export interface Matchup {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  completed: boolean;
}

export interface LeagueSettings {
  leagueName: string;
  season: number;
  numTeams: number;
  regularSeasonWeeks: number;
  currentWeek: number;
  /** Total teams that qualify for the playoffs across all divisions. */
  playoffTeams: number;
  /** Number of division winners guaranteed a spot (rest are wildcards). */
  divisionWinnersAutoQualify: boolean;
  /** Seeds 1..byeTeams get a first-round bye. */
  firstRoundByes: number;
}

export interface League {
  settings: LeagueSettings;
  teams: Team[];
  divisions: Division[];
  matchups: Matchup[];
  rosters: Record<string, Roster>;
}

export interface StandingsRow {
  team: Team;
  rank: number;
  divisionRank: number;
  clinched: "playoffs" | "division" | "bye" | "eliminated" | null;
}

export interface AllPlayRecord {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
}

export interface PowerRanking {
  teamId: string;
  rank: number;
  score: number;
  components: {
    pointsForScore: number;
    allPlayScore: number;
    rosterStrengthScore: number;
  };
  trend: number; // change vs. previous week's power rank, positive = moved up
}

export interface LuckIndexEntry {
  teamId: string;
  actualWins: number;
  expectedWins: number;
  luckIndex: number; // actualWins - expectedWins, +ve = lucky
}

export interface SimulationResult {
  teamId: string;
  playoffOdds: number;
  divisionOdds: number;
  byeOdds: number;
  avgFinalWins: number;
  avgFinalPointsFor: number;
  avgSeed: number;
}

export interface SimulationResponse {
  trials: number;
  asOfWeek: number;
  results: SimulationResult[];
}

/** A manual winner override used by the interactive Playoff Machine. */
export interface MatchupOverride {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  winnerTeamId: string;
}

export interface WinProbability {
  homeTeamId: string;
  awayTeamId: string;
  homeWinProb: number;
  awayWinProb: number;
  homeProjectedFinal: number;
  awayProjectedFinal: number;
}

export interface OptimalLineupResult {
  teamId: string;
  optimalPoints: number;
  actualPoints: number;
  pointsLeftOnBench: number;
  optimalStarters: RosterSlot[];
  /** Bench players who should be starting instead, per slot they'd fill. */
  suggestedSwaps: { slot: Position; benchPlayerId: string; startingPlayerId: string; gain: number }[];
}
