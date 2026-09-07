import type {
  Division,
  League,
  LeagueSettings,
  Matchup,
  Player,
  Position,
  Roster,
  RosterSlot,
  Team,
} from "@/lib/types";
import { hashStringToSeed, mulberry32, pickRandom, randNormal } from "@/lib/random";

/**
 * Deterministic mock season for "The League of Gentlemen" — used whenever
 * `SLEEPER_LEAGUE_ID` isn't configured (see `lib/data/provider.ts`). Seeded
 * so every request produces the same season until the seed changes, which
 * keeps the demo stable to develop the UI against.
 */
const SEED = hashStringToSeed("league-of-gentlemen-2025");

export const STARTER_SLOTS: Position[] = ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "DST", "K"];

export const ELIGIBILITY: Record<Position, Position[]> = {
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

const POSITION_BASELINE: Record<Exclude<Position, "FLEX" | "BN" | "IR">, { mean: number; stdDev: number }> = {
  QB: { mean: 19, stdDev: 6.5 },
  RB: { mean: 13, stdDev: 7.2 },
  WR: { mean: 12, stdDev: 7.0 },
  TE: { mean: 8.5, stdDev: 5.0 },
  DST: { mean: 7, stdDev: 4.2 },
  K: { mean: 7.5, stdDev: 3.2 },
};

const NFL_TEAMS = [
  "BUF", "MIA", "NE", "NYJ", "BAL", "CIN", "CLE", "PIT", "HOU", "IND",
  "JAX", "TEN", "DEN", "KC", "LV", "LAC", "DAL", "NYG", "PHI", "WAS",
  "CHI", "DET", "GB", "MIN", "ATL", "CAR", "NO", "TB", "ARI", "LAR",
  "SF", "SEA",
];

const FIRST_NAMES = [
  "Marcus", "Derek", "Jalen", "Tyreek", "Cooper", "Braxton", "Elijah", "Trevor",
  "Xavier", "Dante", "Jaylen", "Mason", "Cade", "Ronnie", "Silas", "Quentin",
  "Bryce", "Deshawn", "Miles", "Julian", "Preston", "Corbin", "Isaiah", "Gunnar",
  "Zion", "Wyatt", "Karim", "Tobias", "Emory", "Lachlan",
];
const LAST_NAMES = [
  "Whitfield", "Danby", "Osei", "Callahan", "Marsh", "Ridgely", "Okafor",
  "Thackeray", "Voss", "Kingsley", "Ashby", "Reyes", "Holloway", "Pruitt",
  "Sandoval", "Fenwick", "Larkspur", "Beaumont", "Castellan", "Wexford",
];

const TEAM_DEFS: { name: string; owner: string; division: string }[] = [
  { name: "The Distinguished Gentlemen", owner: "Reginald Ashworth-Combe", division: "smoking-jacket" },
  { name: "Sir Reginald's Raiders", owner: "Reggie Fairbanks", division: "smoking-jacket" },
  { name: "The Whiskey & Wingbacks", owner: "Nigel Prescott", division: "smoking-jacket" },
  { name: "Lords of the Gridiron", owner: "Edmund Thistlewood", division: "smoking-jacket" },
  { name: "The Pipe & Pigskin Club", owner: "Bartholomew Finch", division: "smoking-jacket" },
  { name: "Earl of Endzone", owner: "Percival Hargrove", division: "smoking-jacket" },
  { name: "The Cravat Crusaders", owner: "Sebastian Wolcott", division: "top-hat" },
  { name: "Dukes of Downfield", owner: "Montgomery Blythe", division: "top-hat" },
  { name: "The Gentleman's Blitz", owner: "Cornelius Pemberton", division: "top-hat" },
  { name: "Baron Von Blitzburgh", owner: "Wilhelm Van Buren", division: "top-hat" },
  { name: "The Tweed Titans", owner: "Alistair Cavendish", division: "top-hat" },
  { name: "Sir Fumble-a-Lot", owner: "Geoffrey Winterbourne", division: "top-hat" },
];

export const LEAGUE_SETTINGS: LeagueSettings = {
  leagueName: "The League of Gentlemen",
  season: 2025,
  numTeams: 12,
  regularSeasonWeeks: 14,
  currentWeek: 9,
  playoffTeams: 6,
  divisionWinnersAutoQualify: true,
  firstRoundByes: 2,
};

/** Circle-method round robin. Returns one round (array of [home, away] pairs) per index. */
function roundRobinRounds(teamIds: string[]): [string, string][][] {
  const arr = [...teamIds];
  const numRounds = arr.length - 1;
  const half = arr.length / 2;
  const rounds: [string, string][][] = [];
  let list = arr;
  for (let r = 0; r < numRounds; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < half; i++) {
      const a = list[i]!;
      const b = list[list.length - 1 - i]!;
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    const fixed = list[0]!;
    const rest = list.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    list = [fixed, ...rest];
  }
  return rounds;
}

function makePlayer(rand: () => number, position: Exclude<Position, "FLEX" | "BN" | "IR">, idx: number): Player {
  const baseline = POSITION_BASELINE[position];
  const skill = 0.7 + rand() * 0.65; // 0.70 - 1.35
  const projectedPoints = Math.max(0, +(baseline.mean * skill + randNormal(rand, 0, baseline.stdDev * 0.25)).toFixed(1));

  // Simulate a mixed Sunday slate: some games final, some live, some not yet kicked off.
  const gameState = rand();
  const gameFinal = gameState < 0.55;
  const gameInProgress = !gameFinal && gameState < 0.72;
  let actualPoints = 0;
  if (gameFinal) {
    actualPoints = Math.max(0, +randNormal(rand, projectedPoints, baseline.stdDev * 0.5).toFixed(1));
  } else if (gameInProgress) {
    const progressFraction = 0.25 + rand() * 0.55;
    actualPoints = Math.max(0, +(randNormal(rand, projectedPoints, baseline.stdDev * 0.5) * progressFraction).toFixed(1));
  }

  return {
    id: `p-${position}-${idx}-${Math.floor(rand() * 1e6)}`,
    name: `${pickRandom(rand, FIRST_NAMES)} ${pickRandom(rand, LAST_NAMES)}`,
    position,
    nflTeam: position === "DST" ? pickRandom(rand, NFL_TEAMS) : pickRandom(rand, NFL_TEAMS),
    projectedPoints,
    actualPoints,
    gameFinal,
    gameInProgress,
  };
}

const BENCH_POOL: Exclude<Position, "FLEX" | "BN" | "IR">[] = ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "K", "DST"];

