import { prisma } from "@/lib/prisma";
import GoalsView from "@/components/GoalsView";
import { createGoal, deleteGoal, updateGoal } from "@/app/goals/actions";
import { getConnectedChannel } from "@/lib/youtube-oauth";
import { fetchSubscriberCount } from "@/lib/youtube-analytics";
import { getConnectedAccount } from "@/lib/tiktok-oauth";
import { fetchAccountOverview } from "@/lib/tiktok-analytics";
import type { GoalEntry } from "@/lib/goals";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const rows = await prisma.goal.findMany({ orderBy: { createdAt: "asc" } });

  const [youtubeChannel, tiktokAccount] = await Promise.all([
    getConnectedChannel(),
    getConnectedAccount(),
  ]);

  const needsYoutube = youtubeChannel && rows.some((r) => r.platform === "YOUTUBE");
  const needsTiktok = tiktokAccount && rows.some((r) => r.platform === "TIKTOK");

  const [liveSubs, liveFollowers] = await Promise.all([
    needsYoutube ? fetchSubscriberCount() : Promise.resolve(null),
    needsTiktok ? fetchAccountOverview() : Promise.resolve(null),
  ]);

  const items: GoalEntry[] = rows.map((r) => ({
    id: r.id,
    platform: r.platform,
    label: r.label,
    target: r.target,
    manualCurrent: r.manualCurrent,
    deadline: r.deadline ? r.deadline.toISOString().slice(0, 10) : null,
    liveCurrent:
      r.platform === "YOUTUBE" ? liveSubs : r.platform === "TIKTOK" ? liveFollowers?.followerCount ?? null : null,
  }));

  return <GoalsView items={items} onCreate={createGoal} onUpdate={updateGoal} onDelete={deleteGoal} />;
}
