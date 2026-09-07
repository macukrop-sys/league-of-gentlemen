/** Minimal typed slices of Sleeper's public API — only the fields this app reads. */

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  roster_positions: string[];
  settings: {
    playoff_teams?: number;
    playoff_week_start?: number;
    divisions?: number;
    num_teams?: number;
  };
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
  starters: string[] | null;
  settings?: {
    wins?: number;
    losses?: number;
    ties?: number;
    fpts?: number;
    fpts_decimal?: number;
    fpts_against?: number;
    fpts_against_decimal?: number;
    division?: number;
  };
}

export interface SleeperUser {
  user_id: string;
  display_name: string;
  metadata?: { team_name?: string };
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number | null;
  points: number;
  starters: string[] | null;
  players_points?: Record<string, number>;
}

export interface SleeperPlayer {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
}

export interface SleeperNflState {
  week: number;
  season: string;
  season_type: "pre" | "regular" | "post";
}