function generateRoster(teamId: string, rand: () => number): Roster {
  const players: Record<string, Player> = {};
  const starters: RosterSlot[] = [];
  let idx = 0;

  for (const slot of STARTER_SLOTS) {
    const eligiblePositions = ELIGIBILITY[slot];
    const actualPos = pickRandom(rand, eligiblePositions) as Exclude<Position, "FLEX" | "BN" | "IR">;
    const player = makePlayer(rand, actualPos, idx++);
    players[player.id] = player;
    starters.push({ slot, playerId: player.id });
  }

  const benchPlayerIds: string[] = [];
  for (let i = 0; i < 6; i++) {
    const pos = pickRandom(rand, BENCH_POOL);
    const player = makePlayer(rand, pos, idx++);
    players[player.id] = player;
    benchPlayerIds.push(player.id);
  }

  return { teamId, starters, benchPlayerIds, players, eligibility: ELIGIBILITY };
}

function computeStreak(results: ("W" | "L" | "T")[]): string {
  if (results.length === 0) return "-";
  const last = results[results.length - 1]!;
  let count = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === last) count++;
    else break;
  }
  return `${last}${count}`;
}

let cachedLeague: League | null = null;

export function getMockLeague(): League {
  if (cachedLeague) return cachedLeague;
  const rand = mulberry32(SEED);

  const teams: Team[] = TEAM_DEFS.map((def, i) => ({
    id: `team-${i + 1}`,
    name: def.name,
    ownerName: def.owner,
    avatarSeed: def.name,
    divisionId: def.division,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    scoreHistory: [],
    streak: "-",
  }));

  const divisions: Division[] = [
    { id: "smoking-jacket", name: "The Smoking Jacket Division", teamIds: teams.filter((t) => t.divisionId === "smoking-jacket").map((t) => t.id) },
    { id: "top-hat", name: "The Top Hat Division", teamIds: teams.filter((t) => t.divisionId === "top-hat").map((t) => t.id) },
  ];

  // Per-team "true talent" used only to generate a believable season — not exposed.
  const talent = new Map<string, { mean: number; stdDev: number }>();
  for (const t of teams) {
    talent.set(t.id, { mean: 100 + rand() * 32, stdDev: 11 + rand() * 11 });
  }

  const rounds = roundRobinRounds(teams.map((t) => t.id));
  const { currentWeek, regularSeasonWeeks } = LEAGUE_SETTINGS;

  const matchups: Matchup[] = [];
  const resultsByTeam = new Map<string, ("W" | "L" | "T")[]>(teams.map((t) => [t.id, []]));

  for (let week = 1; week <= regularSeasonWeeks; week++) {
    const round = rounds[(week - 1) % rounds.length]!;
    const isPast = week < currentWeek;
    const isCurrent = week === currentWeek;

    for (const [homeId, awayId] of round) {
      let homeScore = 0;
      let awayScore = 0;
      let completed = false;

      if (isPast) {
        const ht = talent.get(homeId)!;
        const at = talent.get(awayId)!;
        homeScore = Math.max(40, +randNormal(rand, ht.mean, ht.stdDev).toFixed(1));
        awayScore = Math.max(40, +randNormal(rand, at.mean, at.stdDev).toFixed(1));
        completed = true;
      } else if (isCurrent) {
        // Live week: score = sum of current-week roster actualPoints (assigned below).
        completed = false;
      }

      matchups.push({ week, homeTeamId: homeId, awayTeamId: awayId, homeScore, awayScore, completed });

      if (isPast) {
        const homeTeam = teams.find((t) => t.id === homeId)!;
        const awayTeam = teams.find((t) => t.id === awayId)!;
        homeTeam.pointsFor += homeScore;
        homeTeam.pointsAgainst += awayScore;
        awayTeam.pointsFor += awayScore;
        awayTeam.pointsAgainst += homeScore;
        homeTeam.scoreHistory[week - 1] = homeScore;
        awayTeam.scoreHistory[week - 1] = awayScore;

        if (homeScore > awayScore) {
          homeTeam.wins++;
          awayTeam.losses++;
          resultsByTeam.get(homeId)!.push("W");
          resultsByTeam.get(awayId)!.push("L");
        } else if (awayScore > homeScore) {
          awayTeam.wins++;
          homeTeam.losses++;
          resultsByTeam.get(awayId)!.push("W");
          resultsByTeam.get(homeId)!.push("L");
        } else {
          homeTeam.ties++;
          awayTeam.ties++;
          resultsByTeam.get(homeId)!.push("T");
          resultsByTeam.get(awayId)!.push("T");
        }
      }
    }
  }

  for (const t of teams) {
    t.pointsFor = +t.pointsFor.toFixed(1);
    t.pointsAgainst = +t.pointsAgainst.toFixed(1);
    t.streak = computeStreak(resultsByTeam.get(t.id)!);
  }

  // Build current-week rosters + fill in the live matchup scores from them.
  const rosters: Record<string, Roster> = {};
  for (const t of teams) {
    rosters[t.id] = generateRoster(t.id, rand);
  }
  for (const m of matchups) {
    if (m.week !== currentWeek) continue;
    m.homeScore = +sumStarterPoints(rosters[m.homeTeamId]!).toFixed(1);
    m.awayScore = +sumStarterPoints(rosters[m.awayTeamId]!).toFixed(1);
  }

  cachedLeague = { settings: LEAGUE_SETTINGS, teams, divisions, matchups, rosters };
  return cachedLeague;
}

function sumStarterPoints(roster: Roster): number {
  return roster.starters.reduce((sum, slot) => {
    if (!slot.playerId) return sum;
    const p = roster.players[slot.playerId];
    return sum + (p?.actualPoints ?? 0);
  }, 0);
}
