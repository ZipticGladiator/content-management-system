"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyNewComment } from "@/lib/push";
import { scopedPrisma } from "@/lib/org";
import { getCurrentUser } from "@/lib/session";
import type { CommentEntry, ItemKind } from "@/lib/types";

// Every export takes `orgId` first (see app/youtube/actions.ts) — including
// addComment, even though it's only ever called from the web (CommentsSection,
// a direct "use server" import, not bound from a page): getCurrentUser() still
// resolves the comment's *author*, but org scoping comes from the same
// explicit param as everywhere else, so this file reads one way throughout.

function toEntry(row: {
  id: string;
  author: string;
  body: string;
  isSystem: boolean;
  createdAt: Date;
}): CommentEntry {
  return {
    id: row.id,
    author: row.author,
    body: row.body,
    isSystem: row.isSystem,
    createdAt: row.createdAt.toISOString(),
  };
}

function fkFor(kind: ItemKind, itemId: string) {
  return kind === "youtube" ? { youtubeVideoId: itemId } : { tiktokClipId: itemId };
}

export async function getComments(orgId: string, kind: ItemKind, itemId: string): Promise<CommentEntry[]> {
  const db = scopedPrisma(orgId);
  const rows = await db.comment.findMany({
    where: fkFor(kind, itemId),
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toEntry);
}

export async function addComment(orgId: string, kind: ItemKind, itemId: string, body: string): Promise<CommentEntry> {
  const db = scopedPrisma(orgId);
  const user = await getCurrentUser();
  const cleanAuthor = user?.name || "Anonymous";
  const cleanBody = body.trim();
  const row = await db.comment.create({
    data: { ...fkFor(kind, itemId), author: cleanAuthor, body: cleanBody, orgId },
  });
  revalidatePath(kind === "youtube" ? "/youtube" : "/tiktok");
  after(() => notifyNewComment({ orgId, kind, itemId, author: cleanAuthor, body: cleanBody, authorUserId: user?.uid }));
  return toEntry(row);
}

/** Logs an automatic system entry (e.g. a status change) into the same thread as regular comments. */
export async function addSystemComment(orgId: string, kind: ItemKind, itemId: string, body: string): Promise<void> {
  const db = scopedPrisma(orgId);
  await db.comment.create({
    data: { ...fkFor(kind, itemId), author: "Activity", body, isSystem: true, orgId },
  });
}

export async function deleteComment(orgId: string, kind: ItemKind, id: string): Promise<void> {
  const db = scopedPrisma(orgId);
  await db.comment.delete({ where: { id } });
  revalidatePath(kind === "youtube" ? "/youtube" : "/tiktok");
}
