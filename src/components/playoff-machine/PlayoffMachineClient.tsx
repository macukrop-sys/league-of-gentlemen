"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchupToggle } from "./MatchupToggle";
import { StandingsPreview } from "./StandingsPreview";
import { usePlayoffMachineStore } from "@/store/usePlayoffMachineStore";
import { resolveScenario, matchupKey, type LeagueForScenario } from "@/lib/simulation/scenario";
import { Shuffle, RotateCcw } from "lucide-react";

function teamAverage(scoreHistory: number[]): number {
  const scores = scoreHistory.filter((s): s is number => typeof s === "number");
  if (scores.length === 0) return 110;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function PlayoffMachineClient({ league }: { league: LeagueForScenario }) {
  const overrides = usePlayoffMachineStore((s) => s.overrides);
  const setWinner = usePlayoffMachineStore((s) => s.setWinner);
  const setAll = usePlayoffMachineStore((s) => s.setAll);
  const reset = usePlayoffMachineStore((s) => s.reset);

  const teamsById = useMemo(() => new Map(league.teams.map((t) => [t.id, t])), [league.teams]);
  const averagesById = useMemo(() => new Map(league.teams.map((t) => [t.id, teamAverage(t.scoreHistory)])), [league.teams]);

  const remainingByWeek = useMemo(() => {
    const remaining = league.matchups.filter((m) => m.week >= league.settings.currentWeek);
    const byWeek = new Map<number, typeof remaining>();
    for (const m of remaining) {
      if (!byWeek.has(m.week)) byWeek.set(m.week, []);
      byWeek.get(m.week)!.push(m);
    }
    return [...byWeek.entries()].sort((a, b) => a[0] - b[0]);
  }, [league.matchups, league.settings.currentWeek]);

  const overridesMap = useMemo(() => new Map(Object.entries(overrides)), [overrides]);
  const scenario = useMemo(() => resolveScenario(league, overridesMap), [league, overridesMap]);

  function randomizeAll() {
    const next: Record<string, string> = {};
    for (const [, matchups] of remainingByWeek) {
      for (const m of matchups) {
        const key = matchupKey(m.week, m.homeTeamId, m.awayTeamId);
        next[key] = Math.random() < 0.5 ? m.homeTeamId : m.awayTeamId;
      }
    }
    setAll(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Interactive Playoff Machine</h1>
          <p className="text-sm text-muted-foreground">
            Pick a winner for every remaining game and watch final standings, seeding, and tiebreakers update instantly. Undecided games default to the
            &quot;chalk&quot; pick (higher season average).
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={randomizeAll} className="gap-1.5">
            <Shuffle className="h-3.5 w-3.5" /> Randomize All
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to Chalk
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Remaining Schedule</CardTitle>
            <CardDescription>Weeks {league.settings.currentWeek}&ndash;{league.settings.regularSeasonWeeks}.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[720px] space-y-4 overflow-y-auto scrollbar-thin">
            {remainingByWeek.map(([week, matchups]) => (
              <div key={week} className="space-y-2">
                {matchups.map((m) => {
                  const homeTeam = teamsById.get(m.homeTeamId);
                  const awayTeam = teamsById.get(m.awayTeamId);
                  if (!homeTeam || !awayTeam) return null;
                  const key = matchupKey(m.week, m.homeTeamId, m.awayTeamId);
                  const chalkWinner = averagesById.get(m.homeTeamId)! >= averagesById.get(m.awayTeamId)! ? m.homeTeamId : m.awayTeamId;
                  const selectedWinnerId = overrides[key] ?? chalkWinner;
                  return (
                    <MatchupToggle
                      key={key}
                      week={week}
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                      homeAvg={averagesById.get(m.homeTeamId)!}
                      awayAvg={averagesById.get(m.awayTeamId)!}
                      selectedWinnerId={selectedWinnerId}
                      isOverridden={Boolean(overrides[key])}
                      onPick={(winnerId) => setWinner(key, winnerId)}
                    />
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Resulting Standings &amp; Seeding</CardTitle>
            <CardDescription>Top {league.settings.playoffTeams} make the playoffs. Top {league.settings.firstRoundByes} get a first-round bye.</CardDescription>
          </CardHeader>
          <CardContent>
            <StandingsPreview scenario={scenario} teamsById={teamsById} playoffTeams={league.settings.playoffTeams} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
