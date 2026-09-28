import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  adjacentMonth,
  getMonthGrid,
  monthLabel,
  monthParam,
  parseMonthParam,
} from "@/lib/calendar";
import CheckIcon from "@/components/icons/CheckIcon";
import CalendarGrid, { type CalGridItem } from "@/components/CalendarGrid";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { year, monthIndex0 } = parseMonthParam(month);
  const days = getMonthGrid(year, monthIndex0);
  const rangeStart = days[0].date;
  const rangeEnd = new Date(days[41].date.getTime() + 86400000);

  const [videos, clips] = await Promise.all([
    prisma.youtubeVideo.findMany({
      where: { deletedAt: null, dueDate: { gte: rangeStart, lt: rangeEnd } },
      select: { id: true, title: true, dueDate: true, status: true },
    }),
    prisma.tiktokClip.findMany({
      where: { deletedAt: null, dueDate: { gte: rangeStart, lt: rangeEnd } },
      select: { id: true, title: true, dueDate: true, status: true },
    }),
  ]);

  const items: CalGridItem[] = [
    ...videos.map((v) => ({
      id: v.id,
      title: v.title,
      kind: "youtube" as const,
      date: v.dueDate!.toISOString().slice(0, 10),
      posted: v.status === "PUBLISHED",
    })),
    ...clips.map((c) => ({
      id: c.id,
      title: c.title,
      kind: "tiktok" as const,
      date: c.dueDate!.toISOString().slice(0, 10),
      posted: c.status === "POSTED",
    })),
  ];

  const prev = adjacentMonth(year, monthIndex0, -1);
  const next = adjacentMonth(year, monthIndex0, 1);

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>Content calendar</h1>
          <p className="sub">Due, scheduled, and posted dates across YouTube and TikTok</p>
        </div>
      </header>

      <div className="bar">
        <Link className="btn" href={`/calendar?month=${monthParam(prev.year, prev.monthIndex0)}`}>
          ← Prev
        </Link>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 20, margin: 0 }}>
          {monthLabel(year, monthIndex0)}
        </h2>
        <Link className="btn" href={`/calendar?month=${monthParam(next.year, next.monthIndex0)}`}>
          Next →
        </Link>
        <span className="grow" />
        <Link className="btn" href="/calendar">
          Today
        </Link>
      </div>

      <div className="legend" style={{ marginBottom: 14 }}>
        <span>
          <i className="sw" style={{ background: "#FF0000" }} /> YouTube
        </span>
        <span>
          <i className="sw" style={{ background: "#25F4EE" }} /> TikTok
        </span>
        <span>
          <CheckIcon size={13} /> Posted
        </span>
        <span className="cal-hint">Drag an item to another day to change its due date</span>
      </div>

      <CalendarGrid
        days={days.map(({ iso, dayOfMonth, inMonth, isToday }) => ({ iso, dayOfMonth, inMonth, isToday }))}
        items={items}
      />
    </div>
  );
}
