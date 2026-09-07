import { getLeague, getRostersForWeek } from "@/lib/data/provider";
import { buildWeekView } from "@/lib/liveView";
import { WeekPicker } from "@/components/matchups/WeekPicker";
import { MatchupsClient } from "@/components/matchups/MatchupsClient";

export const dynamic = "force-dynamic";

export default async function MatchupsPage({ searchParams }: { searchParams: { week?: string } }) {
  const league = await getLeague();
  const { regularSeasonWeeks, currentWeek } = league.settings;

  const requestedWeek = Number(searchParams.week);
  const week = Number.isInteger(requestedWeek) && requestedWeek >= 1 && requestedWeek <= regularSeasonWeeks ? requestedWeek : currentWeek;
  const isCurrentWeek = week === currentWeek;

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
          {isCurrentWeek ? <span className="ml-2 text-xs font-normal text-success">Current</span> : null}
        </h2>

        {isFutureWeek ? (
          <p className="mb-4 text-xs text-muted-foreground">This week hasn&apos;t happened yet — showing projections only.</p>
        ) : null}

        {/* key=week forces a fresh client instance per week, so polling state and the reset effect don't get confused across navigations */}
        <MatchupsClient key={week} week={week} initialData={view} isCurrentWeek={isCurrentWeek} />
      </div>
    </div>
  );
}
