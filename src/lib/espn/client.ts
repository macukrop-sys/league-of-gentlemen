import { cache, CACHE_TTL } from "@/lib/cache";
import type { EspnBoxscoreResponse, EspnLeagueResponse } from "./types";

const BASE = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons";

/**
 * Private ESPN leagues require the `espn_s2` and `SWID` cookies from a
 * logged-in browser session (there is no API-key auth). Public leagues
 * need neither. See `src/lib/espn/adapter.ts` header comment for how to
 * obtain them.
 */
function authHeaders(): HeadersInit {
  const s2 = process.env.ESPN_S2;
  const swid = process.env.ESPN_SWID;
  if (s2 && swid) {
    return { cookie: `espn_s2=${s2}; SWID=${swid}`, accept: "application/json" };
  }
  return { accept: "application/json" };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `ESPN API ${res.status} for ${url} — this is likely a private league; set ESPN_S2 and ESPN_SWID (see src/lib/espn/adapter.ts).`,
    );
  }
  if (!res.ok) throw new Error(`ESPN API ${res.status} for ${url}`);
  return (await res.json()) as T;
}

/** Season-level league data: teams, records, settings, and the full-season matchup schedule. */
export function getLeague(leagueId: string, season: number): Promise<EspnLeagueResponse> {
  const url = `${BASE}/${season}/segments/0/leagues/${leagueId}?view=mTeam&view=mSettings&view=mMatchupScore`;
  return cache.getOrFetchSWR(`espn:league:${leagueId}:${season}`, CACHE_TTL.liveScores, () => fetchJson(url));
}

/** Per-week boxscore: player-level rosters + actual/projected points for one scoring period. */
export function getBoxscore(leagueId: string, season: number, scoringPeriodId: number, live: boolean): Promise<EspnBoxscoreResponse> {
  const url = `${BASE}/${season}/segments/0/leagues/${leagueId}?view=mBoxscore&view=mMatchupScore&scoringPeriodId=${scoringPeriodId}`;
  const key = `espn:boxscore:${leagueId}:${season}:${scoringPeriodId}`;
  return live ? cache.getOrFetchSWR(key, CACHE_TTL.liveScores, () => fetchJson(url)) : cache.getOrFetch(key, CACHE_TTL.staticPlayerData, () => fetchJson(url));
}
