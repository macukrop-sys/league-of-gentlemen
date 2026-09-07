/**
 * In-memory TTL cache with stale-while-revalidate + request coalescing.
 *
 * This is what stands between the live dashboard's polling and hammering
 * the upstream fantasy API: a burst of concurrent requests for the same key
 * shares one in-flight fetch, and once fresh data goes stale we keep
 * serving the last good value instantly while refreshing in the background
 * instead of making every request wait on the network.
 *
 * Scope note: this is process-local (a Map), which is fine for a single
 * Next.js server instance or local dev. A multi-instance/serverless
 * production deployment should swap the backing store for Redis/Upstash —
 * the public interface here (get/set/getOrFetch/getOrFetchSWR) is small
 * enough to reimplement against one without touching call sites.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  /** value remains servable (stale) until this time while a refresh runs in the background */
  staleUntil: number;
}

class TTLCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inflight = new Map<string, Promise<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.staleUntil) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number, staleMs = ttlMs * 3): void {
    const now = Date.now();
    this.store.set(key, { value, expiresAt: now + ttlMs, staleUntil: now + ttlMs + staleMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Simple fetch-through cache: block until fresh data if nothing cached. */
  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.store.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() < cached.expiresAt) return cached.value;
    return this.coalesce(key, ttlMs, fetcher);
  }

  /**
   * Stale-while-revalidate: if we have any usable (even stale) value, return
   * it immediately and kick a background refresh; only blocks callers when
   * there is truly nothing cached yet.
   */
  async getOrFetchSWR<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.store.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();
    if (cached && now < cached.expiresAt) return cached.value;
    if (cached && now < cached.staleUntil) {
      if (!this.inflight.has(key)) void this.coalesce(key, ttlMs, fetcher).catch(() => undefined);
      return cached.value;
    }
    return this.coalesce(key, ttlMs, fetcher);
  }

  private coalesce<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = fetcher()
      .then((value) => {
        this.set(key, value, ttlMs);
        this.inflight.delete(key);
        return value;
      })
      .catch((err) => {
        this.inflight.delete(key);
        throw err;
      });
    this.inflight.set(key, promise);
    return promise;
  }
}

/** Process-wide singleton — Next.js route handlers all share this instance. */
export const cache = new TTLCache();

export const CACHE_TTL = {
  liveScores: 15_000, // matches NEXT_PUBLIC_LIVE_POLL_INTERVAL_MS default
  standings: 60_000,
  simulation: 5 * 60_000,
  staticPlayerData: 24 * 60 * 60_000,
} as const;
