import type { League, Matchup, Player, Position, Roster, RosterSlot, Team } from "@/lib/types";
import { getBoxscore, getLeague } from "./client";
import type { EspnPlayer, EspnRosterEntry, EspnTeam } from "./types";

/**
 * Translates a real ESPN league into the app's internal `League` shape —
 * the ESPN sibling of `lib/sleeper/adapter.ts`. Same role: this is the only
 * file that needs to change to point the analytics engine (stats, Monte
 * Carlo sim, live dashboard) at ESPN instead of another platform.
 *
 * ## Auth
 * ESPN's fantasy API has no key-based auth — only cookies:
 *  - **Public league:** no cookies needed, just `ESPN_LEAGUE_ID` + `ESPN_SEASON`.
 *  - **Private league:** set `ESPN_S2` and `ESPN_SWID` too. Get them from a
 *    browser logged into fantasy.espn.com: open DevTools → Application →
 *    Cookies → `fantasy.espn.com`, copy the `espn_s2` value (long string)
 *    and `SWID` value (a GUID *including* the curly braces). Treat these
 *    like a password — they're a live session credential — put them in
 *    `.env.local` (already gitignored), never commit them.
 *
 * ## Known limitations of this API (undocumented, reverse-engineered)
 *  - Field shapes have drifted across ESPN seasons before; if this throws
 *    on a real league, the fix is almost always adjusting `types.ts` to
 *    match what that league's response actually contains.
 *  - `LINEUP_SLOT_ELIGIBILITY` / `POSITION_BY_ID` cover standard
 *    QB/RB/WR/TE/FLEX/D-ST/K leagues. A league with IDP (individual defensive
 *    player) slots or superflex will have extra slot ids not mapped here —
 *    unmapped slots are skipped rather than crashing the adapter.
 *  - Unlike Sleeper, ESPN *does* expose pre-game projections
 *    (`statSourceId: 1`), which is what makes `projectedPoints` actually
 *    meaningful here before kickoff.
 */
export async function fetchLeagueFromEspn(leagueId: string, season: number): Promise<League> {
  const leagueData = await getLeague(leagueId, season);

  const currentWeek = Math.min(leagueData.status.currentMatchupPeriod, leagueData.settings.scheduleSettings.matchupPeriodCount);
  const regularSeasonWeeks = leagueData.settings.scheduleSettings.matchupPeriodCount;
  const playoffTeams = leagueData.settings.scheduleSettings.playoffTeamCount;
  const divisionDefs = leagueData.settings.scheduleSettings.divisions ?? [];
  const hasDivisions = divisionDefs.length > 1;

  const memberById = new Map(leagueData.members.map((m) => [m.id, m]));

  const teams: Team[] = leagueData.teams.map((t) => ({
    id: `espn-${t.id}`,
    name: teamName(t),
    ownerName: t.owners?.[0] ? memberById.get(t.owners[0])?.displayName ?? "Unknown Manager" : "Unknown Manager",
    avatarSeed: `espn-${t.id}`,
    divisionId: hasDivisions ? `division-${t.divisionId ?? 0}` : "league",
    wins: t.record.overall.wins,
    losses: t.record.overall.losses,
    ties: t.record.overall.ties,
    pointsFor: t.record.overall.pointsFor,
    pointsAgainst: t.record.overall.pointsAgainst,
    scoreHistory: [],
    streak: "-",
  }));
  const espnIdToTeamId = new Map(leagueData.teams.map((t) => [t.id, `espn-${t.id}`]));

  const divisions = hasDivisions
    ? divisionDefs.map((d) => ({
        id: `division-${d.id}`,
        name: d.name,
        teamIds: teams.filter((t) => t.divisionId === `division-${d.id}`).map((t) => t.id),
      }))
    : [{ id: "league", name: "The League", teamIds: teams.map((t) => t.id) }];

  const matchups: Matchup[] = [];
  for (const m of leagueData.schedule) {
    const homeTeamId = espnIdToTeamId.get(m.home.teamId);
    const awayTeamId = m.away ? espnIdToTeamId.get(m.away.teamId) : undefined;
    if (!homeTeamId || !awayTeamId) continue; // bye week
    const completed = m.matchupPeriodId < currentWeek && m.winner !== "UNDECIDED";
    matchups.push({
      week: m.matchupPeriodId,
      homeTeamId,
      awayTeamId,
      homeScore: m.home.totalPoints,
      awayScore: m.away?.totalPoints ?? 0,
      completed,
    });
    if (completed) {
      const homeTeam = teams.find((t) => t.id === homeTeamId)!;
      const awayTeam = teams.find((t) => t.id === awayTeamId)!;
      homeTeam.scoreHistory[m.matchupPeriodId - 1] = m.home.totalPoints;
      awayTeam.scoreHistory[m.matchupPeriodId - 1] = m.away?.totalPoints ?? 0;
    }
  }

  for (const t of teams) t.streak = computeStreak(t.id, matchups);

  const rostersOut = await fetchEspnRosterSnapshot(leagueId, season, currentWeek, true);

  return {
    settings: {
      leagueName: leagueData.settings.name,
      season: leagueData.seasonId,
      numTeams: teams.length,
      regularSeasonWeeks,
      currentWeek,
      playoffTeams,
      divisionWinnersAutoQualify: hasDivisions,
      firstRoundByes: Number(process.env.ESPN_FIRST_ROUND_BYES ?? 2),
    },
    teams,
    divisions,
    matchups,
    rosters: rostersOut,
  };
}

