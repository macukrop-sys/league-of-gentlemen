"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveResponse } from "@/lib/api-types";

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_LIVE_POLL_INTERVAL_MS ?? 15000);

/**
 * Like useLiveScores, but for an arbitrary week (the Matchups page's box
 * scores) instead of always the current one. Only polls when `live` is
 * true — pass that as "is this the league's current week", since a past
 * or future week's data never changes between requests.
 */
export function useWeekView(week: number, initialData: LiveResponse, live: boolean) {
  const [data, setData] = useState(initialData);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigating to a different week hands us fresh server-rendered data — reset to it.
  useEffect(() => {
    setData(initialData);
    setLastUpdated(new Date());
    setError(null);
  }, [week, initialData]);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/week/${week}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = (await res.json()) as LiveResponse;
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  }, [week]);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [live, refresh]);

  return { data, lastUpdated, isRefreshing, error, refresh, pollIntervalMs: POLL_INTERVAL_MS };
}
