import { cache, CACHE_TTL } from "@/lib/cache";
import type {
  SleeperLeague,
  SleeperMatchup,
  SleeperNflState,
  SleeperPlayer,
  SleeperRoster,
  SleeperUser,
} from "./types";

const BASE = "https://api.sleeper.app/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Sleeper API ${res.status} for ${url}`);
  return (await res.json()) as T;
}

export function getLeague(leagueId: string): Promise<SleeperLeague> {
  return cache.getOrFetch(`sleeper:league:${leagueId}`, CACHE_TTL.standings, () =>
    fetchJson(`${BASE}/league/${leagueId}`),
  );
}

export function getRosters(leagueId: string): Promise<SleeperRoster[]> {
  return cache.getOrFetchSWR(`sleeper:rosters:${leagueId}`, CACHE_TTL.liveScores, () =>
    fetchJson(`${BASE}/league/${leagueId}/rosters`),
  );
}

export function getUsers(leagueId: string): Promise<SleeperUser[]> {
  return cache.getOrFetch(`sleeper:users:${leagueId}`, CACHE_TTL.standings, () =>
    fetchJson(`${BASE}/league/${leagueId}/users`),
  );
}

export function getMatchupsForWeek(leagueId: string, week: number, opts?: { live?: boolean }): Promise<SleeperMatchup[]> {
  const ttl = opts?.live ? CACHE_TTL.liveScores : CACHE_TTL.staticPlayerData;
  const fetchFn = () => fetchJson<SleeperMatchup[]>(`${BASE}/league/${leagueId}/matchups/${week}`);
  return opts?.live
    ? cache.getOrFetchSWR(`sleeper:matchups:${leagueId}:${week}`, ttl, fetchFn)
    : cache.getOrFetch(`sleeper:matchups:${leagueId}:${week}`, ttl, fetchFn);
}

export function getNflState(): Promise<SleeperNflState> {
  return cache.getOrFetchSWR("sleeper:nfl-state", CACHE_TTL.liveScores, () => fetchJson(`${BASE}/state/nfl`));
}

/** ~5MB payload of every NFL player Sleeper knows about — cache aggressively. */
export function getAllPlayers(): Promise<Record<string, SleeperPlayer>> {
  return cache.getOrFetch("sleeper:players:nfl", CACHE_TTL.staticPlayerData, () => fetchJson(`${BASE}/players/nfl`));
}
