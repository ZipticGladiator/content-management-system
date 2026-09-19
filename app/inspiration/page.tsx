import { prisma } from "@/lib/prisma";
import InspirationGrid from "@/components/InspirationGrid";
import GoalsView from "@/components/GoalsView";
import { createInspiration, deleteInspiration, updateInspiration } from "@/app/inspiration/actions";
import { createGoal, deleteGoal, updateGoal } from "@/app/goals/actions";
import { getConnectedChannel } from "@/lib/youtube-oauth";
import { fetchSubscriberCount } from "@/lib/youtube-analytics";
import { getConnectedAccount } from "@/lib/tiktok-oauth";
import { fetchAccountOverview } from "@/lib/tiktok-analytics";
import type { InspirationEntry } from "@/lib/inspiration";
import type { GoalEntry } from "@/lib/goals";

export const dynamic = "force-dynamic";

async function recordSnapshotIfNeeded(goalId: string, value: number) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await prisma.goalSnapshot.findFirst({
    where: { goalId, capturedAt: { gte: startOfDay } },
  });
  if (!existing) {
    await prisma.goalSnapshot.create({ data: { goalId, value } });
  }
}

async function loadGoals(): Promise<GoalEntry[]> {
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

  const liveByPlatform: Record<string, number | null> = {
    YOUTUBE: liveSubs,
    TIKTOK: liveFollowers?.followerCount ?? null,
  };

  // Capture today's snapshot (once per day) for any goal with a live value.
  await Promise.all(
    rows.map((r) => {
      const live = liveByPlatform[r.platform];
      if (live == null) return Promise.resolve();
      return recordSnapshotIfNeeded(r.id, live);
    })
  );

  const snapshots = await prisma.goalSnapshot.findMany({
    where: { goalId: { in: rows.map((r) => r.id) } },
    orderBy: { capturedAt: "asc" },
  });

  return rows.map((r) => {
    const liveCurrent = liveByPlatform[r.platform] ?? null;
    return {
      id: r.id,
      platform: r.platform,
      label: r.label,
      target: r.target,
      manualCurrent: r.manualCurrent,
      deadline: r.deadline ? r.deadline.toISOString().slice(0, 10) : null,
      liveCurrent,
      history: snapshots
        .filter((s) => s.goalId === r.id)
        .map((s) => ({ value: s.value, at: s.capturedAt.toISOString() })),
    };
  });
}

export default async function InspirationPage() {
  const [inspirationRows, goals] = await Promise.all([
    prisma.inspiration.findMany({ orderBy: { followers: "desc" } }),
    loadGoals(),
  ]);

  const items: InspirationEntry[] = inspirationRows.map((r) => ({
    id: r.id,
    name: r.name,
    platform: r.platform,
    type: r.type,
    url: r.url,
    followers: r.followers,
    description: r.description,
  }));

  return (
    <div className="wrap">
      <InspirationGrid
        items={items}
        onCreate={createInspiration}
        onUpdate={updateInspiration}
        onDelete={deleteInspiration}
      />
      <GoalsView items={goals} onCreate={createGoal} onUpdate={updateGoal} onDelete={deleteGoal} />
    </div>
  );
}
