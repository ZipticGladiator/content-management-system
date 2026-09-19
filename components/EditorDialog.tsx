"use client";

import { useState } from "react";
import type { EditorEntry } from "@/lib/finance";
import type { EditorInput } from "@/app/finance/actions";

type Props = {
  initial: EditorEntry | null;
  onClose: () => void;
  onSave: (data: EditorInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function EditorDialog({ initial, onClose, onSave, onDelete }: Props) {
  const isNew = !initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [rate, setRate] = useState(initial?.rate ?? 0);
  const [rateUnit, setRateUnit] = useState(initial?.rateUnit ?? "per video");
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [accountHolder, setAccountHolder] = useState(initial?.accountHolder ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [branchCode, setBranchCode] = useState(initial?.branchCode ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [showAccount, setShowAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: name.trim() || "Untitled editor",
        email: email.trim(),
        rate: Math.max(0, Number(rate) || 0),
        rateUnit: rateUnit.trim() || "per video",
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        branchCode: branchCode.trim(),
        notes,
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
          <h3>{isNew ? "Add editor" : "Edit editor"}</h3>
          <div className="formgrid">
            <label className="f full">
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </label>
            <label className="f full">
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="editor@example.com" />
            </label>
            <label className="f">
              Rate (R)
              <input type="number" min={0} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
            </label>
            <label className="f">
              Rate unit
              <input value={rateUnit} onChange={(e) => setRateUnit(e.target.value)} placeholder="per video" />
            </label>
            <label className="f full">
              Bank name
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Capitec" />
            </label>
            <label className="f">
              Account holder
              <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
            </label>
            <label className="f">
              Branch code
              <input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
            </label>
            <label className="f full">
              Account number
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type={showAccount ? "text" : "password"}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn" onClick={() => setShowAccount((v) => !v)}>
                  {showAccount ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <label className="f full">
              Notes
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>
          <div className="actions">
            {!isNew && onDelete ? (
              <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Removing…" : "Remove"}
              </button>
            ) : null}
            <span className="grow" />
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Add editor" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
