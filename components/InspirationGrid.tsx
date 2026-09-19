"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_LABELS, TYPE_KEYS, TYPE_LABELS, type InspirationEntry } from "@/lib/inspiration";
import { formatCount } from "@/lib/format";
import InspirationDialog from "@/components/InspirationDialog";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";
import CompassIcon from "@/components/icons/CompassIcon";
import type { InspirationInput } from "@/app/inspiration/actions";

type Props = {
  items: InspirationEntry[];
  onCreate: (data: InspirationInput) => Promise<void>;
  onUpdate: (id: string, data: InspirationInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function platformIcon(platform: InspirationEntry["platform"]) {
  if (platform === "YOUTUBE") return <YouTubeIcon size={18} />;
  if (platform === "TIKTOK") return <TikTokIcon size={18} />;
  return <CompassIcon size={18} />;
}

export default function InspirationGrid({ items, onCreate, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const [type, setType] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [dialogItem, setDialogItem] = useState<InspirationEntry | null | "new">(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => {
        const matchesType = type === "all" || i.type === type;
        const matchesQ = !q || `${i.name} ${i.description}`.toLowerCase().includes(q);
        return matchesType && matchesQ;
      })
      .sort((a, b) => b.followers - a.followers);
  }, [items, type, query]);

  function closeDialog() {
    setDialogItem(null);
  }

  async function handleSave(data: InspirationInput) {
    if (dialogItem === "new") await onCreate(data);
    else if (dialogItem) await onUpdate(dialogItem.id, data);
    router.refresh();
  }

  async function handleDelete() {
    if (dialogItem && dialogItem !== "new") {
      await onDelete(dialogItem.id);
      router.refresh();
    }
  }

  const competitorCount = items.filter((i) => i.type === "COMPETITOR").length;
  const inspirationCount = items.filter((i) => i.type === "INSPIRATION").length;

  return (
    <>
      <header className="page-header">
        <div className="page-title">
          <span className="page-icon">
            <CompassIcon size={36} />
          </span>
          <div>
            <h1>Inspiration</h1>
            <p className="sub">Channels worth watching — competitors and creators to learn from</p>
          </div>
        </div>
      </header>

      <div className="stats">
        <div className="stat">
          <b>{items.length}</b>
          <span>tracked channels</span>
        </div>
        <div className="stat">
          <b>{competitorCount}</b>
          <span>competitors</span>
        </div>
        <div className="stat">
          <b>{inspirationCount}</b>
          <span>inspirations</span>
        </div>
      </div>

      <div className="bar">
        <div className="tabs" role="group" aria-label="Filter by type">
          <button aria-pressed={type === "all"} onClick={() => setType("all")}>
            All
          </button>
          {TYPE_KEYS.map((key) => (
            <button key={key} aria-pressed={type === key} onClick={() => setType(key)}>
              {TYPE_LABELS[key]}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search channels"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search channels"
        />
        <span className="grow" />
        <button className="btn primary" onClick={() => setDialogItem("new")}>
          Add channel
        </button>
      </div>

      {filtered.length ? (
        <div className="insp-grid">
          {filtered.map((item) => (
            <button className="insp-card" key={item.id} onClick={() => setDialogItem(item)}>
              <div className="insp-card-top">
                <span className="insp-platform">{platformIcon(item.platform)}</span>
                <span className={`insp-badge insp-badge-${item.type.toLowerCase()}`}>
                  {TYPE_LABELS[item.type]}
                </span>
              </div>
              <span className="insp-name">{item.name}</span>
              <span className="insp-followers">
                {formatCount(item.followers)}
                <span className="cat"> {PLATFORM_LABELS[item.platform].toLowerCase()} followers</span>
              </span>
              {item.description ? <p className="insp-desc">{item.description}</p> : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="tablewrap">
          <div className="empty">No channels yet. Add a competitor or inspiration above.</div>
        </div>
      )}

      {dialogItem ? (
        <InspirationDialog
          initial={dialogItem === "new" ? null : dialogItem}
          onClose={closeDialog}
          onSave={handleSave}
          onDelete={dialogItem !== "new" ? handleDelete : undefined}
        />
      ) : null}
    </>
  );
}
