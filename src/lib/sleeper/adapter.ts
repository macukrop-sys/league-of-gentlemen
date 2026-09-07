import type { League, Matchup, Player, Position, Roster, RosterSlot, Team } from "@/lib/types";
import { getAllPlayers, getLeague, getMatchupsForWeek, getNflState, getRosters, getUsers } from "./client";
import type { SleeperMatchup, SleeperPlayer, SleeperRoster } from "./types";

/**
 * Translates a real Sleeper league into the app's internal `League` shape.
 * This is the only file that needs to change (or be replaced by an
 * `lib/espn/adapter.ts` / `lib/yahoo/adapter.ts` sibling) to point the whole
 * analytics engine — stats, Monte Carlo sim, live dashboard — at a
 * different fantasy platform.
 *
 * Known limitations of Sleeper's free/keyless API (flagged rather than
 * silently papered over):
 *  - No pre-game player projections are exposed. `projectedPoints` falls
 *    back to the player's live actual once their game has started, and 0
 *    beforehand. Wire in a projections provider (e.g. FantasyData, nfelo,
 *    a paid Sleeper partner feed) here to light up true pre-kickoff
 *    projections on the live dashboard.
 *  - No per-player "is this game final / in progress" flag. We approximate
 *    gameInProgress from a non-zero live score, which slightly overstates
 *    remaining variance in the win-probability model once a game has
 *    actually ended. A scoreboard feed (e.g. ESPN's) would close this gap.
 *  - Division *names* aren't exposed by this endpoint, only a numeric
 *    `settings.division` id per roster — divisions are labeled generically.
 *  - Leagues that generate each week's matchups just-in-time (rather than a
 *    schedule fixed at draft time) may return no data for far-future weeks;
 *    the Monte Carlo simulator then simply has fewer remaining matchups to
 *    simulate for those weeks until Sleeper publishes them.
 */