/**
 * Roster snapshot (every team's starters + bench, with that week's actual
 * and projected points) for a single week — the current week (used by
 * `fetchLeagueFromEspn` above) or any other, for the week-by-week box
 * score page. `isLive` controls cache TTL, not correctness: pass true only
 * for the currently-in-progress week.
 */
export async function fetchEspnRosterSnapshot(leagueId: string, season: number, week: number, isLive: boolean): Promise<Record<string, Roster>> {
  const leagueData = await getLeague(leagueId, season);
  const espnIdToTeamId = new Map(leagueData.teams.map((t) => [t.id, `espn-${t.id}`]));
  const regularSeasonWeeks = leagueData.settings.scheduleSettings.matchupPeriodCount;

  const boxscore = await getBoxscore(leagueId, season, week, isLive);
  const rostersOut: Record<string, Roster> = {};
  for (const m of boxscore.schedule) {
    if (m.matchupPeriodId !== week) continue;
    for (const side of [m.home, m.away]) {
      if (!side) continue;
      const teamId = espnIdToTeamId.get(side.teamId);
      if (!teamId || !side.rosterForCurrentScoringPeriod) continue;
      rostersOut[teamId] = buildRoster(teamId, side.rosterForCurrentScoringPeriod.entries, week, regularSeasonWeeks);
    }
  }
  return rostersOut;
}

function teamName(t: EspnTeam): string {
  if (t.name) return t.name;
  return [t.location, t.nickname].filter(Boolean).join(" ") || `Team ${t.id}`;
}

function computeStreak(teamId: string, matchups: Matchup[]): string {
  const completed = matchups
    .filter((m) => m.completed && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => a.week - b.week);
  if (completed.length === 0) return "-";
  const results = completed.map((m) => {
    const isHome = m.homeTeamId === teamId;
    const my = isHome ? m.homeScore : m.awayScore;
    const opp = isHome ? m.awayScore : m.homeScore;
    return my === opp ? "T" : my > opp ? "W" : "L";
  });
  const last = results[results.length - 1]!;
  let count = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) count++;
  return `${last}${count}`;
}

/** ESPN lineup slot id -> our Position + which positions are eligible there. Unmapped slots (IDP, etc.) are skipped. */
const LINEUP_SLOT: Record<number, { slot: Position; eligibility: Position[] }> = {
  0: { slot: "QB", eligibility: ["QB"] },
  2: { slot: "RB", eligibility: ["RB"] },
  4: { slot: "WR", eligibility: ["WR"] },
  6: { slot: "TE", eligibility: ["TE"] },
  23: { slot: "FLEX", eligibility: ["RB", "WR", "TE"] },
  3: { slot: "FLEX", eligibility: ["RB", "WR"] },
  16: { slot: "DST", eligibility: ["DST"] },
  17: { slot: "K", eligibility: ["K"] },
  20: { slot: "BN", eligibility: [] },
  21: { slot: "IR", eligibility: [] },
};

