"use client";

import { useWeekView } from "@/hooks/useWeekView";
import { MatchupBoxScore } from "./MatchupBoxScore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { LiveResponse } from "@/lib/api-types";

export function MatchupsClient({ week, initialData, isCurrentWeek }: { week: number; initialData: LiveResponse; isCurrentWeek: boolean }) {
  const { data, lastUpdated, isRefreshing, error, refresh, pollIntervalMs } = useWeekView(week, initialData, isCurrentWeek);

  return (
    <div className="space-y-3">
      {isCurrentWeek ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Refreshes every {Math.round(pollIntervalMs / 1000)}s</span>
          <Badge variant="outline" className="gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full bg-success ${isRefreshing ? "animate-pulse-live" : ""}`} />
            Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => refresh()} disabled={isRefreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">Couldn&apos;t refresh: {error}. Showing last known data.</p> : null}

      {data.matchups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No matchups scheduled for this week.</p>
      ) : (
        <div className="space-y-3">
          {data.matchups.map((m, i) => (
            <MatchupBoxScore
              key={`${m.homeTeam?.id}-${m.awayTeam?.id}`}
              matchup={m}
              homeRoster={m.homeTeam ? data.rosters[m.homeTeam.id] : undefined}
              awayRoster={m.awayTeam ? data.rosters[m.awayTeam.id] : undefined}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
