"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "log-voter-id";

/**
 * A random id scoped to this browser, used to let each viewer vote once per
 * poll without requiring any login system. Persisted in localStorage — it
 * doesn't follow a voter across devices or survive clearing site data, but
 * that's an acceptable tradeoff for a friendly league poll, not a ballot.
 * Returns null until the id is available (first render, before effects run),
 * so callers should treat null as "not ready to vote yet."
 */
export function useVoterId(): string | null {
  const [voterId, setVoterId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, id);
      }
      setVoterId(id);
    } catch {
      // Storage unavailable (private browsing, etc.) — fall back to a
      // session-only id so voting still works, just without persistence.
      setVoterId(crypto.randomUUID());
    }
  }, []);

  return voterId;
}
