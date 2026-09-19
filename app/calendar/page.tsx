import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  adjacentMonth,
  getMonthGrid,
  monthLabel,
  monthParam,
  parseMonthParam,
} from "@/lib/calendar";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalItem = { id: string; title: string; kind: "youtube" | "tiktok" };

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
      where: { dueDate: { gte: rangeStart, lt: rangeEnd } },
      select: { id: true, title: true, dueDate: true },
    }),
    prisma.tiktokClip.findMany({
      where: { dueDate: { gte: rangeStart, lt: rangeEnd } },
      select: { id: true, title: true, dueDate: true },
    }),
  ]);

  const byDate = new Map<string, CalItem[]>();
  for (const v of videos) {
    const iso = v.dueDate!.toISOString().slice(0, 10);
    if (!byDate.has(iso)) byDate.set(iso, []);
    byDate.get(iso)!.push({ id: v.id, title: v.title, kind: "youtube" });
  }
  for (const c of clips) {
    const iso = c.dueDate!.toISOString().slice(0, 10);
    if (!byDate.has(iso)) byDate.set(iso, []);
    byDate.get(iso)!.push({ id: c.id, title: c.title, kind: "tiktok" });
  }

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
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div className="cal-weekday" key={w}>
            {w}
          </div>
        ))}
        {days.map((day) => {
          const items = byDate.get(day.iso) ?? [];
          return (
            <div
              key={day.iso}
              className={`cal-day${day.inMonth ? "" : " outside"}${day.isToday ? " today" : ""}`}
            >
              <span className="cal-daynum">{day.dayOfMonth}</span>
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/${item.kind}?open=${item.id}`}
                  className="cal-item"
                  style={{ ["--c" as string]: item.kind === "youtube" ? "#FF0000" : "#25F4EE" }}
                  title={item.title}
                >
                  <span
                    className="platform-dot"
                    style={{ background: item.kind === "youtube" ? "#FF0000" : "#25F4EE" }}
                  />
                  {item.title}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
