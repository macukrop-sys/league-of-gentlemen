"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Poll, PollResults } from "@/lib/polls/types";

export function PollCard({
  week,
  poll,
  results,
  loading,
  voterId,
  onVoted,
}: {
  week: number;
  poll: Poll;
  results: PollResults | null;
  loading: boolean;
  voterId: string | null;
  onVoted: (results: PollResults) => void;
}) {
  const [submittingOption, setSubmittingOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = results?.total ?? 0;
  const myChoice = results?.myChoice ?? null;
  const hasVoted = Boolean(myChoice);
  const canVote = Boolean(voterId) && !hasVoted && !loading && submittingOption === null;

  async function vote(optionId: string) {
    if (!voterId || hasVoted || submittingOption !== null) return;
    setSubmittingOption(optionId);
    setError(null);
    try {
      const res = await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week, pollId: poll.id, optionId, voterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't record your vote.");
        return;
      }
      onVoted(data.results as PollResults);
    } catch {
      setError("Couldn't record your vote — check your connection.");
    } finally {
      setSubmittingOption(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground">{poll.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {poll.options.map((option) => {
          const count = results?.counts[option.id] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isMine = myChoice === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={!canVote}
              onClick={() => vote(option.id)}
              className={cn(
                "relative w-full overflow-hidden rounded-md border px-3 py-2 text-left text-sm transition-colors",
                isMine ? "border-primary" : "border-border",
                canVote ? "hover:bg-accent" : "cursor-default",
              )}
            >
              {hasVoted ? <span className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${pct}%` }} aria-hidden /> : null}
              <span className="relative flex items-center justify-between gap-2">
                <span className={cn("font-medium", isMine ? "text-primary" : "text-foreground")}>
                  {option.label}
                  {isMine ? " · your pick" : ""}
                </span>
                {hasVoted ? (
                  <span className="font-tabular text-xs text-muted-foreground">
                    {pct}% &middot; {count}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
        {hasVoted ? (
          <p className="pt-1 text-xs text-muted-foreground">
            {total} vote{total === 1 ? "" : "s"} so far.
          </p>
        ) : null}
        {error ? <p className="pt-1 text-xs text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
