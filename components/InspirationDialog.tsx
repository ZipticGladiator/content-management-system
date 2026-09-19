"use client";

import { useState } from "react";
import { PLATFORM_KEYS, PLATFORM_LABELS, TYPE_KEYS, TYPE_LABELS, type InspirationEntry } from "@/lib/inspiration";
import type { InspirationInput } from "@/app/inspiration/actions";

type Props = {
  initial: InspirationEntry | null;
  onClose: () => void;
  onSave: (data: InspirationInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function InspirationDialog({ initial, onClose, onSave, onDelete }: Props) {
  const isNew = !initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? PLATFORM_KEYS[0]);
  const [type, setType] = useState(initial?.type ?? "INSPIRATION");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [followers, setFollowers] = useState(initial?.followers ?? 0);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: name.trim() || "Untitled channel",
        platform: platform as InspirationInput["platform"],
        type: type as InspirationInput["type"],
        url: url.trim(),
        followers: Math.max(0, Number(followers) || 0),
        description: description.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm(`Remove "${name}"?`)) return;
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
          <h3>{isNew ? "Add a channel" : "Edit channel"}</h3>
          <div className="formgrid">
            <label className="f full">
              Channel name
              <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </label>
            <label className="f">
              Platform
              <select value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
                {PLATFORM_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {PLATFORM_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              Type
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                {TYPE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="f full">
              Channel link
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            </label>
            <label className="f">
              Subscribers / followers
              <input
                type="number"
                min={0}
                value={followers}
                onChange={(e) => setFollowers(Number(e.target.value))}
              />
            </label>
            <label className="f full">
              Description
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What they cover, tone, format, why they're worth watching…"
              />
            </label>
          </div>
          <div className="actions">
            {!isNew && onDelete ? (
              <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Removing…" : "Remove"}
              </button>
            ) : null}
            {url ? (
              <a className="btn" href={url} target="_blank" rel="noopener noreferrer">
                Open channel
              </a>
            ) : null}
            <span className="grow" />
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Add channel" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
