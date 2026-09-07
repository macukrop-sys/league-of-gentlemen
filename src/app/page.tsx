import Link from "next/link";
import { getLeague } from "@/lib/data/provider";
import { computeStandings } from "@/lib/stats/standings";
import { computePowerRankingsWithTrend } from "@/lib/stats/powerRankings";
import { computeLuckIndex } from "@/lib/stats/luckIndex";
import { buildLiveView } from "@/lib/liveView";
import { StatCard } from "@/components/dashboard/StatCard";
import { MatchupCard } from "@/components/dashboard/MatchupCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Zap, Sparkles, CloudRain, ArrowRight, Radio, BarChart3, SlidersHorizontal } from "lucide-react";
import { formatPoints, ordinal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const league = await getLeague();
  const standings = computeStandings(league);
  const powerRankings = computePowerRankingsWithTrend(league);
  const luckIndex = computeLuckIndex(league);
  const live = buildLiveView(league);

  const leader = standings[0];
  const powerLeader = powerRankings[0];
  const teamsById = new Map(league.teams.map((t) => [t.id, t]));
  const luckiest = luckIndex[0];
  const unluckiest = luckIndex[luckIndex.length - 1];
  const optimalByTeamId = new Map(live.optimalLineups.map((o) => [o.teamId, o]));

  const closest = [...live.matchups]
    .filter((m) => m.winProbability)
    .sort((a, b) => Math.abs(a.winProbability!.homeWinProb - 0.5) - Math.abs(b.winProbability!.homeWinProb - 0.5))[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">{league.settings.leagueName} &middot; Season {league.settings.season} &middot; Week {league.settings.currentWeek}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="League Leader"
          value={leader ? leader.team.name : "-"}
          sub={leader ? `${leader.team.wins}-${leader.team.losses}${leader.team.ties ? `-${leader.team.ties}` : ""} · ${formatPoints(leader.team.pointsFor)} PF` : undefined}
          icon={Trophy}
          accent="text-primary"
        />
        <StatCard
          label="Power Ranking #1"
          value={powerLeader ? teamsById.get(powerLeader.teamId)?.name ?? "-" : "-"}
          sub={powerLeader ? `Power score ${powerLeader.score}` : undefined}
          icon={Zap}
        />
        <StatCard
          label="Luckiest Team"
          value={luckiest ? teamsById.get(luckiest.teamId)?.name ?? "-" : "-"}
          sub={luckiest ? `+${luckiest.luckIndex} wins vs. expected` : undefined}
          icon={Sparkles}
          accent="text-success"
        />
        <StatCard
          label="Unluckiest Team"
          value={unluckiest ? teamsById.get(unluckiest.teamId)?.name ?? "-" : "-"}
          sub={unluckiest ? `${unluckiest.luckIndex} wins vs. expected` : undefined}
          icon={CloudRain}
          accent="text-destructive"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">This Week&apos;s Action</h2>
          <Link href="/live" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Full live dashboard <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {closest ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Closest race: <span className="font-medium text-foreground">{closest.homeTeam?.name}</span> vs{" "}
            <span className="font-medium text-foreground">{closest.awayTeam?.name}</span> — a coin flip at{" "}
            {Math.round((closest.winProbability?.homeWinProb ?? 0.5) * 100)}%.
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {live.matchups.map((m) => (
            <MatchupCard key={`${m.homeTeam?.id}-${m.awayTeam?.id}`} matchup={m} optimalByTeamId={optimalByTeamId} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ToolLinkCard
          href="/stats"
          icon={BarChart3}
          title="Advanced Statistics"
          description="All-Play record, Power Rankings, and the Luck Index."
        />
        <ToolLinkCard
          href="/simulator"
          icon={Radio}
          title="Playoff Probability Simulator"
          description="10,000-trial Monte Carlo odds for playoffs, division titles, and byes."
        />
        <ToolLinkCard
          href="/playoff-machine"
          icon={SlidersHorizontal}
          title="Interactive Playoff Machine"
          description="Pick every remaining winner and watch seeding update instantly."
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {leader ? `${leader.team.name} sits ${ordinal(leader.rank)} overall.` : null}
      </p>
    </div>
  );
}

function ToolLinkCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof BarChart3;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
        <CardHeader>
          <Icon className="mb-2 h-5 w-5 text-primary" />
          <CardTitle className="text-base text-foreground">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            Open <ArrowRight className="h-3 w-3" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
