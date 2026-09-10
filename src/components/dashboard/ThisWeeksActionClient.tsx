"use client";

import Link from "next/link";
import { useLiveScores } from "@/hooks/useLiveScores";
import { MatchupCard } from "@/components/dashboard/MatchupCard";
import { Badge } from "@/components/ui/badge";
import type { LiveResponse } from "@/lib/api-types";
import { ArrowRight } from "lucide-react";

/**
 * The homepage's "This Week's Action" section — the first thing anyone
 * sees, and exactly what someone watching a live game would be staring at.
 * It used to be rendered straight from the server-computed `live` view with
 * no refresh mechanism at all, so scores froze at whatever they were when
 * the page first loaded and never moved again without a manual reload —
 * unlike /live and /matchups, which both poll. This wraps the same
 * MatchupCard grid in `useLiveScores` so the homepage behaves the same way.
 */
export function ThisWeeksActionClient({ initialData }: { initialData: LiveResponse }) {
  const { data, isRefreshing, lastUpdated } = useLiveScores(initialData);
  const optimalByTeamId = new Map(data.optimalLineups.map((o) => [o.teamId, o]));

  const closest = [...data.matchups]
    .filter((m) => m.winProbability)
    .sort((a, b) => Math.abs(a.winProbability!.homeWinProb - 0.5) - Math.abs(b.winProbability!.homeWinProb - 0.5))[0];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">This Week&apos;s Action</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-[10px]">
            <span className={`h-1.5 w-1.5 rounded-full bg-success ${isRefreshing ? "animate-pulse-live" : ""}`} />
            Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Link href="/live" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Full live dashboard <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      {closest ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Closest race: <span className="font-medium text-foreground">{closest.homeTeam?.name}</span> vs{" "}
          <span className="font-medium text-foreground">{closest.awayTeam?.name}</span> — a coin flip at{" "}
          {Math.round((closest.winProbability?.homeWinProb ?? 0.5) * 100)}%.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.matchups.map((m) => (
          <MatchupCard key={`${m.homeTeam?.id}-${m.awayTeam?.id}`} matchup={m} optimalByTeamId={optimalByTeamId} />
        ))}
      </div>
    </div>
  );
}
