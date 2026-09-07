import { getLeague } from "@/lib/data/provider";
import { runMonteCarloSimulation } from "@/lib/simulation/monteCarlo";
import { SimulatorClient } from "@/components/simulator/SimulatorClient";

export const dynamic = "force-dynamic";

const DEFAULT_TRIALS = Number(process.env.SIMULATION_TRIALS ?? 10000);

export default async function SimulatorPage() {
  const league = await getLeague();
  const initialResult = runMonteCarloSimulation(league, { trials: DEFAULT_TRIALS });
  return <SimulatorClient initialResult={initialResult} teams={league.teams} regularSeasonWeeks={league.settings.regularSeasonWeeks} />;
}
