import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeague } from "@/lib/data/provider";
import { computeStandings } from "@/lib/stats/standings";
import { computeAllPlayStats } from "@/lib/stats/allPlay";
import { computePowerRankingsWithTrend } from "@/lib/stats/powerRankings";
import { computeLuckIndex } from "@/lib/stats/luckIndex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamAvatar } from "@/components/teams/TeamAvatar";
import { TeamBanner } from "@/components/teams/TeamBanner";
import { ScoreHistoryChart } from "@/components/teams/ScoreHistoryChart";
import { RosterTable } from "@/components/matchups/RosterTable";
import { getTeamFirstRoundPick } from "@/lib/teamPhotos";
import { formatPct, formatPoints, formatSigned, ordinal } from "@/lib/utils";
import { ArrowLeft, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const league = await getLeague();
  const team = league.teams.find((t) => t.id === params.teamId);
  if (!team) notFound();

  const division = league.divisions.find((d) => d.id === team.divisionId);
  const standings = computeStandings(league);
  const standingsRow = standings.find((s) => s.team.id === team.id)!;

  const throughWeek = league.settings.currentWeek - 1;
  const { records: allPlayRecords } = computeAllPlayStats(
    league.teams.map((t) => ({ teamId: t.id, scoreHistory: t.scoreHistory })),
    throughWeek,
  );
  const allPlay = allPlayRecords.find((r) => r.teamId === team.id);

  const powerRankings = computePowerRankingsWithTrend(league);
  const powerRank = powerRankings.find((r) => r.teamId === team.id);

  const luckIndex = computeLuckIndex(league).find((l) => l.teamId === team.id);

  const roster = league.rosters[team.id];
  const firstRoundPick = getTeamFirstRoundPick(team.id, team.name);

  return (
    <div className="space-y-6">
      <Link href="/teams" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> All teams
      </Link>

      <div className="relative h-56 w-full overflow-hidden rounded-lg border border-border md:h-72">
        <TeamBanner teamId={team.id} name={team.name} className="h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <TeamAvatar teamId={team.id} name={team.name} size={88} />
        <div>
          <h1 className="font-display text-2xl font-semibold">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            {team.ownerName} &middot; {division?.name ?? "The League"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="font-tabular">
              {team.wins}-{team.losses}
              {team.ties ? `-${team.ties}` : ""}
            </Badge>
            <Badge variant="outline" className="font-tabular">{ordinal(standingsRow.rank)} overall</Badge>
            <Badge variant="outline" className="font-tabular">{ordinal(standingsRow.divisionRank)} in division</Badge>
            <Badge variant="secondary" className="font-tabular">Streak {team.streak}</Badge>
            {firstRoundPick ? (
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3" />
                1st Rd: {firstRoundPick.player} ({firstRoundPick.position}, {firstRoundPick.nflTeam})
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-0"><CardTitle>Points For / Against</CardTitle></CardHeader>
          <CardContent className="pt-2 font-tabular text-xl font-semibold">
            {formatPoints(team.pointsFor)} <span className="text-sm font-normal text-muted-foreground">/ {formatPoints(team.pointsAgainst)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle>Power Ranking</CardTitle></CardHeader>
          <CardContent className="pt-2 font-tabular text-xl font-semibold">
            {powerRank ? `#${powerRank.rank}` : "-"} <span className="text-sm font-normal text-muted-foreground">{powerRank ? `(${powerRank.score})` : ""}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle>All-Play Record</CardTitle></CardHeader>
          <CardContent className="pt-2 font-tabular text-xl font-semibold">
            {allPlay ? `${allPlay.wins}-${allPlay.losses}` : "-"} <span className="text-sm font-normal text-muted-foreground">{allPlay ? formatPct(allPlay.winPct) : ""}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0"><CardTitle>Luck Index</CardTitle></CardHeader>
          <CardContent
            className={`pt-2 font-tabular text-xl font-semibold ${luckIndex && luckIndex.luckIndex > 0 ? "text-success" : luckIndex && luckIndex.luckIndex < 0 ? "text-destructive" : ""}`}
          >
            {luckIndex ? formatSigned(luckIndex.luckIndex, 2) : "-"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreHistoryChart scoreHistory={team.scoreHistory} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Week {league.settings.currentWeek} Roster</CardTitle>
        </CardHeader>
        <CardContent>
          {roster ? <RosterTable roster={roster} /> : <p className="text-sm text-muted-foreground">No roster data available for this team right now.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
