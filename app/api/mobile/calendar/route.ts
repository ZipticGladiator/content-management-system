import { NextResponse, type NextRequest } from "next/server";
import { adjacentMonth, monthLabel, monthParam, parseMonthParam } from "@/lib/calendar";
import { handle, requireScoped } from "@/lib/mobile-api";

/** GET ?month=YYYY-MM — every video/clip due in that month, as a flat date-sorted agenda. */
export const GET = handle(async (req: NextRequest) => {
  const { db } = await requireScoped(req);
  const { year, monthIndex0 } = parseMonthParam(req.nextUrl.searchParams.get("month") ?? undefined);
  const start = new Date(Date.UTC(year, monthIndex0, 1));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 1));
  const where = { deletedAt: null, dueDate: { gte: start, lt: end } };
  const select = { id: true, title: true, dueDate: true, status: true } as const;

  const [videos, clips] = await Promise.all([
    db.youtubeVideo.findMany({ where, select }),
    db.tiktokClip.findMany({ where, select }),
  ]);

  const items = [
    ...videos.map((v) => ({ ...v, kind: "youtube" as const })),
    ...clips.map((c) => ({ ...c, kind: "tiktok" as const })),
  ]
    .map((i) => ({ id: i.id, kind: i.kind, title: i.title, status: i.status, date: i.dueDate!.toISOString().slice(0, 10) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const prev = adjacentMonth(year, monthIndex0, -1);
  const next = adjacentMonth(year, monthIndex0, 1);
  return NextResponse.json({
    month: monthParam(year, monthIndex0),
    label: monthLabel(year, monthIndex0),
    prev: monthParam(prev.year, prev.monthIndex0),
    next: monthParam(next.year, next.monthIndex0),
    items,
  });
});
