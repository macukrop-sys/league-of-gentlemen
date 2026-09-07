import { Redis } from "@upstash/redis";

/**
 * Shared Redis store for poll votes, so results are visible to every
 * leaguemate rather than just whoever's browser cast the vote.
 *
 * Vercel's own "Vercel KV" product is deprecated in favor of Marketplace
 * database integrations (Upstash Redis being the direct successor), so this
 * talks to Upstash's REST API directly via `@upstash/redis` instead of the
 * deprecated `@vercel/kv` wrapper. It accepts either env var naming —
 * `KV_REST_API_URL` / `KV_REST_API_TOKEN` (what Vercel's Redis integration
 * still injects for backward compatibility) or `UPSTASH_REDIS_REST_URL` /
 * `UPSTASH_REDIS_REST_TOKEN` (Upstash's own naming) — so this works however
 * the store ends up provisioned.
 */

let client: Redis | null = null;

function credentials(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export function isKvConfigured(): boolean {
  return credentials() !== null;
}

/** Throws if called without the store configured — always check `isKvConfigured()` first. */
export function getKv(): Redis {
  if (client) return client;
  const creds = credentials();
  if (!creds) {
    throw new Error(
      "No Redis store configured — set KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN) in your Vercel project's environment variables.",
    );
  }
  client = new Redis(creds);
  return client;
}
