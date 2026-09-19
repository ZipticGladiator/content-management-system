"use client";

import { useEffect, useRef, useState } from "react";
import { deleteAttachment, getAttachments, uploadAttachment } from "@/app/attachments/actions";
import PaperclipIcon from "@/components/icons/PaperclipIcon";
import type { AttachmentEntry, ItemKind } from "@/lib/types";

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
}

export default function AttachmentsSection({ kind, itemId }: { kind: ItemKind; itemId: string }) {
  const [attachments, setAttachments] = useState<AttachmentEntry[] | null>(null);
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAttachments(kind, itemId).then((rows) => {
      if (!cancelled) setAttachments(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [kind, itemId]);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("label", label);
      const entry = await uploadAttachment(kind, itemId, formData);
      setAttachments((prev) => [...(prev ?? []), entry]);
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setAttachments((prev) => (prev ?? []).filter((a) => a.id !== id));
    await deleteAttachment(kind, id);
  }

  return (
    <div className="comments">
      <h4 className="comments-heading">
        Attachments{attachments?.length ? <span className="cat"> ({attachments.length})</span> : null}
      </h4>

      <div className="comments-list">
        {attachments === null ? (
          <p className="cat">Loading…</p>
        ) : attachments.length === 0 ? (
          <p className="cat">No files yet — attach a thumbnail or reference below.</p>
        ) : (
          attachments.map((a) => (
            <div className="comment" key={a.id}>
              <span className="comment-avatar">
                {isImage(a.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <PaperclipIcon size={14} />
                )}
              </span>
              <div className="comment-body">
                <div className="comment-meta">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="comment-author">
                    {a.label}
                  </a>
                  <button
                    type="button"
                    className="comment-delete"
                    onClick={() => handleDelete(a.id)}
                    aria-label="Remove attachment"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="comment-composer">
        <input
          className="comment-author-input"
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx" />
        {error ? <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p> : null}
        <button type="button" className="btn primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
}
