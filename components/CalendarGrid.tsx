"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateYoutubeDueDate } from "@/app/youtube/actions";
import { updateTiktokDueDate } from "@/app/tiktok/actions";
import CheckIcon from "@/components/icons/CheckIcon";
import type { ItemKind } from "@/lib/types";

/** `posted`: a YouTube video marked Published, or a TikTok clip marked Posted. */
export type CalGridItem = { id: string; title: string; kind: ItemKind; date: string; posted: boolean };
export type CalGridDay = { iso: string; dayOfMonth: number; inMonth: boolean; isToday: boolean };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLORS: Record<ItemKind, string> = { youtube: "#FF0000", tiktok: "#25F4EE" };
const UPDATE_DUE_DATE = { youtube: updateYoutubeDueDate, tiktok: updateTiktokDueDate };

const keyOf = (item: { kind: ItemKind; id: string }) => `${item.kind}:${item.id}`;

type Shown = CalGridItem & { saving?: boolean };

/**
 * Month grid where items can be dragged to another day to change their due
 * date — HTML5 drag-and-drop for mouse, long-press-then-drag for touch (same
 * approach as PipelineBoard). Moves show immediately and roll back if saving fails.
 */
export default function CalendarGrid({ days, items }: { days: CalGridDay[]; items: CalGridItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [shown, moveOptimistic] = useOptimistic<Shown[], { key: string; date: string }>(items, (state, move) =>
    state.map((i) => (keyOf(i) === move.key ? { ...i, date: move.date, saving: true } : i))
  );

  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);
  const [touchDrag, setTouchDrag] = useState<{
    key: string;
    touchId: number;
    startX: number;
    startY: number;
    active: boolean;
  } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A long-press drag ends with a tap on the link underneath; swallow that click so it doesn't navigate.
  const suppressClick = useRef(false);

  function moveItem(key: string, date: string) {
    const item = shown.find((i) => keyOf(i) === key);
    if (!item || item.date === date) return;
    startTransition(async () => {
      moveOptimistic({ key, date });
      try {
        await UPDATE_DUE_DATE[item.kind](item.id, date);
        router.refresh();
      } catch {
        alert(`Couldn't move "${item.title}" — please try again.`);
      }
    });
  }

  function handleTouchStart(key: string, e: React.TouchEvent) {
    const t = e.touches[0];
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setTouchDrag((prev) => (prev && prev.key === key ? { ...prev, active: true } : prev));
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    }, 450);
    setTouchDrag({ key, touchId: t.identifier, startX: t.clientX, startY: t.clientY, active: false });
  }

  useEffect(() => {
    if (!touchDrag) return;

    function findDate(x: number, y: number): string | null {
      const el = document.elementFromPoint(x, y);
      const day = el ? (el as HTMLElement).closest<HTMLElement>(".cal-day") : null;
      return day?.dataset.date ?? null;
    }

    function onMove(e: TouchEvent) {
      const t = [...e.touches].find((t) => t.identifier === touchDrag!.touchId);
      if (!t) return;
      if (!touchDrag!.active) {
        // Moved before the long-press fired: it's a scroll, not a drag.
        if (Math.hypot(t.clientX - touchDrag!.startX, t.clientY - touchDrag!.startY) > 10) {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          setTouchDrag(null);
        }
        return;
      }
      e.preventDefault();
      setOverDate(findDate(t.clientX, t.clientY));
    }

    function onEnd(e: TouchEvent) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (touchDrag!.active) {
        suppressClick.current = true;
        // Not every browser fires that click, so don't let the flag eat a later, real one.
        setTimeout(() => (suppressClick.current = false), 400);
        const t = e.changedTouches[0];
        const date = t ? findDate(t.clientX, t.clientY) : null;
        if (date) moveItem(touchDrag!.key, date);
      }
      setOverDate(null);
      setTouchDrag(null);
    }

    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touchDrag]);

  const byDate = new Map<string, Shown[]>();
  for (const item of shown) {
    if (!byDate.has(item.date)) byDate.set(item.date, []);
    byDate.get(item.date)!.push(item);
  }
  const activeKey = draggingKey ?? (touchDrag?.active ? touchDrag.key : null);

  return (
    <div className="cal-grid">
      {WEEKDAYS.map((w) => (
        <div className="cal-weekday" key={w}>
          {w}
        </div>
      ))}
      {days.map((day) => (
        <div
          key={day.iso}
          data-date={day.iso}
          className={`cal-day${day.inMonth ? "" : " outside"}${day.isToday ? " today" : ""}${overDate === day.iso ? " drag-over" : ""}`}
          onDragOver={(e) => {
            if (!draggingKey) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setOverDate(day.iso);
          }}
          onDragLeave={(e) => {
            // Ignore leave events fired when moving between this tile's own children.
            if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
            setOverDate((cur) => (cur === day.iso ? null : cur));
          }}
          onDrop={(e) => {
            e.preventDefault();
            const key = e.dataTransfer.getData("text/plain") || draggingKey;
            setOverDate(null);
            setDraggingKey(null);
            if (key) moveItem(key, day.iso);
          }}
        >
          <span className="cal-daynum">{day.dayOfMonth}</span>
          {(byDate.get(day.iso) ?? []).map((item) => {
            const key = keyOf(item);
            return (
              <Link
                key={key}
                href={`/${item.kind}?open=${item.id}`}
                className={`cal-item${item.posted ? " posted" : ""}${activeKey === key ? " dragging" : ""}${item.saving ? " saving" : ""}`}
                style={{ ["--c" as string]: COLORS[item.kind] }}
                title={`${item.posted ? "Posted: " : ""}${item.title} — drag to another day to change the due date`}
                draggable
                onDragStart={(e) => {
                  setDraggingKey(key);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", key);
                }}
                onDragEnd={() => {
                  setDraggingKey(null);
                  setOverDate(null);
                }}
                onTouchStart={(e) => handleTouchStart(key, e)}
                onClick={(e) => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    e.preventDefault();
                  }
                }}
              >
                <span className="platform-dot" style={{ background: COLORS[item.kind] }} />
                {item.posted ? (
                  <span className="cal-posted" aria-label="Posted">
                    <CheckIcon size={11} />
                  </span>
                ) : null}
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
