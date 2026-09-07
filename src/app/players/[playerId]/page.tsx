import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeague } from "@/lib/data/provider";
import { findPlayerInLeague } from "@/lib/players";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerGameLogChart } from "@/components/players/PlayerGameLogChart";
import { formatPoints, formatSigned } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: { playerId: string } }) {
  const league = await getLeague();
  const found = findPlayerInLeague(league, params.playerId);
  if (!found) notFound();
  const { player, team } = found;

  const gameLog = player.gameLog ?? [];
  const playedWeeks = gameLog.filter((g) => g.actualPoints > 0 || g.week < league.settings.currentWeek);
  const totalPoints = playedWeeks.reduce((sum, g) => sum + g.actualPoints, 0);
  const average = playedWeeks.length > 0 ? totalPoints / playedWeeks.length : 0;
  const best = playedWeeks.length > 0 ? playedWeeks.reduce((max, g) => (g.actualPoints > max.actualPoints ? g : max)) : undefined;
  const worst = playedWeeks.length > 0 ? playedWeeks.reduce((min, g) => (g.actualPoints < min.actualPoints ? g : min)) : undefined;

  return (
    <div className="space-y-6">
      <Link href={`/teams/${team.id}`} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> {team.name}
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold">{player.name}</h1>
          <Badge variant="outline">{player.position}</Badge>
          {player.status ? <Badge variant="destructive">{player.status}</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {player.nflTeam} &middot; Rostered by{" "}
          <Link href={`/teams/${team.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
            {team.name}
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Season Average</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 font-tabular text-xl font-semibold">{formatPoints(average)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Season Total</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 font-tabular text-xl font-semibold">{formatPoints(totalPoints)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Best Week</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 font-tabular text-xl font-semibold text-success">
            {best ? formatPoints(best.actualPoints) : "-"} <span className="text-sm font-normal text-muted-foreground">{best ? `Wk ${best.week}` : ""}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Worst Week</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 font-tabular text-xl font-semibold text-destructive">
            {worst ? formatPoints(worst.actualPoints) : "-"} <span className="text-sm font-normal text-muted-foreground">{worst ? `Wk ${worst.week}` : ""}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Game Log</CardTitle>
        </CardHeader>
        <CardContent>
          <PlayerGameLogChart gameLog={gameLog} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Week by Week</CardTitle>
        </CardHeader>
        <CardContent>
          {gameLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No game log available for this player yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">Projected</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...gameLog]
                  .sort((a, b) => b.week - a.week)
                  .map((g) => {
                    const diff = g.actualPoints - g.projectedPoints;
                    return (
                      <TableRow key={g.week}>
                        <TableCell className="font-medium">Week {g.week}</TableCell>
                        <TableCell className="text-right font-tabular text-muted-foreground">{formatPoints(g.projectedPoints)}</TableCell>
                        <TableCell className="text-right font-tabular font-semibold">{formatPoints(g.actualPoints)}</TableCell>
                        <TableCell className={`text-right font-tabular ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {formatSigned(diff, 1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
