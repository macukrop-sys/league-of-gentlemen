import { getKv, isKvConfigured } from "./kv";
import type { Poll, PollResults } from "./types";

const countsKey = (pollId: string) => `poll:${pollId}:counts`;
const voterKey = (pollId: string, voterId: string) => `poll:${pollId}:voter:${voterId}`;

export { isKvConfigured };

/**
 * Current vote counts for a poll, plus this voter's own choice if they've
 * already voted. Returns all-zero counts (never throws) when the Redis
 * store isn't configured yet, so the UI can still render poll questions
 * before the commissioner finishes setup.
 */
export async function getPollResults(poll: Poll, voterId: string | null): Promise<PollResults> {
  const counts = Object.fromEntries(poll.options.map((o) => [o.id, 0]));

  if (!isKvConfigured()) {
    return { pollId: poll.id, counts, total: 0, myChoice: null };
  }

  const redis = getKv();
  const [stored, myChoice] = await Promise.all([
    redis.hgetall<Record<string, string>>(countsKey(poll.id)),
    voterId ? redis.get<string>(voterKey(poll.id, voterId)) : Promise.resolve(null),
  ]);

  if (stored) {
    for (const [optionId, value] of Object.entries(stored)) {
      if (optionId in counts) counts[optionId] = Number(value) || 0;
    }
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return { pollId: poll.id, counts, total, myChoice: myChoice ?? null };
}

export type VoteOutcome =
  | { ok: true; results: PollResults }
  | { ok: false; reason: "already-voted" | "not-configured" | "invalid-option"; results?: PollResults };

/**
 * Casts one vote for `optionId`, atomically rejecting a second vote from the
 * same `voterId` via Redis's SETNX (set-if-not-exists) — the increment only
 * runs for the browser that wins the race to claim `voterKey`.
 */
export async function castVote(poll: Poll, optionId: string, voterId: string): Promise<VoteOutcome> {
  if (!isKvConfigured()) return { ok: false, reason: "not-configured" };
  if (!poll.options.some((o) => o.id === optionId)) return { ok: false, reason: "invalid-option" };

  const redis = getKv();
  const claimed = await redis.setnx(voterKey(poll.id, voterId), optionId);
  if (claimed === 0) {
    return { ok: false, reason: "already-voted", results: await getPollResults(poll, voterId) };
  }

  await redis.hincrby(countsKey(poll.id), optionId, 1);
  return { ok: true, results: await getPollResults(poll, voterId) };
}
