import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { notifyAll } from "@/lib/push";

/**
 * Daily morning push listing overdue videos/clips (vercel.json), one push
 * per organization so one workspace's count never gets mixed into another's.
 * Authenticated with CRON_SECRET like purge-trash; proxy.ts lets /api/cron
 * through. The org loop uses the raw, unscoped prisma client deliberately —
 * this is the one place in the app meant to see every org at once.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const select = { id: true, title: true, dueDate: true } as const;

  const orgs = await prisma.organization.findMany({ select: { id: true } });
  let totalOverdue = 0;

  for (const { id: orgId } of orgs) {
    const [videos, clips] = await Promise.all([
      prisma.youtubeVideo.findMany({
        where: { orgId, deletedAt: null, dueDate: { lt: today }, status: { not: "PUBLISHED" } },
        select,
        orderBy: { dueDate: "asc" },
      }),
      prisma.tiktokClip.findMany({
        where: { orgId, deletedAt: null, dueDate: { lt: today }, status: { not: "POSTED" } },
        select,
        orderBy: { dueDate: "asc" },
      }),
    ]);
    const overdue = [
      ...videos.map((v) => ({ ...v, kind: "youtube" as const })),
      ...clips.map((c) => ({ ...c, kind: "tiktok" as const })),
    ];
    totalOverdue += overdue.length;

    if (overdue.length === 1) {
      const [item] = overdue;
      await notifyAll(orgId, {
        title: `Overdue: ${item.title}`,
        body: `Was due ${fmtDate(item.dueDate!)}. Tap to open it.`,
        data: { kind: item.kind, itemId: item.id },
      });
    } else if (overdue.length > 1) {
      const names = overdue.slice(0, 3).map((i) => i.title).join(", ");
      await notifyAll(orgId, {
        title: `${overdue.length} items are overdue`,
        body: overdue.length > 3 ? `${names} and ${overdue.length - 3} more` : names,
        data: { screen: "notifications" },
      });
    }
  }

  return NextResponse.json({ orgs: orgs.length, overdue: totalOverdue });
}
