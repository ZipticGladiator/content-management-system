"use client";

import { useEffect, useState } from "react";
import { addComment, deleteComment, getComments } from "@/app/comments/actions";
import { timeAgo } from "@/lib/format";
import type { CommentEntry, ItemKind } from "@/lib/types";
import ActivityIcon from "@/components/icons/ActivityIcon";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function CommentsSection({ kind, itemId }: { kind: ItemKind; itemId: string }) {
  const [comments, setComments] = useState<CommentEntry[] | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getComments(kind, itemId).then((rows) => {
      if (!cancelled) setComments(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [kind, itemId]);

  async function handlePost() {
    const trimmedBody = body.trim();
    if (!trimmedBody) return;
    setPosting(true);
    try {
      const entry = await addComment(kind, itemId, trimmedBody);
      setComments((prev) => [...(prev ?? []), entry]);
      setBody("");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
    await deleteComment(kind, id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handlePost();
    }
  }

  return (
    <div className="comments">
      <h4 className="comments-heading">
        Comments{comments?.length ? <span className="cat"> ({comments.length})</span> : null}
      </h4>

      <div className="comments-list">
        {comments === null ? (
          <p className="cat">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="cat">No comments yet — leave an update below.</p>
        ) : (
          comments.map((c) =>
            c.isSystem ? (
              <div className="comment activity-entry" key={c.id}>
                <span className="comment-avatar activity-avatar">
                  <ActivityIcon size={13} />
                </span>
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="cat">{c.body}</span>
                    <span className="cat">{timeAgo(c.createdAt)}</span>
                    <button
                      type="button"
                      className="comment-delete"
                      onClick={() => handleDelete(c.id)}
                      aria-label="Delete activity entry"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="comment" key={c.id}>
                <span className="comment-avatar">{initials(c.author)}</span>
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="comment-author">{c.author}</span>
                    <span className="cat">{timeAgo(c.createdAt)}</span>
                    <button
                      type="button"
                      className="comment-delete"
                      onClick={() => handleDelete(c.id)}
                      aria-label="Delete comment"
                    >
                      ×
                    </button>
                  </div>
                  <p className="comment-text">{c.body}</p>
                </div>
              </div>
            )
          )
        )}
      </div>

      <div className="comment-composer">
        <textarea
          rows={2}
          placeholder="Leave an update or comment… (⌘/Ctrl + Enter to post)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="btn primary"
          onClick={handlePost}
          disabled={posting || !body.trim()}
        >
          {posting ? "Posting…" : "Comment"}
        </button>
      </div>
    </div>
  );
}
