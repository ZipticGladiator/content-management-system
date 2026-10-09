import { requireOrgSession } from "@/lib/org";
import { getAnalyticsSummary } from "@/lib/analytics";
import AnalyticsView from "@/components/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { session, db } = await requireOrgSession();
  const [summary, categories] = await Promise.all([
    getAnalyticsSummary(session.orgId),
    db.category.findMany({ orderBy: { order: "asc" }, select: { key: true, label: true } }),
  ]);
  return <AnalyticsView summary={summary} categories={categories} />;
}
