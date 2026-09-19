import { getAnalyticsSummary } from "@/lib/analytics";
import AnalyticsView from "@/components/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const summary = await getAnalyticsSummary();
  return <AnalyticsView summary={summary} />;
}