export async function fetchLeagueFromSleeper(leagueId: string): Promise<League> {
  const [sleeperLeague, rosters, users, nflState, allPlayers] = await Promise.all([
    getLeague(leagueId),
    getRosters(leagueId),
    getUsers(leagueId),
    getNflState(),
    getAllPlayers(),
  ]);

  const regularSeasonWeeks = (sleeperLeague.settings.playoff_week_start ?? 15) - 1;
  const currentWeek = Math.min(Math.max(nflState.week, 1), regularSeasonWeeks);
  const playoffTeams = sleeperLeague.settings.playoff_teams ?? 6;
  const hasDivisions = (sleeperLeague.settings.divisions ?? 0) > 0;

  const userById = new Map(users.map((u) => [u.user_id, u]));
  const rosterIdToTeamId = new Map<number, string>();

  const teams: Team[] = rosters.map((r) => {
    const teamId = `roster-${r.roster_id}`;
    rosterIdToTeamId.set(r.roster_id, teamId);
    const user = r.owner_id ? userById.get(r.owner_id) : undefined;
    const divisionId = hasDivisions ? `division-${r.settings?.division ?? 1}` : "league";
    return {
      id: teamId,
      name: user?.metadata?.team_name || user?.display_name || `Team ${r.roster_id}`,
      ownerName: user?.display_name ?? "Unknown Manager",
      avatarSeed: teamId,
      divisionId,
      wins: r.settings?.wins ?? 0,
      losses: r.settings?.losses ?? 0,
      ties: r.settings?.ties ?? 0,
      pointsFor: (r.settings?.fpts ?? 0) + (r.settings?.fpts_decimal ?? 0) / 100,
      pointsAgainst: (r.settings?.fpts_against ?? 0) + (r.settings?.fpts_against_decimal ?? 0) / 100,
      scoreHistory: [],
      streak: "-",
    };
  });

  const divisionIds = Array.from(new Set(teams.map((t) => t.divisionId)));
  const divisions = divisionIds.map((id, i) => ({
    id,
    name: hasDivisions ? `Division ${i + 1}` : "The League",
    teamIds: teams.filter((t) => t.divisionId === id).map((t) => t.id),
  }));

  const matchups: Matchup[] = [];
  const weeksToFetch = Array.from({ length: regularSeasonWeeks }, (_, i) => i + 1);
  const weeklyResults = await Promise.all(
    weeksToFetch.map((week) => getMatchupsForWeek(leagueId, week, { live: week === currentWeek }).catch(() => [] as SleeperMatchup[])),
  );

  weeklyResults.forEach((weekMatchups, i) => {
    const week = weeksToFetch[i]!;
    const completed = week < currentWeek;
    const byMatchupId = new Map<number, SleeperMatchup[]>();
    for (const m of weekMatchups) {
      if (m.matchup_id === null) continue;
      if (!byMatchupId.has(m.matchup_id)) byMatchupId.set(m.matchup_id, []);
      byMatchupId.get(m.matchup_id)!.push(m);
    }
    for (const pair of byMatchupId.values()) {
      const [home, away] = pair;
      if (!home) continue;
      const homeTeamId = rosterIdToTeamId.get(home.roster_id);
      const awayTeamId = away ? rosterIdToTeamId.get(away.roster_id) : undefined;
      if (!homeTeamId || !awayTeamId) continue; // bye week / unmatched roster

      matchups.push({ week, homeTeamId, awayTeamId, homeScore: home.points, awayScore: away?.points ?? 0, completed });

      if (completed) {
        const homeTeam = teams.find((t) => t.id === homeTeamId)!;
        const awayTeam = teams.find((t) => t.id === awayTeamId)!;
        homeTeam.scoreHistory[week - 1] = home.points;
        awayTeam.scoreHistory[week - 1] = away?.points ?? 0;
      }
    }
  });

  const streakByTeam = computeStreaksFromMatchups(teams, matchups);
  for (const t of teams) t.streak = streakByTeam.get(t.id) ?? "-";

  const rostersOut = await buildRosterSnapshot(leagueId, currentWeek, true, rosters, rosterIdToTeamId, allPlayers, sleeperLeague.roster_positions);

  return {
    settings: {
      leagueName: sleeperLeague.name,
      season: Number(sleeperLeague.season),
      numTeams: sleeperLeague.total_rosters,
      regularSeasonWeeks,
      currentWeek,
      playoffTeams,
      divisionWinnersAutoQualify: hasDivisions,
      firstRoundByes: Number(process.env.SLEEPER_FIRST_ROUND_BYES ?? 2),
    },
    teams,
    divisions,
    matchups,
    rosters: rostersOut,
  };
}

/**
 * Roster snapshot for a single week, for any caller that already has the
 * league's rosters/users/players fetched (avoids re-fetching them — those
 * are cheap cache hits anyway, but this keeps `fetchLeagueFromSleeper`
 * from making the roster-list/allPlayers calls twice).
 */
async function buildRosterSnapshot(
  leagueId: string,
  week: number,
  isLive: boolean,
  rosters: SleeperRoster[],
  rosterIdToTeamId: Map<number, string>,
  allPlayers: Record<string, SleeperPlayer>,
  rosterPositions: string[],
): Promise<Record<string, Roster>> {
  const weekMatchups = await getMatchupsForWeek(leagueId, week, { live: isLive }).catch(() => [] as SleeperMatchup[]);
  const matchupByRosterId = new Map(weekMatchups.map((m) => [m.roster_id, m]));

  const rostersOut: Record<string, Roster> = {};
  for (const r of rosters) {
    const teamId = rosterIdToTeamId.get(r.roster_id);
    if (!teamId) continue;
    rostersOut[teamId] = buildRoster(teamId, r, matchupByRosterId.get(r.roster_id), allPlayers, rosterPositions);
  }
  return rostersOut;
}

/** Roster snapshot for an arbitrary week — the current week, or any other for the week-by-week box score page. */
export async function fetchSleeperRosterSnapshot(leagueId: string, week: number, isLive: boolean): Promise<Record<string, Roster>> {
  const [sleeperLeague, rosters, allPlayers] = await Promise.all([getLeague(leagueId), getRosters(leagueId), getAllPlayers()]);
  const rosterIdToTeamId = new Map(rosters.map((r) => [r.roster_id, `roster-${r.roster_id}`]));
  return buildRosterSnapshot(leagueId, week, isLive, rosters, rosterIdToTeamId, allPlayers, sleeperLeague.roster_positions);
}

