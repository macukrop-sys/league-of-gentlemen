import type { League, Roster } from "@/lib/types";
import { getMockLeague, getMockRosterSnapshotForWeek } from "./mockLeague";
import { fetchLeagueFromSleeper, fetchSleeperRosterSnapshot } from "@/lib/sleeper/adapter";
import { fetchLeagueFromEspn, fetchEspnRosterSnapshot } from "@/lib/espn/adapter";
import { cache, CACHE_TTL } from "@/lib/cache";

/**
 * Single entry point every API route / server component uses to get league
 * data. Checks providers in order — ESPN, then Sleeper, then the
 * deterministic mock "League of Gentlemen" season — so setting just one
 * env var is enough to go live, and leaving all of them unset runs fully
 * offline with no API keys.
 */
export async function getLeague(): Promise<League> {
  const espnLeagueId = process.env.ESPN_LEAGUE_ID?.trim();
  if (espnLeagueId) {
    const season = Number(process.env.ESPN_SEASON ?? new Date().getFullYear());
    return cache.getOrFetchSWR(`league:espn:${espnLeagueId}:${season}`, CACHE_TTL.liveScores, () =>
      fetchLeagueFromEspn(espnLeagueId, season),
    );
  }

  const sleeperLeagueId = process.env.SLEEPER_LEAGUE_ID?.trim();
  if (sleeperLeagueId) {
    return cache.getOrFetchSWR(`league:sleeper:${sleeperLeagueId}`, CACHE_TTL.liveScores, () => fetchLeagueFromSleeper(sleeperLeagueId));
  }

  return getMockLeague();
}

/**
 * Full roster snapshot (starters + bench, per-player points) for an
 * arbitrary week — powers the week-by-week box score page. Uses the same
 * provider precedence as `getLeague()`, so it always matches whichever
 * source is actually configured.
 */
export async function getRostersForWeek(league: League, week: number): Promise<Record<string, Roster>> {
  const isLive = week === league.settings.currentWeek;

  const espnLeagueId = process.env.ESPN_LEAGUE_ID?.trim();
  if (espnLeagueId) {
    const season = Number(process.env.ESPN_SEASON ?? new Date().getFullYear());
    const ttl = isLive ? CACHE_TTL.liveScores : CACHE_TTL.staticPlayerData;
    return cache.getOrFetchSWR(`rosters:espn:${espnLeagueId}:${season}:${week}`, ttl, () =>
      fetchEspnRosterSnapshot(espnLeagueId, season, week, isLive),
    );
  }

  const sleeperLeagueId = process.env.SLEEPER_LEAGUE_ID?.trim();
  if (sleeperLeagueId) {
    const ttl = isLive ? CACHE_TTL.liveScores : CACHE_TTL.staticPlayerData;
    return cache.getOrFetchSWR(`rosters:sleeper:${sleeperLeagueId}:${week}`, ttl, () =>
      fetchSleeperRosterSnapshot(sleeperLeagueId, week, isLive),
    );
  }

  return getMockRosterSnapshotForWeek(week);
}

export type DataSourceName = "ESPN" | "Sleeper" | "Demo";

/** Which provider `getLeague()` is actually using — drives the "Live ESPN data" / "Demo data" badge in the header. */
export function getDataSourceName(): DataSourceName {
  if (process.env.ESPN_LEAGUE_ID?.trim()) return "ESPN";
  if (process.env.SLEEPER_LEAGUE_ID?.trim()) return "Sleeper";
  return "Demo";
}
