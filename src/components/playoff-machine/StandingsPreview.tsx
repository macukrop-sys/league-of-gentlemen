import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPoints } from "@/lib/utils";
import type { Team } from "@/lib/types";
import type { ScenarioResult } from "@/lib/simulation/scenario";
import { Crown, Snowflake } from "lucide-react";

export function StandingsPreview({ scenario, teamsById, playoffTeams }: { scenario: ScenarioResult; teamsById: Map<string, Team>; playoffTeams: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Record</TableHead>
          <TableHead className="text-right">Points For</TableHead>
          <TableHead>Seeding</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scenario.order.map((teamId, i) => {
          const team = teamsById.get(teamId);
          const stat = scenario.statsByTeam.get(teamId)!;
          const seedInfo = scenario.seeds.find((s) => s.teamId === teamId)!;
          const madePlayoffs = seedInfo.seed !== null;
          return (
            <TableRow key={teamId} className={i < playoffTeams ? "bg-primary/5" : undefined}>
              <TableCell className="font-tabular text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{team?.name}</TableCell>
              <TableCell className="text-right font-tabular">
                {stat.wins}-{stat.losses}
                {stat.ties ? `-${stat.ties}` : ""}
              </TableCell>
              <TableCell className="text-right font-tabular text-muted-foreground">{formatPoints(stat.pointsFor)}</TableCell>
              <TableCell>
                {madePlayoffs ? (
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="success" className="font-tabular">
                      Seed {seedInfo.seed}
                    </Badge>
                    {seedInfo.isDivisionWinner ? (
                      <Badge variant="secondary" className="gap-1">
                        <Crown className="h-3 w-3" /> Division
                      </Badge>
                    ) : null}
                    {seedInfo.hasBye ? (
                      <Badge variant="secondary" className="gap-1">
                        <Snowflake className="h-3 w-3" /> Bye
                      </Badge>
                    ) : null}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Out
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
