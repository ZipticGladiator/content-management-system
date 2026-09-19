"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ScriptStatus } from "@/app/generated/prisma/client";
import type { DraftResult } from "@/lib/ai";

type Props = {
  id: string;
  parentTitle: string;
  platform: "YouTube" | "TikTok";
  initialBody: string;
  initialStatus: ScriptStatus;
  onSave: (id: string, body: string, status: ScriptStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onGenerateDraft: (id: string) => Promise<DraftResult>;
};

const GENERATE_ATTEMPTS = 3;
// This model fails transiently often enough that a single try isn't
// reliable, but a config error (no key set) will never succeed on retry.
const NON_RETRYABLE_REASON = "GEMINI_API_KEY isn't configured";

export default function ScriptEditor({
  id,
  parentTitle,
  platform,
  initialBody,
  initialStatus,
  onSave,
  onDelete,
  onGenerateDraft,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [status, setStatus] = useState<ScriptStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(id, body, status);
      setDirty(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete this script for "${parentTitle}"?`)) return;
    await onDelete(id);
  }

  async function handleGenerateDraft() {
    if (body.trim() && !confirm("Replace the current script with an AI-generated draft?")) return;
    setGenerating(true);
    setAiError(null);
    try {
      let result: DraftResult = { ok: false, reason: "Something went wrong" };
      for (let attempt = 0; attempt < GENERATE_ATTEMPTS; attempt++) {
        // Each attempt is its own server action invocation, so a slow or
        // failed try can't stack up into one request that risks a
        // serverless timeout — see lib/ai.ts.
        result = await onGenerateDraft(id);
        if (result.ok || result.reason === NON_RETRYABLE_REASON) break;
        if (attempt < GENERATE_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, 500));
      }
      if (result.ok) {
        setBody(result.text);
        setDirty(true);
      } else {
        setAiError(result.reason);
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <p className="cat" style={{ marginBottom: 4 }}>
            <Link className="linkish" href="/scripts">
              ← All scripts
            </Link>
          </p>
          <h1>{parentTitle}</h1>
          <p className="sub">{platform} script</p>
        </div>
      </header>

      <div className="bar">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ScriptStatus);
            setDirty(true);
          }}
          aria-label="Script status"
        >
          <option value="DRAFT">Draft</option>
          <option value="FINAL">Final</option>
        </select>
        <span className="grow" />
        <button className="btn" onClick={handleGenerateDraft} disabled={generating}>
          {generating ? "Generating…" : "Generate with AI"}
        </button>
        <button className="btn danger" onClick={handleDelete}>
          Delete
        </button>
        <button className="btn primary" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {aiError ? (
        <p className="cat" style={{ color: "var(--danger)", margin: "0 0 12px" }}>
          Couldn&apos;t generate a draft — {aiError}.
        </p>
      ) : null}

      <textarea
        className="scripteditor"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setDirty(true);
        }}
        placeholder="Write the script here — hook, sections, call to action…"
      />
    </div>
  );
}
