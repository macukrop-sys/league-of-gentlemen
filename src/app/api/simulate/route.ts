import { NextResponse } from "next/server";
import { getLeague } from "@/lib/data/provider";
import { runMonteCarloSimulation } from "@/lib/simulation/monteCarlo";
import { cache, CACHE_TTL } from "@/lib/cache";
import type { MatchupOverride } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_TRIALS = Number(process.env.SIMULATION_TRIALS ?? 10000);

/** Base (no manual overrides) simulation — cached since it's identical for every visitor. */
export async function GET() {
  const league = await getLeague();
  const response = await cache.getOrFetch(`simulation:${league.settings.currentWeek}:${DEFAULT_TRIALS}`, CACHE_TTL.simulation, async () =>
    runMonteCarloSimulation(league, { trials: DEFAULT_TRIALS }),
  );
  return NextResponse.json(response);
}

/** Interactive Playoff Machine: re-runs the simulation with manual winner overrides applied. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { trials?: number; overrides?: MatchupOverride[] };
  const league = await getLeague();
  const trials = Math.min(Math.max(body.trials ?? DEFAULT_TRIALS, 100), 20000);
  const response = runMonteCarloSimulation(league, { trials, overrides: body.overrides ?? [] });
  return NextResponse.json(response);
}
