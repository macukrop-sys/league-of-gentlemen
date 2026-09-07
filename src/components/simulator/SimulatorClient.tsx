"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayoffOddsChart } from "./PlayoffOddsChart";
import { PlayoffOddsTable } from "./PlayoffOddsTable";
import type { SimulationResponse, Team } from "@/lib/types";
import { Dices, Loader2 } from "lucide-react";

const TRIAL_PRESETS = [1000, 10000, 20000];

export function SimulatorClient({
  initialResult,
  teams,
  regularSeasonWeeks,
}: {
  initialResult: SimulationResponse;
  teams: Team[];
  regularSeasonWeeks: number;
}) {
  const [result, setResult] = useState(initialResult);
  const [trials, setTrials] = useState(initialResult.trials);
  const [isRunning, setIsRunning] = useState(false);
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  async function runSimulation() {
    setIsRunning(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trials }),
      });
      const json = (await res.json()) as SimulationResponse;
      setResult(json);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Playoff Probability Simulator</h1>
          <p className="text-sm text-muted-foreground">
            Monte Carlo: simulates the rest of the schedule {result.trials.toLocaleString()} times using each team&apos;s fitted scoring distribution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {TRIAL_PRESETS.map((t) => (
            <Button key={t} size="sm" variant={trials === t ? "default" : "outline"} onClick={() => setTrials(t)}>
              {t.toLocaleString()}
            </Button>
          ))}
          <Button size="sm" onClick={runSimulation} disabled={isRunning} className="gap-1.5">
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Dices className="h-3.5 w-3.5" />}
            {isRunning ? "Simulating…" : "Run Simulation"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Odds by Team</CardTitle>
            <CardDescription>Playoffs (top {teams.length >= 6 ? 6 : "N"} of {teams.length}) &middot; division title &middot; first-round bye.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayoffOddsChart results={result.results} teamsById={teamsById} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Detail</CardTitle>
            <CardDescription>As of week {result.asOfWeek}. Projected records assume each team&apos;s own season-to-date scoring distribution going forward.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayoffOddsTable results={result.results} teamsById={teamsById} regularSeasonWeeks={regularSeasonWeeks} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Methodology:</strong> each team&apos;s weekly score is modeled as Normal(season mean, season std. dev.), floored at a
          minimum std. dev. so a hot or cold streak isn&apos;t mistaken for true consistency. Every trial samples every remaining matchup, resolves final
          standings with a wins &rarr; head-to-head &rarr; points-for tiebreaker chain, seeds the playoff bracket (division winners auto-qualify, best
          remaining records fill wildcard slots), and tallies the outcome. Odds are simply how often each outcome happened across all trials — accurate to
          roughly &plusmn;1 percentage point at 10,000 trials for odds near 50%.
        </CardContent>
      </Card>
    </div>
  );
}
