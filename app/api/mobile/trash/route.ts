import { NextResponse, type NextRequest } from "next/server";
import { handle, requireScoped } from "@/lib/mobile-api";
import type { TrashEntry } from "@/lib/types";

export const GET = handle(async (req: NextRequest) => {
  const { db } = await requireScoped(req);
  const where = { deletedAt: { not: null } };
  const select = { id: true, title: true, category: true, cost: true, deletedAt: true } as const;
  const [videos, clips] = await Promise.all([
    db.youtubeVideo.findMany({ where, select }),
    db.tiktokClip.findMany({ where, select }),
  ]);
  const items: TrashEntry[] = [
    ...videos.map((v) => ({ ...v, kind: "youtube" as const, deletedAt: v.deletedAt!.toISOString() })),
    ...clips.map((c) => ({ ...c, kind: "tiktok" as const, deletedAt: c.deletedAt!.toISOString() })),
  ].sort((a, b) => (a.deletedAt < b.deletedAt ? 1 : -1));
  return NextResponse.json({ items });
});
