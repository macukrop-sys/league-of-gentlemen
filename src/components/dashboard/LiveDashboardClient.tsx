"use client";

import { useLiveScores } from "@/hooks/useLiveScores";
import { MatchupCard } from "@/components/dashboard/MatchupCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LiveResponse } from "@/lib/api-types";
import { formatPoints } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function LiveDashboardClient({ initialData }: { initialData: LiveResponse }) {
  const { data, error, lastUpdated, isRefreshing, refresh, pollIntervalMs } = useLiveScores(initialData);
  const teamsById = new Map(data.teams.map((t) => [t.id, t]));
  const optimalByTeamId = new Map(data.optimalLineups.map((o) => [o.teamId, o]));

  const benchWatch = [...data.optimalLineups]
    .filter((o) => o.pointsLeftOnBench > 0.4)
    .sort((a, b) => b.pointsLeftOnBench - a.pointsLeftOnBench);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">Live Analytics — Week {data.week}</h1>
          <p className="text-sm text-muted-foreground">Optimal lineups, projected finals, and win probability — refreshes every {Math.round(pollIntervalMs / 1000)}s.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full bg-success ${isRefreshing ? "animate-pulse-live" : ""}`} />
            Updated {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => refresh()} disabled={isRefreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">Couldn&apos;t refresh live scores: {error}. Showing last known data.</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.matchups.map((m) => (
          <MatchupCard key={`${m.homeTeam?.id}-${m.awayTeam?.id}`} matchup={m} optimalByTeamId={optimalByTeamId} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Optimal Lineup Watch</CardTitle>
          <p className="text-xs text-muted-foreground">
            Teams leaving points on the bench, ranked by how many. Totals blend live scores (for games underway or final) with pre-game projections (for
            games yet to start) — so they can differ from the live score shown above, which is actual points only.
          </p>
        </CardHeader>
        <CardContent>
          {benchWatch.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Every team has their optimal lineup in right now. Impressive.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Current Lineup</TableHead>
                  <TableHead className="text-right">Optimal Lineup</TableHead>
                  <TableHead className="text-right">Left on Bench</TableHead>
                  <TableHead>Suggested Swap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchWatch.map((o) => {
                  const roster = data.rosters[o.teamId];
                  const topSwap = o.suggestedSwaps[0];
                  const benchPlayer = topSwap && roster ? roster.players[topSwap.benchPlayerId] : undefined;
                  const startingPlayer = topSwap && roster ? roster.players[topSwap.startingPlayerId] : undefined;
                  return (
                    <TableRow key={o.teamId}>
                      <TableCell className="font-medium">{teamsById.get(o.teamId)?.name}</TableCell>
                      <TableCell className="text-right font-tabular">{formatPoints(o.actualPoints)}</TableCell>
                      <TableCell className="text-right font-tabular">{formatPoints(o.optimalPoints)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">+{formatPoints(o.pointsLeftOnBench)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {benchPlayer && startingPlayer ? (
                          <>
                            Start <span className="font-medium text-foreground">{benchPlayer.name}</span> ({topSwap!.slot}) over{" "}
                            <span className="font-medium text-foreground">{startingPlayer.name}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
