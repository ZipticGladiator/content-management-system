"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computePace, GOAL_PLATFORM_LABELS, type GoalEntry } from "@/lib/goals";
import { formatCount, fmtDate } from "@/lib/format";
import GoalDialog from "@/components/GoalDialog";
import Sparkline from "@/components/Sparkline";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";
import type { GoalInput } from "@/app/goals/actions";

type Props = {
  items: GoalEntry[];
  onCreate: (data: GoalInput) => Promise<void>;
  onUpdate: (id: string, data: GoalInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function platformIcon(platform: GoalEntry["platform"]) {
  return platform === "YOUTUBE" ? <YouTubeIcon size={18} /> : <TikTokIcon size={18} />;
}

function daysLeft(deadline: string | null): string | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(ms / 86400000);
  if (days < 0) return "past deadline";
  if (days === 0) return "due today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

const PACE_COLOR: Record<string, string> = {
  good: "var(--accent)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  neutral: "var(--muted)",
};

export default function GoalsView({ items, onCreate, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const [dialogItem, setDialogItem] = useState<GoalEntry | null | "new">(null);

  function closeDialog() {
    setDialogItem(null);
  }

  async function handleSave(data: GoalInput) {
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

  return (
    <section style={{ marginTop: 48, paddingTop: 40, borderTop: "1px solid var(--line)" }}>
      <div className="bar" style={{ marginBottom: 4 }}>
        <div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 22, margin: 0 }}>Goals</h2>
          <p className="sub" style={{ margin: "4px 0 0" }}>
            Subscriber and follower targets — live where the account is connected
          </p>
        </div>
        <span className="grow" />
        <button className="btn primary" onClick={() => setDialogItem("new")}>
          Add goal
        </button>
      </div>

      {items.length ? (
        <div className="insp-grid">
          {items.map((item) => {
            const current = item.liveCurrent ?? item.manualCurrent;
            const pct = item.target > 0 ? Math.min(100, Math.round((current / item.target) * 100)) : 0;
            const remaining = daysLeft(item.deadline);
            const pace = computePace(item.history, item.target, item.deadline);
            return (
              <button className="insp-card" key={item.id} onClick={() => setDialogItem(item)} style={{ gap: 10 }}>
                <div className="insp-card-top">
                  <span className="insp-platform">{platformIcon(item.platform)}</span>
                  <span className="cat">{GOAL_PLATFORM_LABELS[item.platform]}</span>
                </div>
                <span className="insp-name">{item.label || `${GOAL_PLATFORM_LABELS[item.platform]} goal`}</span>
                <span className="insp-followers">
                  {formatCount(current)} <span className="cat">/ {formatCount(item.target)}</span>
                </span>
                <Sparkline points={item.history.map((h) => h.value)} target={item.target} width={260} height={44} />
                <span className="meta" style={{ width: "100%" }}>
                  <span>{pct}% there</span>
                  <span style={{ color: PACE_COLOR[pace.tone] }}>{pace.label}</span>
                  {item.liveCurrent != null ? <span>live</span> : <span>manual count</span>}
                  {remaining ? <span>{remaining}</span> : null}
                  {item.deadline ? <span>{fmtDate(item.deadline)}</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="tablewrap">
          <div className="empty">No goals yet. Set a subscriber or follower target above.</div>
        </div>
      )}

      {dialogItem ? (
        <GoalDialog
          initial={dialogItem === "new" ? null : dialogItem}
          onClose={closeDialog}
          onSave={handleSave}
          onDelete={dialogItem !== "new" ? handleDelete : undefined}
        />
      ) : null}
    </section>
  );
}
