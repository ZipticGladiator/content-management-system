import "server-only";
import { prisma } from "@/lib/prisma";
import type { Category } from "@/app/generated/prisma/client";

const DAY_MS = 86400000;

/**
 * The DB has no dedicated "published at" timestamp — updatedAt changes on
 * any edit, not just the publish transition. The activity log's auto-logged
 * "Status changed: X → Published/Posted" comments give an accurate publish
 * moment instead, so analytics reads those rather than trusting updatedAt.
 */
async function derivePublishDates(kind: "youtube" | "tiktok"): Promise<Map<string, Date>> {
  const marker = kind === "youtube" ? "→ Published" : "→ Posted";
  const idField = kind === "youtube" ? "youtubeVideoId" : "tiktokClipId";
  const comments = await prisma.comment.findMany({
    where: { isSystem: true, body: { endsWith: marker }, [idField]: { not: null } },
    select: { youtubeVideoId: true, tiktokClipId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const map = new Map<string, Date>();
  for (const c of comments) {
    const id = kind === "youtube" ? c.youtubeVideoId : c.tiktokClipId;
    if (id && !map.has(id)) map.set(id, c.createdAt); // desc order: first hit is the most recent
  }
  return map;
}

export type WeekBucket = { weekStart: string; youtube: number; tiktok: number };
export type CategoryMix = { category: Category; count: number };

export type AnalyticsSummary = {
  publishedLast30Days: number;
  videosPerWeek: number;
  avgIdeaToPublishedDays: number | null;
  cycleTimeSampleSize: number;
  avgSpendPerVideo: number;
  subsGained30d: number | null;
  followersGained30d: number | null;
  inPipeline: number;
  completionRatePct: number | null;
  weeklyOutput: WeekBucket[];
  categoryMix: CategoryMix[];
};

function isoWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const now = new Date();
  const since30d = new Date(now.getTime() - 30 * DAY_MS);
  const weeks = 12;
  const sinceWeeks = new Date(now.getTime() - weeks * 7 * DAY_MS);

  const [videos, clips, youtubePublish, tiktokPublish, youtubeGoal, tiktokGoal] = await Promise.all([
    prisma.youtubeVideo.findMany({
      where: { deletedAt: null },
      select: { id: true, status: true, category: true, cost: true, createdAt: true, updatedAt: true },
    }),
    prisma.tiktokClip.findMany({
      where: { deletedAt: null },
      select: { id: true, status: true, category: true, cost: true, createdAt: true, updatedAt: true },
    }),
    derivePublishDates("youtube"),
    derivePublishDates("tiktok"),
    prisma.goal.findFirst({ where: { platform: "YOUTUBE" }, select: { id: true } }),
    prisma.goal.findFirst({ where: { platform: "TIKTOK" }, select: { id: true } }),
  ]);

  type PublishedItem = {
    id: string;
    category: Category;
    cost: number;
    createdAt: Date;
    publishedAt: Date;
    /** False for content published before the activity log existed to record it — updatedAt is a guess, not a real timestamp. */
    hasReliableDate: boolean;
    platform: "youtube" | "tiktok";
  };

  function toPublished<T extends { id: string; status: string; category: Category; cost: number; createdAt: Date; updatedAt: Date }>(
    rows: T[],
    doneStatus: string,
    dated: Map<string, Date>,
    platform: "youtube" | "tiktok"
  ): PublishedItem[] {
    return rows
      .filter((r) => r.status === doneStatus)
      .map((r) => {
        const derived = dated.get(r.id);
        return {
          id: r.id,
          category: r.category,
          cost: r.cost,
          createdAt: r.createdAt,
          publishedAt: derived ?? r.updatedAt,
          hasReliableDate: derived != null,
          platform,
        };
      });
  }

  // Every published/posted item, for counts that don't depend on *when* (totals, category mix, spend).
  const allPublished: PublishedItem[] = [
    ...toPublished(videos, "PUBLISHED", youtubePublish, "youtube"),
    ...toPublished(clips, "POSTED", tiktokPublish, "tiktok"),
  ];

  // Recency counts tolerate an approximate date (worst case, an item lands in the
  // adjacent week) — showing a false zero because older content predates the
  // activity log would be worse, so these use the best available date, falling
  // back to updatedAt.
  const publishedLast30Days = allPublished.filter((p) => p.publishedAt >= since30d).length;

  const recentPublished = allPublished.filter((p) => p.publishedAt >= sinceWeeks);
  const videosPerWeek = Math.round((recentPublished.length / weeks) * 10) / 10;

  // Cycle time is different: a wrong number here isn't "off by a few days," it can
  // be nonsensically small or large (createdAt vs. an unrelated later edit), so it
  // only uses items with a real activity-log-derived publish moment.
  const datedForCycleTime = allPublished.filter((p) => p.hasReliableDate);
  const cycleTimes = datedForCycleTime
    .map((p) => (p.publishedAt.getTime() - p.createdAt.getTime()) / DAY_MS)
    .filter((d) => d >= 0);
  const avgIdeaToPublishedDays = cycleTimes.length
    ? Math.round((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) * 10) / 10
    : null;
  const cycleTimeSampleSize = cycleTimes.length;

  const spendable = allPublished.filter((p) => p.cost > 0);
  const avgSpendPerVideo = spendable.length
    ? Math.round(spendable.reduce((a, p) => a + p.cost, 0) / spendable.length)
    : 0;

  const totalActive = videos.length + clips.length;
  const publishedCount = allPublished.length;
  const inPipeline = totalActive - publishedCount;
  const completionRatePct = totalActive > 0 ? Math.round((publishedCount / totalActive) * 100) : null;

  async function gained30d(goalId: string | undefined): Promise<number | null> {
    if (!goalId) return null;
    const [latest, baseline] = await Promise.all([
      prisma.goalSnapshot.findFirst({ where: { goalId }, orderBy: { capturedAt: "desc" } }),
      prisma.goalSnapshot.findFirst({ where: { goalId, capturedAt: { lte: since30d } }, orderBy: { capturedAt: "desc" } }),
    ]);
    if (!latest) return null;
    const base = baseline ?? (await prisma.goalSnapshot.findFirst({ where: { goalId }, orderBy: { capturedAt: "asc" } }));
    if (!base || base.id === latest.id) return null;
    return latest.value - base.value;
  }

  const [subsGained30d, followersGained30d] = await Promise.all([
    gained30d(youtubeGoal?.id),
    gained30d(tiktokGoal?.id),
  ]);

  const weekMap = new Map<string, WeekBucket>();
  for (const p of recentPublished) {
    const wk = isoWeekStart(p.publishedAt);
    const bucket = weekMap.get(wk) ?? { weekStart: wk, youtube: 0, tiktok: 0 };
    if (p.platform === "youtube") bucket.youtube += 1;
    else bucket.tiktok += 1;
    weekMap.set(wk, bucket);
  }
  const weeklyOutput: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const wk = isoWeekStart(new Date(now.getTime() - i * 7 * DAY_MS));
    weeklyOutput.push(weekMap.get(wk) ?? { weekStart: wk, youtube: 0, tiktok: 0 });
  }

  const categoryCounts = new Map<Category, number>();
  for (const p of allPublished) {
    categoryCounts.set(p.category, (categoryCounts.get(p.category) ?? 0) + 1);
  }
  const categoryMix: CategoryMix[] = (["EDUCATIONAL", "TECHNICAL", "LIFESTYLE"] as Category[]).map((category) => ({
    category,
    count: categoryCounts.get(category) ?? 0,
  }));

  return {
    publishedLast30Days,
    videosPerWeek,
    avgIdeaToPublishedDays,
    cycleTimeSampleSize,
    avgSpendPerVideo,
    subsGained30d,
    followersGained30d,
    inPipeline,
    completionRatePct,
    weeklyOutput,
    categoryMix,
  };
}
