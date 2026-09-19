"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ATTACHMENTS_BUCKET, supabaseAdmin } from "@/lib/supabase-admin";
import type { AttachmentEntry, ItemKind } from "@/lib/types";

function toEntry(row: { id: string; label: string; url: string; createdAt: Date }): AttachmentEntry {
  return { id: row.id, label: row.label, url: row.url, createdAt: row.createdAt.toISOString() };
}

function fkFor(kind: ItemKind, itemId: string) {
  return kind === "youtube" ? { youtubeVideoId: itemId } : { tiktokClipId: itemId };
}

export async function getAttachments(kind: ItemKind, itemId: string): Promise<AttachmentEntry[]> {
  const rows = await prisma.attachment.findMany({
    where: fkFor(kind, itemId),
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toEntry);
}

export async function uploadAttachment(
  kind: ItemKind,
  itemId: string,
  formData: FormData
): Promise<AttachmentEntry> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${kind}/${itemId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data } = supabaseAdmin.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path);

  const label = String(formData.get("label") || "").trim() || file.name;
  const row = await prisma.attachment.create({
    data: { ...fkFor(kind, itemId), label, url: data.publicUrl },
  });

  revalidatePath(kind === "youtube" ? "/youtube" : "/tiktok");
  return toEntry(row);
}

export async function deleteAttachment(kind: ItemKind, id: string): Promise<void> {
  const row = await prisma.attachment.findUnique({ where: { id } });
  await prisma.attachment.delete({ where: { id } });
  if (row) {
    const prefix = `${kind}/`;
    const marker = row.url.split(`/${ATTACHMENTS_BUCKET}/`)[1];
    if (marker && marker.startsWith(prefix)) {
      await supabaseAdmin.storage.from(ATTACHMENTS_BUCKET).remove([marker]);
    }
  }
  revalidatePath(kind === "youtube" ? "/youtube" : "/tiktok");
}
