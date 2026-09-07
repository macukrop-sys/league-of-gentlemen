import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPct } from "@/lib/utils";
import type { PowerRanking, Team } from "@/lib/types";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export function PowerRankingsTable({ rankings, teamsById }: { rankings: PowerRanking[]; teamsById: Map<string, Team> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">Rank</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Score</TableHead>
          <TableHead className="text-right">Points For</TableHead>
          <TableHead className="text-right">All-Play</TableHead>
          <TableHead className="text-right">Roster</TableHead>
          <TableHead className="text-right">Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings.map((r) => (
          <TableRow key={r.teamId}>
            <TableCell className="font-tabular text-muted-foreground">{r.rank}</TableCell>
            <TableCell className="font-medium">{teamsById.get(r.teamId)?.name}</TableCell>
            <TableCell className="text-right font-tabular font-semibold">{r.score}</TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">{formatPct(r.components.pointsForScore)}</TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">{formatPct(r.components.allPlayScore)}</TableCell>
            <TableCell className="text-right font-tabular text-muted-foreground">{formatPct(r.components.rosterStrengthScore)}</TableCell>
            <TableCell className="text-right">
              <span className={`inline-flex items-center gap-0.5 font-tabular text-xs ${r.trend > 0 ? "text-success" : r.trend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {r.trend > 0 ? <ArrowUp className="h-3 w-3" /> : r.trend < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {r.trend !== 0 ? Math.abs(r.trend) : ""}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