const POSITION_BY_ID: Record<number, Player["position"]> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  16: "DST",
};

/** ESPN's numeric NFL team ids -> abbreviation. Community-sourced; ESPN doesn't publish this mapping. */
const PRO_TEAM_ABBREV: Record<number, string> = {
  1: "ATL", 2: "BUF", 3: "CHI", 4: "CIN", 5: "CLE", 6: "DAL", 7: "DEN", 8: "DET",
  9: "GB", 10: "TEN", 11: "IND", 12: "KC", 13: "LV", 14: "LAR", 15: "MIA", 16: "MIN",
  17: "NE", 18: "NO", 19: "NYG", 20: "NYJ", 21: "PHI", 22: "ARI", 23: "PIT", 24: "LAC",
  25: "SF", 26: "SEA", 27: "TB", 28: "WAS", 29: "CAR", 30: "JAX", 33: "BAL", 34: "HOU",
};

function playerPoints(p: EspnPlayer, week: number, statSourceId: 0 | 1): number {
  return p.stats?.find((s) => s.scoringPeriodId === week && s.statSourceId === statSourceId)?.appliedTotal ?? 0;
}

/**
 * ESPN's boxscore response embeds a player's `stats` for every scoring
 * period they've played, not just the one this fetch is scoped to — so
 * the whole season's game log rides along for free with whatever week's
 * roster you were already fetching. Skips weeks with no data on either
 * side (bye week, not yet played, or truly scored zero on a bye — an
 * edge case not worth telling apart from "no data" here).
 */
function buildGameLog(espnPlayer: EspnPlayer, regularSeasonWeeks: number): { week: number; actualPoints: number; projectedPoints: number }[] {
  const log: { week: number; actualPoints: number; projectedPoints: number }[] = [];
  for (let week = 1; week <= regularSeasonWeeks; week++) {
    const hasEntry = espnPlayer.stats?.some((s) => s.scoringPeriodId === week);
    if (!hasEntry) continue;
    log.push({ week, actualPoints: playerPoints(espnPlayer, week, 0), projectedPoints: playerPoints(espnPlayer, week, 1) });
  }
  return log;
}

function buildRoster(teamId: string, entries: EspnRosterEntry[], week: number, regularSeasonWeeks: number): Roster {
  const players: Record<string, Player> = {};
  const starters: RosterSlot[] = [];
  const benchPlayerIds: string[] = [];
  const eligibility: Record<Position, Position[]> = {
    QB: ["QB"], RB: ["RB"], WR: ["WR"], TE: ["TE"], FLEX: ["RB", "WR", "TE"], DST: ["DST"], K: ["K"], BN: [], IR: [],
  };

  for (const entry of entries) {
    const espnPlayer = entry.playerPoolEntry.player;
    const actualPoints = playerPoints(espnPlayer, week, 0);
    const projectedPoints = playerPoints(espnPlayer, week, 1);
    const player: Player = {
      id: String(espnPlayer.id),
      name: espnPlayer.fullName,
      position: POSITION_BY_ID[espnPlayer.defaultPositionId] ?? "WR",
      nflTeam: PRO_TEAM_ABBREV[espnPlayer.proTeamId] ?? "FA",
      projectedPoints,
      actualPoints,
      // ESPN doesn't expose a boolean "game is live/final" flag on this
      // endpoint; a non-zero actual score is our best signal a game has
      // started. See Sleeper adapter's header comment for the same tradeoff.
      gameFinal: false,
      gameInProgress: actualPoints > 0,
      gameLog: buildGameLog(espnPlayer, regularSeasonWeeks),
    };
    players[player.id] = player;

    const slotDef = LINEUP_SLOT[entry.lineupSlotId];
    if (!slotDef) continue; // unmapped (IDP, etc.) — skip rather than guess
    if (slotDef.slot === "BN" || slotDef.slot === "IR") {
      benchPlayerIds.push(player.id);
    } else {
      starters.push({ slot: slotDef.slot, playerId: player.id });
      eligibility[slotDef.slot] = slotDef.eligibility;
    }
  }

  return { teamId, starters, benchPlayerIds, players, eligibility };
}
