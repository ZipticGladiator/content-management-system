"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rand } from "@/lib/format";
import type { EditorEntry, FinanceSummary } from "@/lib/finance";
import EditorDialog from "@/components/EditorDialog";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";
import CompassIcon from "@/components/icons/CompassIcon";
import type { EditorInput } from "@/app/finance/actions";
import type { UnpaidItem } from "@/lib/finance";

type Props = {
  summary: FinanceSummary;
  editors: EditorEntry[];
  onCreate: (data: EditorInput) => Promise<void>;
  onUpdate: (id: string, data: EditorInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMarkPaid: (items: UnpaidItem[]) => Promise<void>;
};

function maskAccount(number: string): string {
  if (!number) return "Not on file";
  const last4 = number.slice(-4);
  return `•••• •••• ${last4}`;
}

export default function FinanceView({ summary, editors, onCreate, onUpdate, onDelete, onMarkPaid }: Props) {
  const router = useRouter();
  const [dialogItem, setDialogItem] = useState<EditorEntry | null | "new">(null);
  const [payingEditor, setPayingEditor] = useState<string | null>(null);

  async function handleMarkPaid(editor: string, items: UnpaidItem[]) {
    setPayingEditor(editor);
    try {
      await onMarkPaid(items);
      router.refresh();
    } finally {
      setPayingEditor(null);
    }
  }

  function closeDialog() {
    setDialogItem(null);
  }

  async function handleSave(data: EditorInput) {
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
    <div className="wrap">
      <header className="page-header">
        <div className="page-title">
          <span className="page-icon">
            <CompassIcon size={36} />
          </span>
          <div>
            <h1>Finance</h1>
            <p className="sub">Spend forecast, actuals, and editor payment details</p>
          </div>
        </div>
      </header>

      <div className="stats">
        <div className="stat">
          <b>{rand(summary.totalForecasted)}</b>
          <span>forecasted spend</span>
        </div>
        <div className="stat">
          <b>{rand(summary.totalPaid)}</b>
          <span>paid so far</span>
        </div>
        <div className="stat over">
          <b>{rand(summary.totalOutstanding)}</b>
          <span>outstanding</span>
        </div>
      </div>

      <div className="insp-grid" style={{ marginBottom: 32 }}>
        <div className="insp-card" style={{ cursor: "default" }}>
          <div className="insp-card-top">
            <span className="insp-platform">
              <YouTubeIcon size={18} />
            </span>
            <span className="cat">YouTube · {summary.youtube.count} videos</span>
          </div>
          <span className="insp-followers">{rand(summary.youtube.forecasted)}</span>
          <span className="meta" style={{ width: "100%" }}>
            <span>{rand(summary.youtube.paid)} paid</span>
            <span>{rand(summary.youtube.outstanding)} outstanding</span>
          </span>
        </div>
        <div className="insp-card" style={{ cursor: "default" }}>
          <div className="insp-card-top">
            <span className="insp-platform">
              <TikTokIcon size={18} />
            </span>
            <span className="cat">TikTok · {summary.tiktok.count} clips</span>
          </div>
          <span className="insp-followers">{rand(summary.tiktok.forecasted)}</span>
          <span className="meta" style={{ width: "100%" }}>
            <span>{rand(summary.tiktok.paid)} paid</span>
            <span>{rand(summary.tiktok.outstanding)} outstanding</span>
          </span>
        </div>
      </div>

      {summary.byEditor.length ? (
        <>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, margin: "0 0 12px" }}>Spend by editor</h2>
          <div className="tablewrap" style={{ marginBottom: 32 }}>
            <table>
              <thead>
                <tr>
                  <th>Editor</th>
                  <th>Items</th>
                  <th>Forecasted</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {summary.byEditor.map((e) => (
                  <tr key={e.editor}>
                    <td>{e.editor}</td>
                    <td className="cat">{e.count}</td>
                    <td className="num">{rand(e.forecasted)}</td>
                    <td className="num">{rand(e.paid)}</td>
                    <td className="num">{rand(e.outstanding)}</td>
                    <td>
                      {e.unpaidItems.length ? (
                        <button
                          className="btn"
                          onClick={() => handleMarkPaid(e.editor, e.unpaidItems)}
                          disabled={payingEditor === e.editor}
                        >
                          {payingEditor === e.editor
                            ? "Marking…"
                            : `Mark ${e.unpaidItems.length} paid`}
                        </button>
                      ) : (
                        <span className="cat">All paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <div className="bar">
        <h2 style={{ fontFamily: "var(--display)", fontSize: 20, margin: 0 }}>Editors</h2>
        <span className="grow" />
        <button className="btn primary" onClick={() => setDialogItem("new")}>
          Add editor
        </button>
      </div>

      {editors.length ? (
        <div className="insp-grid">
          {editors.map((e) => (
            <button className="insp-card" key={e.id} onClick={() => setDialogItem(e)}>
              <span className="insp-name">{e.name}</span>
              {e.email ? <span className="cat">{e.email}</span> : null}
              <span className="insp-followers">
                {rand(e.rate)} <span className="cat">{e.rateUnit}</span>
              </span>
              <span className="meta" style={{ width: "100%" }}>
                <span>{e.bankName || "No bank on file"}</span>
                <span>{maskAccount(e.accountNumber)}</span>
              </span>
              {e.notes ? <p className="insp-desc">{e.notes}</p> : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="tablewrap">
          <div className="empty">No editors yet. Add one to track their rate and payment details.</div>
        </div>
      )}

      {dialogItem ? (
        <EditorDialog
          initial={dialogItem === "new" ? null : dialogItem}
          onClose={closeDialog}
          onSave={handleSave}
          onDelete={dialogItem !== "new" ? handleDelete : undefined}
        />
      ) : null}
    </div>
  );
}
