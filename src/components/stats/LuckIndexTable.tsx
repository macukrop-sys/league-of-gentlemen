import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSigned } from "@/lib/utils";
import type { LuckIndexEntry, Team } from "@/lib/types";

export function LuckIndexTable({ entries, teamsById }: { entries: LuckIndexEntry[]; teamsById: Map<string, Team> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Actual Wins</TableHead>
          <TableHead className="text-right">Expected Wins</TableHead>
          <TableHead className="text-right">Luck Index</TableHead>
          <TableHead>Read</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.teamId}>
            <TableCell className="font-medium">{teamsById.get(e.teamId)?.name}</TableCell>
            <TableCell className="text-right font-tabular">{e.actualWins}</TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">{e.expectedWins}</TableCell>
            <TableCell className={`text-right font-tabular font-semibold ${e.luckIndex > 0 ? "text-success" : e.luckIndex < 0 ? "text-destructive" : ""}`}>
              {formatSigned(e.luckIndex, 2)}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {Math.abs(e.luckIndex) < 0.3 ? "Record matches performance" : e.luckIndex > 0 ? "Winning more than they deserve" : "Deserves better than the record shows"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
