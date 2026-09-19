"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/pipeline";
import { rand, timeAgo } from "@/lib/format";
import type { ItemKind, TrashEntry } from "@/lib/types";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";

type Props = {
  items: TrashEntry[];
  onRestore: (kind: ItemKind, id: string) => Promise<void>;
  onPurge: (kind: ItemKind, id: string) => Promise<void>;
};

export default function TrashView({ items, onRestore, onPurge }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleRestore(item: TrashEntry) {
    setBusyId(item.id);
    try {
      await onRestore(item.kind, item.id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handlePurge(item: TrashEntry) {
    if (!confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) return;
    setBusyId(item.id);
    try {
      await onPurge(item.kind, item.id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>Trash</h1>
          <p className="sub">
            Deleted videos and clips — restore them or remove them for good. Anything left here is
            purged automatically after 30 days.
          </p>
        </div>
      </header>

      {items.length ? (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Platform</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Deleted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td className="cat">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {item.kind === "youtube" ? <YouTubeIcon size={14} /> : <TikTokIcon size={14} />}
                      {item.kind === "youtube" ? "YouTube" : "TikTok"}
                    </span>
                  </td>
                  <td className="cat">{CATEGORY_LABELS[item.category]}</td>
                  <td className="num">{item.cost ? rand(item.cost) : <span className="cat">—</span>}</td>
                  <td className="cat">{timeAgo(item.deletedAt)}</td>
                  <td style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn" onClick={() => handleRestore(item)} disabled={busyId === item.id}>
                      {busyId === item.id ? "Working…" : "Restore"}
                    </button>
                    <button className="btn danger" onClick={() => handlePurge(item)} disabled={busyId === item.id}>
                      Delete permanently
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tablewrap">
          <div className="empty">Trash is empty. Deleted videos and clips will show up here.</div>
        </div>
      )}
    </div>
  );
}
