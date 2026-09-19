import "server-only";
import { prisma } from "@/lib/prisma";

export type NotificationEntry = {
  id: string;
  kind: "youtube" | "tiktok";
  itemId: string;
  itemTitle: string;
  type: "overdue" | "comment";
  message: string;
  at: string;
};

const RECENT_HOURS = 48;

export async function getNotifications(): Promise<NotificationEntry[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = new Date(Date.now() - RECENT_HOURS * 3600 * 1000);

  const [overdueVideos, overdueClips, recentComments] = await Promise.all([
    prisma.youtubeVideo.findMany({
      where: { dueDate: { lt: today }, status: { not: "PUBLISHED" } },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.tiktokClip.findMany({
      where: { dueDate: { lt: today }, status: { not: "POSTED" } },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.comment.findMany({
      where: { isSystem: false, createdAt: { gte: since } },
      select: {
        id: true,
        author: true,
        body: true,
        createdAt: true,
        youtubeVideoId: true,
        tiktokClipId: true,
        youtubeVideo: { select: { title: true } },
        tiktokClip: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const entries: NotificationEntry[] = [];

  for (const v of overdueVideos) {
    entries.push({
      id: `overdue-yt-${v.id}`,
      kind: "youtube",
      itemId: v.id,
      itemTitle: v.title,
      type: "overdue",
      message: `Overdue since ${v.dueDate!.toISOString().slice(0, 10)}`,
      at: v.dueDate!.toISOString(),
    });
  }
  for (const c of overdueClips) {
    entries.push({
      id: `overdue-tt-${c.id}`,
      kind: "tiktok",
      itemId: c.id,
      itemTitle: c.title,
      type: "overdue",
      message: `Overdue since ${c.dueDate!.toISOString().slice(0, 10)}`,
      at: c.dueDate!.toISOString(),
    });
  }
  for (const c of recentComments) {
    const kind: "youtube" | "tiktok" = c.youtubeVideoId ? "youtube" : "tiktok";
    const itemTitle = c.youtubeVideo?.title ?? c.tiktokClip?.title ?? "Untitled";
    const itemId = c.youtubeVideoId ?? c.tiktokClipId ?? "";
    entries.push({
      id: `comment-${c.id}`,
      kind,
      itemId,
      itemTitle,
      type: "comment",
      message: `${c.author}: ${c.body}`,
      at: c.createdAt.toISOString(),
    });
  }

  entries.sort((a, b) => (a.at < b.at ? 1 : -1));
  return entries;
}
