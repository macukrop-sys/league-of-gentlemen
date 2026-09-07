import type { League, Player, Team } from "@/lib/types";

/** Finds a player by id across every team's current roster, along with which team rosters them. */
export function findPlayerInLeague(league: League, playerId: string): { player: Player; team: Team } | null {
  for (const team of league.teams) {
    const roster = league.rosters[team.id];
    const player = roster?.players[playerId];
    if (player) return { player, team };
  }
  return null;
}
