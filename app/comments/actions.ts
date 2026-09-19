"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { CommentEntry, ItemKind } from "@/lib/types";

function toEntry(row: { id: string; author: string; body: string; createdAt: Date }): CommentEntry {
  return { id: row.id, author: row.author, body: row.body, createdAt: row.createdAt.toISOString() };
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

export async function addComment(kind: ItemKind, itemId: string, author: string, body: string): Promise<CommentEntry> {
  const cleanAuthor = author.trim() || "Anonymous";
  const cleanBody = body.trim();
  const row = await prisma.comment.create({
    data: { ...fkFor(kind, itemId), author: cleanAuthor, body: cleanBody },
  });
  revalidatePath(kind === "youtube" ? "/youtube" : "/tiktok");
  return toEntry(row);
}

export async function deleteComment(kind: ItemKind, id: string): Promise<void> {
  await prisma.comment.delete({ where: { id } });
  revalidatePath(kind === "youtube" ? "/youtube" : "/tiktok");
}
