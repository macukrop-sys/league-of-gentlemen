import { NextResponse } from "next/server";
import { getLeague } from "@/lib/data/provider";
import { buildLiveView } from "@/lib/liveView";

export const dynamic = "force-dynamic";

export async function GET() {
  const league = await getLeague();
  return NextResponse.json(buildLiveView(league));
}
