import { getLeague, getRostersForWeek } from "@/lib/data/provider";
import { generateWeeklyRecap } from "@/lib/recap";
import { WeekPicker } from "@/components/matchups/WeekPicker";
import { RecapCard } from "@/components/recap/RecapCard";

export const dynamic = "force-dynamic";

export default async function RecapPage({ searchParams }: { searchParams: { week?: string } }) {
  const league = await getLeague();
  const { regularSeasonWeeks, currentWeek } = league.settings;

  const requestedWeek = Number(searchParams.week);
  // Recaps only make sense for weeks that have finished — default to the most
  // recently completed week rather than the in-progress current week.
  const defaultWeek = Math.max(1, currentWeek - 1);
  const week = Number.isInteger(requestedWeek) && requestedWeek >= 1 && requestedWeek <= regularSeasonWeeks ? requestedWeek : defaultWeek;

  const rosters = await getRostersForWeek(league, week);
  const sections = generateWeeklyRecap(league, week, rosters);
  const hasResults = league.matchups.some((m) => m.week === week && m.completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Weekly Recap</h1>
        <p className="text-sm text-muted-foreground">The storylines from every matchup, generated from this week&apos;s actual results.</p>
      </div>

      <WeekPicker regularSeasonWeeks={regularSeasonWeeks} currentWeek={currentWeek} selectedWeek={week} />

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Week {week} Recap</h2>

        {!hasResults ? (
          <p className="text-sm text-muted-foreground">
            {week >= currentWeek
              ? "This week hasn't finished yet — check back once the games wrap up."
              : "No results found for this week."}
          </p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing notable to report this week.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <RecapCard key={section.kind} section={section} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
