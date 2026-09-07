"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveResponse } from "@/lib/api-types";

const POLL_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_LIVE_POLL_INTERVAL_MS ?? 15000);

/**
 * Polls `/api/live` on an interval so the dashboard reflects scoring updates
 * without a manual refresh. Seeded with server-rendered `initialData` so
 * there's no loading flash on first paint; the route itself is backed by
 * the stale-while-revalidate cache layer, so polling this hook aggressively
 * doesn't translate 1:1 into upstream API load.
 */
export function useLiveScores(initialData: LiveResponse) {
  const [data, setData] = useState<LiveResponse>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = (await res.json()) as LiveResponse;
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh live scores");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, error, lastUpdated, isRefreshing, refresh, pollIntervalMs: POLL_INTERVAL_MS };
}
