import { prisma } from "@/lib/prisma";
import TrashView from "@/components/TrashView";
import { purgeItem, restoreItem } from "@/app/trash/actions";
import type { TrashEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const [videos, clips] = await Promise.all([
    prisma.youtubeVideo.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, title: true, category: true, cost: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.tiktokClip.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, title: true, category: true, cost: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  const items: TrashEntry[] = [
    ...videos.map((v) => ({
      id: v.id,
      kind: "youtube" as const,
      title: v.title,
      category: v.category,
      cost: v.cost,
      deletedAt: v.deletedAt!.toISOString(),
    })),
    ...clips.map((c) => ({
      id: c.id,
      kind: "tiktok" as const,
      title: c.title,
      category: c.category,
      cost: c.cost,
      deletedAt: c.deletedAt!.toISOString(),
    })),
  ].sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));

  return <TrashView items={items} onRestore={restoreItem} onPurge={purgeItem} />;
}
