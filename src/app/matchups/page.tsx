import { getLeague, getRostersForWeek } from "@/lib/data/provider";
import { buildWeekView } from "@/lib/liveView";
import { WeekPicker } from "@/components/matchups/WeekPicker";
import { MatchupBoxScore } from "@/components/matchups/MatchupBoxScore";

export const dynamic = "force-dynamic";

export default async function MatchupsPage({ searchParams }: { searchParams: { week?: string } }) {
  const league = await getLeague();
  const { regularSeasonWeeks, currentWeek } = league.settings;

  const requestedWeek = Number(searchParams.week);
  const week = Number.isInteger(requestedWeek) && requestedWeek >= 1 && requestedWeek <= regularSeasonWeeks ? requestedWeek : currentWeek;

  const rosters = await getRostersForWeek(league, week);
  const view = buildWeekView(league, week, rosters);
  const isFutureWeek = week > currentWeek;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Matchups</h1>
        <p className="text-sm text-muted-foreground">Every matchup and full roster, week by week. Click a matchup to expand the box score.</p>
      </div>

      <WeekPicker regularSeasonWeeks={regularSeasonWeeks} currentWeek={currentWeek} selectedWeek={week} />

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">
          Week {week}
          {week === currentWeek ? <span className="ml-2 text-xs font-normal text-success">Current</span> : null}
        </h2>

        {isFutureWeek ? (
          <p className="mb-4 text-xs text-muted-foreground">This week hasn&apos;t happened yet — showing projections only.</p>
        ) : null}

        {view.matchups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matchups scheduled for this week.</p>
        ) : (
          <div className="space-y-3">
            {view.matchups.map((m, i) => (
              <MatchupBoxScore
                key={`${m.homeTeam?.id}-${m.awayTeam?.id}`}
                matchup={m}
                homeRoster={m.homeTeam ? rosters[m.homeTeam.id] : undefined}
                awayRoster={m.awayTeam ? rosters[m.awayTeam.id] : undefined}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
