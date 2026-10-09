"use server";

import { revalidatePath } from "next/cache";
import { scopedPrisma } from "@/lib/org";

export type TrashKind = "youtube" | "tiktok";

export async function restoreItem(orgId: string, kind: TrashKind, id: string) {
  const db = scopedPrisma(orgId);
  if (kind === "youtube") {
    await db.youtubeVideo.update({ where: { id }, data: { deletedAt: null } });
  } else {
    await db.tiktokClip.update({ where: { id }, data: { deletedAt: null } });
  }
  revalidatePath("/trash");
  revalidatePath(`/${kind}`);
}

export async function purgeItem(orgId: string, kind: TrashKind, id: string) {
  const db = scopedPrisma(orgId);
  if (kind === "youtube") {
    await db.youtubeVideo.delete({ where: { id } });
  } else {
    await db.tiktokClip.delete({ where: { id } });
  }
  revalidatePath("/trash");
}
