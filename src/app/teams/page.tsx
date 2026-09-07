import Link from "next/link";
import { getLeague } from "@/lib/data/provider";
import { computeStandings } from "@/lib/stats/standings";
import { Card, CardContent } from "@/components/ui/card";
import { TeamBanner } from "@/components/teams/TeamBanner";
import { ordinal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const league = await getLeague();
  const standings = computeStandings(league);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Teams</h1>
        <p className="text-sm text-muted-foreground">Every manager in {league.settings.leagueName}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {standings.map(({ team, rank }) => (
          <Link key={team.id} href={`/teams/${team.id}`}>
            <Card className="h-full overflow-hidden transition-colors hover:border-primary/50">
              <TeamBanner teamId={team.id} name={team.name} className="h-40" />
              <CardContent className="pt-3">
                <p className="truncate text-sm font-semibold">{team.name}</p>
                <p className="truncate text-xs text-muted-foreground">{team.ownerName}</p>
                <p className="mt-0.5 font-tabular text-xs text-muted-foreground">
                  {ordinal(rank)} &middot; {team.wins}-{team.losses}
                  {team.ties ? `-${team.ties}` : ""}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
