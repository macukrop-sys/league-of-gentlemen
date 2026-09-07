import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPct, formatPoints } from "@/lib/utils";
import type { SimulationResult, Team } from "@/lib/types";

export function PlayoffOddsTable({
  results,
  teamsById,
  regularSeasonWeeks,
}: {
  results: SimulationResult[];
  teamsById: Map<string, Team>;
  regularSeasonWeeks: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Playoff Odds</TableHead>
          <TableHead className="text-right">Division Odds</TableHead>
          <TableHead className="text-right">Bye Odds</TableHead>
          <TableHead className="text-right">Proj. Final Record</TableHead>
          <TableHead className="text-right">Avg. Seed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((r) => (
          <TableRow key={r.teamId}>
            <TableCell className="font-medium">{teamsById.get(r.teamId)?.name}</TableCell>
            <TableCell className="text-right">
              <Badge variant={r.playoffOdds >= 0.99 ? "success" : r.playoffOdds <= 0.01 ? "destructive" : "secondary"} className="font-tabular">
                {formatPct(r.playoffOdds, 1)}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">{formatPct(r.divisionOdds, 1)}</TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">{formatPct(r.byeOdds, 1)}</TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">
              {r.avgFinalWins.toFixed(1)}-{(regularSeasonWeeks - r.avgFinalWins).toFixed(1)} &middot; {formatPoints(r.avgFinalPointsFor)} PF
            </TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">{r.avgSeed.toFixed(1)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
