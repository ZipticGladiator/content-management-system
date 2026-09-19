"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { CommentEntry, ItemKind } from "@/lib/types";

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

export async function getComments(kind: ItemKind, itemId: string): Promise<CommentEntry[]> {
  const rows = await prisma.comment.findMany({
    where: fkFor(kind, itemId),
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toEntry);
}

export async function addComment(kind: ItemKind, itemId: string, body: string): Promise<CommentEntry> {
  const user = await getCurrentUser();
  const cleanAuthor = user?.name || "Anonymous";
  const cleanBody = body.trim();
  const row = await prisma.comment.create({
    data: { ...fkFor(kind, itemId), author: cleanAuthor, body: cleanBody },
  });
  revalidatePath(kind === "youtube" ? "/youtube" : "/tiktok");
  return toEntry(row);
}

/** Logs an automatic system entry (e.g. a status change) into the same thread as regular comments. */
export async function addSystemComment(kind: ItemKind, itemId: string, body: string): Promise<void> {
  await prisma.comment.create({
    data: { ...fkFor(kind, itemId), author: "Activity", body, isSystem: true },
  });
}

export async function deleteComment(kind: ItemKind, id: string): Promise<void> {
  await prisma.comment.delete({ where: { id } });
  revalidatePath(kind === "youtube" ? "/youtube" : "/tiktok");
}
