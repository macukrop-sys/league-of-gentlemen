import { getLeague } from "@/lib/data/provider";
import { buildLiveView } from "@/lib/liveView";
import { LiveDashboardClient } from "@/components/dashboard/LiveDashboardClient";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const league = await getLeague();
  const initialData = buildLiveView(league);
  return <LiveDashboardClient initialData={initialData} />;
}
