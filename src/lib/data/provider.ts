import type { League } from "@/lib/types";
import { getMockLeague } from "./mockLeague";
import { fetchLeagueFromSleeper } from "@/lib/sleeper/adapter";
import { fetchLeagueFromEspn } from "@/lib/espn/adapter";
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

export type DataSourceName = "ESPN" | "Sleeper" | "Demo";

/** Which provider `getLeague()` is actually using — drives the "Live ESPN data" / "Demo data" badge in the header. */
export function getDataSourceName(): DataSourceName {
  if (process.env.ESPN_LEAGUE_ID?.trim()) return "ESPN";
  if (process.env.SLEEPER_LEAGUE_ID?.trim()) return "Sleeper";
  return "Demo";
}
