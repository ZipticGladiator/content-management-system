import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { notifyAll } from "@/lib/push";

/**
 * Daily morning push listing overdue videos/clips (vercel.json). Authenticated
 * with CRON_SECRET like purge-trash; proxy.ts lets /api/cron through.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const select = { id: true, title: true, dueDate: true } as const;
  const [videos, clips] = await Promise.all([
    prisma.youtubeVideo.findMany({
      where: { deletedAt: null, dueDate: { lt: today }, status: { not: "PUBLISHED" } },
      select,
      orderBy: { dueDate: "asc" },
    }),
    prisma.tiktokClip.findMany({
      where: { deletedAt: null, dueDate: { lt: today }, status: { not: "POSTED" } },
      select,
      orderBy: { dueDate: "asc" },
    }),
  ]);
  const overdue = [
    ...videos.map((v) => ({ ...v, kind: "youtube" as const })),
    ...clips.map((c) => ({ ...c, kind: "tiktok" as const })),
  ];

  if (overdue.length === 1) {
    const [item] = overdue;
    await notifyAll({
      title: `Overdue: ${item.title}`,
      body: `Was due ${fmtDate(item.dueDate!)}. Tap to open it.`,
      data: { kind: item.kind, itemId: item.id },
    });
  } else if (overdue.length > 1) {
    const names = overdue.slice(0, 3).map((i) => i.title).join(", ");
    await notifyAll({
      title: `${overdue.length} items are overdue`,
      body: overdue.length > 3 ? `${names} and ${overdue.length - 3} more` : names,
      data: { screen: "notifications" },
    });
  }

  return NextResponse.json({ overdue: overdue.length });
}
