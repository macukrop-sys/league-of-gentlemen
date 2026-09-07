import { getLeague } from "@/lib/data/provider";
import { computeStandings } from "@/lib/stats/standings";
import { computeAllPlayStats } from "@/lib/stats/allPlay";
import { computePowerRankingsWithTrend } from "@/lib/stats/powerRankings";
import { computeLuckIndex } from "@/lib/stats/luckIndex";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AllPlayTable } from "@/components/stats/AllPlayTable";
import { PowerRankingsChart } from "@/components/stats/PowerRankingsChart";
import { PowerRankingsTable } from "@/components/stats/PowerRankingsTable";
import { LuckIndexChart } from "@/components/stats/LuckIndexChart";
import { LuckIndexTable } from "@/components/stats/LuckIndexTable";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const league = await getLeague();
  const throughWeek = league.settings.currentWeek - 1;
  const teamsById = new Map(league.teams.map((t) => [t.id, t]));
  const standings = computeStandings(league);
  const actualRankByTeamId = new Map(standings.map((s) => [s.team.id, s.rank]));

  const { records: allPlayRecords } = computeAllPlayStats(
    league.teams.map((t) => ({ teamId: t.id, scoreHistory: t.scoreHistory })),
    throughWeek,
  );
  const powerRankings = computePowerRankingsWithTrend(league);
  const luckIndex = computeLuckIndex(league);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Advanced Statistics</h1>
        <p className="text-sm text-muted-foreground">Through Week {throughWeek} of {league.settings.regularSeasonWeeks}.</p>
      </div>

      <Tabs defaultValue="power">
        <TabsList>
          <TabsTrigger value="power">Power Rankings</TabsTrigger>
          <TabsTrigger value="all-play">All-Play Record</TabsTrigger>
          <TabsTrigger value="luck">Luck Index</TabsTrigger>
        </TabsList>

        <TabsContent value="power">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Power Score</CardTitle>
                <CardDescription>35% points for &middot; 40% all-play win% &middot; 25% current roster strength.</CardDescription>
              </CardHeader>
              <CardContent>
                <PowerRankingsChart rankings={powerRankings} teamsById={teamsById} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Breakdown</CardTitle>
                <CardDescription>Component scores are min-max normalized 0-100% across the league.</CardDescription>
              </CardHeader>
              <CardContent>
                <PowerRankingsTable rankings={powerRankings} teamsById={teamsById} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all-play">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Record if you played the whole league every week</CardTitle>
              <CardDescription>
                A schedule-independent strength measure. &quot;Gap&quot; is how many spots better (green) or worse (red) a team&apos;s actual
                standing is than its all-play rank — a proxy for how much its record is schedule-luck-driven.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AllPlayTable records={allPlayRecords} teamsById={teamsById} actualRankByTeamId={actualRankByTeamId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="luck">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Luck Index</CardTitle>
                <CardDescription>Actual wins minus expected wins (from the All-Play record).</CardDescription>
              </CardHeader>
              <CardContent>
                <LuckIndexChart entries={luckIndex} teamsById={teamsById} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Detail</CardTitle>
                <CardDescription>Positive = winning more than the scoring justifies. Negative = the reverse.</CardDescription>
              </CardHeader>
              <CardContent>
                <LuckIndexTable entries={luckIndex} teamsById={teamsById} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
