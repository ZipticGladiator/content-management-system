"use client";

import { useState } from "react";
import { CATEGORY_KEYS, CATEGORY_LABELS, type StageDef } from "@/lib/pipeline";
import type { ItemKind, PipelineItem, PipelineItemInput } from "@/lib/types";
import CommentsSection from "@/components/CommentsSection";
import AttachmentsSection from "@/components/AttachmentsSection";

type Props = {
  kind: ItemKind;
  stages: readonly StageDef[];
  steps?: readonly (readonly [string, string])[];
  showCostAndEditor?: boolean;
  showTopPick?: boolean;
  initial: PipelineItem | null;
  onClose: () => void;
  onSave: (data: PipelineItemInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function ItemDialog({
  kind,
  stages,
  steps,
  showCostAndEditor,
  showTopPick = true,
  initial,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const isNew = !initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [pitch, setPitch] = useState(initial?.pitch ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? CATEGORY_KEYS[0]);
  const [status, setStatus] = useState(initial?.status ?? stages[0][0]);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [cost, setCost] = useState(initial?.cost ?? 0);
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [editor, setEditor] = useState(initial?.editor ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [topPick, setTopPick] = useState(initial?.topPick ?? false);
  const [stepState, setStepState] = useState<Record<string, boolean>>(initial?.steps ?? {});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title: title.trim() || "Untitled",
        pitch: pitch.trim(),
        category: category as PipelineItem["category"],
        status,
        dueDate: dueDate || null,
        cost: Math.max(0, Number(cost) || 0),
        paid,
        editor: editor.trim(),
        url: url.trim(),
        notes,
        topPick,
        steps: steps ? stepState : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm(`Delete "${title}"?`)) return;
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
          <h3>{isNew ? "New video idea" : "Edit video"}</h3>
          <div className="formgrid">
            <label className="f full">
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
            </label>
            <label className="f full">
              Pitch
              <textarea rows={2} value={pitch} onChange={(e) => setPitch(e.target.value)} />
            </label>
            <label className="f">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {stages.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              Due date
              <input type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            {showCostAndEditor ? (
              <>
                <label className="f">
                  Editing cost (R)
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                  />
                </label>
                <label className="f">
                  Editor
                  <input value={editor} onChange={(e) => setEditor(e.target.value)} placeholder="Who is editing?" />
                </label>
                <div className="f full">
                  <div className="checks">
                    <label>
                      <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
                      Paid
                    </label>
                  </div>
                </div>
              </>
            ) : null}
            <label className="f full">
              Video link
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            </label>
            {steps ? (
              <div className="f full">
                <label className="f" style={{ marginBottom: 4 }}>
                  Production checklist
                </label>
                <div className="checks">
                  {steps.map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={!!stepState[key]}
                        onChange={(e) => setStepState((s) => ({ ...s, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                  {showTopPick ? (
                    <label>
                      <input type="checkbox" checked={topPick} onChange={(e) => setTopPick(e.target.checked)} />
                      Top pick
                    </label>
                  ) : null}
                </div>
              </div>
            ) : showTopPick ? (
              <div className="f full">
                <div className="checks">
                  <label>
                    <input type="checkbox" checked={topPick} onChange={(e) => setTopPick(e.target.checked)} />
                    Top pick
                  </label>
                </div>
              </div>
            ) : null}
            <label className="f full">
              Notes
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Hooks, guests, B-roll, sponsor…"
              />
            </label>
          </div>
          <div className="actions">
            {!isNew && onDelete ? (
              <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            ) : null}
            {url ? (
              <a className="btn" href={url} target="_blank" rel="noopener noreferrer">
                Open video
              </a>
            ) : null}
            <span className="grow" />
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Add idea" : "Save changes"}
            </button>
          </div>
        </form>
        {!isNew && initial ? (
          <div className="dlg" style={{ paddingTop: 0 }}>
            <AttachmentsSection kind={kind} itemId={initial.id} />
            <CommentsSection kind={kind} itemId={initial.id} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
