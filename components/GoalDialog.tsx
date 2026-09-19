"use client";

import { useState } from "react";
import { GOAL_PLATFORM_KEYS, GOAL_PLATFORM_LABELS, type GoalEntry } from "@/lib/goals";
import type { GoalInput } from "@/app/goals/actions";

type Props = {
  initial: GoalEntry | null;
  onClose: () => void;
  onSave: (data: GoalInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function GoalDialog({ initial, onClose, onSave, onDelete }: Props) {
  const isNew = !initial;
  const [platform, setPlatform] = useState(initial?.platform ?? GOAL_PLATFORM_KEYS[0]);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [target, setTarget] = useState(initial?.target ?? 1000);
  const [manualCurrent, setManualCurrent] = useState(initial?.manualCurrent ?? 0);
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLive = initial?.liveCurrent != null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        platform: platform as GoalInput["platform"],
        label: label.trim(),
        target: Math.max(0, Number(target) || 0),
        manualCurrent: Math.max(0, Number(manualCurrent) || 0),
        deadline: deadline || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this goal?")) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <form className="dlg" onSubmit={handleSubmit}>
          <h3>{isNew ? "New goal" : "Edit goal"}</h3>
          <div className="formgrid">
            <label className="f">
              Platform
              <select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
                {GOAL_PLATFORM_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {GOAL_PLATFORM_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              Target
              <input type="number" min={0} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
            </label>
            <label className="f full">
              Label
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Hit monetization, 10K before Q1"
              />
            </label>
            <label className="f">
              {isLive ? "Starting point (used before connecting)" : "Current count"}
              <input
                type="number"
                min={0}
                value={manualCurrent}
                onChange={(e) => setManualCurrent(Number(e.target.value))}
              />
            </label>
            <label className="f">
              Deadline (optional)
              <input type="date" value={deadline ?? ""} onChange={(e) => setDeadline(e.target.value)} />
            </label>
            {isLive ? (
              <p className="cat full" style={{ margin: 0 }}>
                This platform is connected — progress uses the live count ({initial!.liveCurrent!.toLocaleString()})
                instead of the number above.
              </p>
            ) : null}
          </div>
          <div className="actions">
            {!isNew && onDelete ? (
              <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            ) : null}
            <span className="grow" />
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Add goal" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
