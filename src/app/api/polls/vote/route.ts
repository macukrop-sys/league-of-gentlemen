import { NextResponse } from "next/server";
import { getLeague } from "@/lib/data/provider";
import { getPollsForWeek } from "@/lib/polls/matchupPolls";
import { castVote } from "@/lib/polls/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const week = Number(body?.week);
  const pollId = body?.pollId;
  const optionId = body?.optionId;
  const voterId = body?.voterId;

  if (!Number.isInteger(week) || typeof pollId !== "string" || typeof optionId !== "string" || typeof voterId !== "string" || !voterId) {
    return NextResponse.json({ error: "week, pollId, optionId, and voterId are required" }, { status: 400 });
  }

  const league = await getLeague();
  if (week < 1 || week > league.settings.regularSeasonWeeks) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }

  const poll = getPollsForWeek(league, week).find((p) => p.id === pollId);
  if (!poll) {
    return NextResponse.json({ error: "Unknown poll for that week" }, { status: 404 });
  }

  const outcome = await castVote(poll, optionId, voterId);
  if (!outcome.ok) {
    if (outcome.reason === "not-configured") {
      return NextResponse.json({ error: "Polls aren't connected to shared storage yet — ask the commissioner to finish setup." }, { status: 503 });
    }
    if (outcome.reason === "invalid-option") {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }
    // Already voted isn't an error — just hand back where things stand.
    return NextResponse.json({ results: outcome.results });
  }

  return NextResponse.json({ results: outcome.results });
}
