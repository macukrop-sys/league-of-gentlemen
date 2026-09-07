"use client";

import { useEffect, useState } from "react";
import { useVoterId } from "@/hooks/useVoterId";
import { PollCard } from "./PollCard";
import type { Poll, PollResults } from "@/lib/polls/types";

interface PollsApiResponse {
  configured: boolean;
  results: PollResults[];
}

/**
 * Fetches live results (and this browser's own vote, if any) once the
 * voter id is ready, then re-fetches after every vote elsewhere doesn't
 * matter — each vote's response already carries the freshest counts for
 * that one poll, so only the initial load needs a round trip per poll set.
 */
export function PollsClient({ week, initialPolls }: { week: number; initialPolls: Poll[] }) {
  const voterId = useVoterId();
  const [resultsByPoll, setResultsByPoll] = useState<Record<string, PollResults> | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!voterId) return;
    let cancelled = false;
    setLoading(true);

    fetch(`/api/polls?week=${week}&voterId=${encodeURIComponent(voterId)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: PollsApiResponse) => {
        if (cancelled) return;
        setConfigured(data.configured);
        setResultsByPoll(Object.fromEntries(data.results.map((r) => [r.pollId, r])));
      })
      .catch(() => {
        if (!cancelled) setConfigured(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [week, voterId]);

  function handleVoted(pollId: string, updated: PollResults) {
    setResultsByPoll((prev) => ({ ...(prev ?? {}), [pollId]: updated }));
  }

  if (initialPolls.length === 0) {
    return <p className="text-sm text-muted-foreground">No matchups to poll for this week.</p>;
  }

  return (
    <div className="space-y-4">
      {configured === false ? (
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Polls aren&apos;t connected to shared storage yet, so votes won&apos;t be saved or shared across the league. Ask the commissioner to finish
          the Redis setup.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {initialPolls.map((poll) => (
          <PollCard
            key={poll.id}
            week={week}
            poll={poll}
            results={resultsByPoll?.[poll.id] ?? null}
            loading={loading}
            voterId={voterId}
            onVoted={(updated) => handleVoted(poll.id, updated)}
          />
        ))}
      </div>
    </div>
  );
}
