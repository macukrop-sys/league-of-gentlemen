import { getLeague } from "@/lib/data/provider";
import { PlayoffMachineClient } from "@/components/playoff-machine/PlayoffMachineClient";

export const dynamic = "force-dynamic";

export default async function PlayoffMachinePage() {
  const league = await getLeague();
  const leagueForScenario = {
    settings: league.settings,
    teams: league.teams,
    divisions: league.divisions,
    matchups: league.matchups,
  };
  return <PlayoffMachineClient league={leagueForScenario} />;
}
