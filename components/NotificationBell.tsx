"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BellIcon from "@/components/icons/BellIcon";
import { timeAgo } from "@/lib/format";
import type { NotificationEntry } from "@/lib/notifications";

const SEEN_KEY = "cms:notif:seen";

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // localStorage unavailable — badge just won't persist across visits
  }
}

export default function NotificationBell({ notifications }: { notifications: NotificationEntry[] }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reads localStorage, which isn't available during SSR — a one-time sync
    // on mount, not derivable state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen(loadSeen());
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const overdue = notifications.filter((n) => n.type === "overdue");
  const comments = notifications.filter((n) => n.type === "comment");
  const unseenCount = notifications.filter((n) => !seen.has(n.id)).length;

  function handleToggle() {
    setOpen((v) => {
      const next = !v;
      if (next) {
        // Opening the bell marks everything currently shown as seen, so the
        // badge only grows again once a genuinely new notification appears.
        const all = new Set(notifications.map((n) => n.id));
        setSeen(all);
        saveSeen(all);
      }
      return next;
    });
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        type="button"
        className="btn theme-toggle"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <BellIcon size={15} />
        {unseenCount ? <span className="notif-badge">{unseenCount}</span> : null}
      </button>
      {open ? (
        <div className="notif-panel">
          {notifications.length === 0 ? (
            <p className="cat" style={{ padding: 14 }}>
              Nothing needs your attention right now.
            </p>
          ) : (
            <>
              {overdue.length ? (
                <div className="notif-section">
                  <h5>Overdue ({overdue.length})</h5>
                  {overdue.map((n) => (
                    <Link
                      key={n.id}
                      href={`/${n.kind}?open=${n.itemId}`}
                      className="notif-item"
                      onClick={() => setOpen(false)}
                    >
                      <span className="notif-title">{n.itemTitle}</span>
                      <span className="cat">{n.message}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
              {comments.length ? (
                <div className="notif-section">
                  <h5>Recent comments ({comments.length})</h5>
                  {comments.map((n) => (
                    <Link
                      key={n.id}
                      href={`/${n.kind}?open=${n.itemId}`}
                      className="notif-item"
                      onClick={() => setOpen(false)}
                    >
                      <span className="notif-title">{n.itemTitle}</span>
                      <span className="cat">{n.message}</span>
                      <span className="cat">{timeAgo(n.at)}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
