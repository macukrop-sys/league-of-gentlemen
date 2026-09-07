import { getLeague } from "@/lib/data/provider";
import { getPollsForWeek } from "@/lib/polls/matchupPolls";
import { WeekPicker } from "@/components/matchups/WeekPicker";
import { PollsClient } from "@/components/polls/PollsClient";

export const dynamic = "force-dynamic";

export default async function PollsPage({ searchParams }: { searchParams: { week?: string } }) {
  const league = await getLeague();
  const { regularSeasonWeeks, currentWeek } = league.settings;

  const requestedWeek = Number(searchParams.week);
  const week = Number.isInteger(requestedWeek) && requestedWeek >= 1 && requestedWeek <= regularSeasonWeeks ? requestedWeek : currentWeek;

  const polls = getPollsForWeek(league, week);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">League Polls</h1>
        <p className="text-sm text-muted-foreground">Vote on this week&apos;s matchups — results are shared with the whole league.</p>
      </div>

      <WeekPicker regularSeasonWeeks={regularSeasonWeeks} currentWeek={currentWeek} selectedWeek={week} />

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">
          Week {week}
          {week === currentWeek ? <span className="ml-2 text-xs font-normal text-success">Current</span> : null}
        </h2>

        {/* key=week resets vote/loading state cleanly when navigating between weeks */}
        <PollsClient key={week} week={week} initialPolls={polls} />
      </div>
    </div>
  );
}