function computeStreaksFromMatchups(teams: Team[], matchups: Matchup[]): Map<string, string> {
  const byTeamChrono = new Map<string, ("W" | "L" | "T")[]>(teams.map((t) => [t.id, []]));
  const completed = matchups.filter((m) => m.completed).sort((a, b) => a.week - b.week);
  for (const m of completed) {
    if (m.homeScore === m.awayScore) {
      byTeamChrono.get(m.homeTeamId)?.push("T");
      byTeamChrono.get(m.awayTeamId)?.push("T");
    } else {
      const winner = m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
      const loser = winner === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
      byTeamChrono.get(winner)?.push("W");
      byTeamChrono.get(loser)?.push("L");
    }
  }
  const out = new Map<string, string>();
  for (const [teamId, results] of byTeamChrono) {
    if (results.length === 0) {
      out.set(teamId, "-");
      continue;
    }
    const last = results[results.length - 1]!;
    let count = 0;
    for (let i = results.length - 1; i >= 0 && results[i] === last; i--) count++;
    out.set(teamId, `${last}${count}`);
  }
  return out;
}

const SLOT_ELIGIBILITY: Record<string, Position[]> = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  FLEX: ["RB", "WR", "TE"],
  SUPER_FLEX: ["QB", "RB", "WR", "TE"],
  DEF: ["DST"],
  DST: ["DST"],
  K: ["K"],
};

function normalizePosition(pos: string | undefined): Player["position"] {
  if (pos === "DEF") return "DST";
  if (pos === "QB" || pos === "RB" || pos === "WR" || pos === "TE" || pos === "K" || pos === "DST") return pos;
  return "WR"; // unmapped/idp positions fall back rather than crash the adapter
}

function buildRoster(
  teamId: string,
  sleeperRoster: SleeperRoster,
  currentMatchup: SleeperMatchup | undefined,
  allPlayers: Record<string, SleeperPlayer>,
  rosterPositions: string[],
): Roster {
  const playerIds = sleeperRoster.players ?? [];
  const starterIds = currentMatchup?.starters ?? sleeperRoster.starters ?? [];
  const playersPoints = currentMatchup?.players_points ?? {};

  const players: Record<string, Player> = {};
  for (const id of playerIds) {
    const meta = allPlayers[id];
    const actualPoints = playersPoints[id] ?? 0;
    players[id] = {
      id,
      name: meta?.full_name ?? `${meta?.first_name ?? "Unknown"} ${meta?.last_name ?? "Player"}`,
      position: normalizePosition(meta?.position ?? undefined),
      nflTeam: meta?.team ?? "FA",
      // Sleeper's free API doesn't expose pre-game projections (see file header).
      projectedPoints: actualPoints,
      actualPoints,
      gameFinal: false,
      gameInProgress: actualPoints > 0,
    };
  }

  const eligibility: Record<Position, Position[]> = {
    QB: ["QB"],
    RB: ["RB"],
    WR: ["WR"],
    TE: ["TE"],
    FLEX: ["RB", "WR", "TE"],
    DST: ["DST"],
    K: ["K"],
    BN: [],
    IR: [],
  };

  const starters: RosterSlot[] = rosterPositions
    .filter((slot) => slot !== "BN" && slot !== "IR" && slot !== "TAXI")
    .map((slot, i) => {
      const normalizedSlot = (slot === "DEF" ? "DST" : slot) as Position;
      if (SLOT_ELIGIBILITY[slot]) eligibility[normalizedSlot] = SLOT_ELIGIBILITY[slot]!;
      return { slot: normalizedSlot, playerId: starterIds[i] ?? null };
    });

  const benchPlayerIds = playerIds.filter((id) => !starterIds.includes(id));

  return { teamId, starters, benchPlayerIds, players, eligibility };
}
