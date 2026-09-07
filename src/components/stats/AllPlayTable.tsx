import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPct, ordinal } from "@/lib/utils";
import type { AllPlayRecord, Team } from "@/lib/types";

export function AllPlayTable({ records, teamsById, actualRankByTeamId }: {
  records: AllPlayRecord[];
  teamsById: Map<string, Team>;
  actualRankByTeamId: Map<string, number>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">All-Play Record</TableHead>
          <TableHead className="text-right">Win%</TableHead>
          <TableHead className="text-right">Actual Rank</TableHead>
          <TableHead className="text-right">Gap</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r, i) => {
          const team = teamsById.get(r.teamId);
          const actualRank = actualRankByTeamId.get(r.teamId) ?? i + 1;
          const gap = actualRank - (i + 1); // positive = actual record worse than all-play suggests it should be
          return (
            <TableRow key={r.teamId}>
              <TableCell className="font-tabular text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{team?.name}</TableCell>
              <TableCell className="text-right font-tabular">
                {r.wins}-{r.losses}
                {r.ties ? `-${r.ties}` : ""}
              </TableCell>
              <TableCell className="text-right font-tabular">{formatPct(r.winPct)}</TableCell>
              <TableCell className="text-right font-tabular text-muted-foreground">{ordinal(actualRank)}</TableCell>
              <TableCell className={`text-right font-tabular ${gap < 0 ? "text-success" : gap > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {gap === 0 ? "—" : gap > 0 ? `+${gap}` : gap}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
