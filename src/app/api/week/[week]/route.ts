import { NextResponse } from "next/server";
import { getLeague, getRostersForWeek } from "@/lib/data/provider";
import { buildWeekView } from "@/lib/liveView";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { week: string } }) {
  const league = await getLeague();
  const week = Number(params.week);

  if (!Number.isInteger(week) || week < 1 || week > league.settings.regularSeasonWeeks) {
    return NextResponse.json({ error: `week must be between 1 and ${league.settings.regularSeasonWeeks}` }, { status: 400 });
  }

  const rosters = await getRostersForWeek(league, week);
  return NextResponse.json(buildWeekView(league, week, rosters));
}
