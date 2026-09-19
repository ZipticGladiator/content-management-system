"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BellIcon from "@/components/icons/BellIcon";
import { timeAgo } from "@/lib/format";
import type { NotificationEntry } from "@/lib/notifications";

export default function NotificationBell({ notifications }: { notifications: NotificationEntry[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const overdue = notifications.filter((n) => n.type === "overdue");
  const comments = notifications.filter((n) => n.type === "comment");

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        type="button"
        className="btn theme-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <BellIcon size={15} />
        {notifications.length ? <span className="notif-badge">{notifications.length}</span> : null}
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
