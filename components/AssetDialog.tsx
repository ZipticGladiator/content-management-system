"use client";

import { useState } from "react";
import { ASSET_TYPE_KEYS, ASSET_TYPE_LABELS, guessAssetType, type AssetEntry, type AssetItemOption, type AssetTypeKey } from "@/lib/assets";
import type { AssetInput } from "@/app/assets/actions";

type Props = {
  initial: AssetEntry | null;
  itemOptions: AssetItemOption[];
  onClose: () => void;
  onSave: (data: AssetInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function AssetDialog({ initial, itemOptions, onClose, onSave, onDelete }: Props) {
  const isNew = !initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [type, setType] = useState<AssetTypeKey>(initial?.type ?? "THUMBNAIL");
  // Until the type is picked by hand, a pasted link can suggest one (e.g. a Google Doc → Document).
  const [typeTouched, setTypeTouched] = useState(!isNew);
  const [itemKey, setItemKey] = useState(initial?.item ? `${initial.item.kind}:${initial.item.id}` : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a linked item that's now in Trash selectable, so editing doesn't silently unlink it.
  const options =
    initial?.item && !itemOptions.some((o) => o.kind === initial.item!.kind && o.id === initial.item!.id)
      ? [...itemOptions, initial.item]
      : itemOptions;

  function handleUrl(value: string) {
    setUrl(value);
    if (!typeTouched) {
      const guess = guessAssetType(value);
      if (guess) setType(guess);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const [kind, id] = itemKey.split(":");
      await onSave({
        title,
        url,
        type,
        notes,
        item: kind === "youtube" || kind === "tiktok" ? { kind, id } : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the asset");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm(`Remove "${title}" from Assets? The file on Google Drive isn't touched.`)) return;
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
          <h3>{isNew ? "Add an asset" : "Edit asset"}</h3>
          <div className="formgrid">
            <label className="f full">
              Google Drive link
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                required
                autoFocus={isNew}
              />
            </label>
            <label className="f full">
              Name
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Password cracking — thumbnail v2" required />
            </label>
            <label className="f">
              Type
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as AssetTypeKey);
                  setTypeTouched(true);
                }}
              >
                {ASSET_TYPE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {ASSET_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              For video / clip
              <select value={itemKey} onChange={(e) => setItemKey(e.target.value)}>
                <option value="">Not linked</option>
                <optgroup label="YouTube">
                  {options.filter((o) => o.kind === "youtube").map((o) => (
                    <option key={o.id} value={`youtube:${o.id}`}>
                      {o.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="TikTok">
                  {options.filter((o) => o.kind === "tiktok").map((o) => (
                    <option key={o.id} value={`tiktok:${o.id}`}>
                      {o.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <label className="f full">
              Notes
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Version, who made it, what it's for…" />
            </label>
          </div>
          <p className="sub" style={{ margin: "0 0 12px" }}>
            Tip: for a preview on the card, set the Drive file&apos;s sharing to &ldquo;Anyone with the link&rdquo;.
          </p>
          {error ? <p role="alert" style={{ margin: "0 0 12px", color: "var(--danger)", fontSize: 13 }}>{error}</p> : null}
          <div className="actions">
            {!isNew && onDelete ? (
              <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Removing…" : "Remove"}
              </button>
            ) : null}
            {/^https?:\/\//i.test(url) ? (
              <a className="btn" href={url} target="_blank" rel="noopener noreferrer">
                Open link
              </a>
            ) : null}
            <span className="grow" />
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Add asset" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
