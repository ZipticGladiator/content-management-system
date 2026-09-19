"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type TrashKind = "youtube" | "tiktok";

export async function restoreItem(kind: TrashKind, id: string) {
  if (kind === "youtube") {
    await prisma.youtubeVideo.update({ where: { id }, data: { deletedAt: null } });
  } else {
    await prisma.tiktokClip.update({ where: { id }, data: { deletedAt: null } });
  }
  revalidatePath("/trash");
  revalidatePath(`/${kind}`);
}

export async function purgeItem(kind: TrashKind, id: string) {
  if (kind === "youtube") {
    await prisma.youtubeVideo.delete({ where: { id } });
  } else {
    await prisma.tiktokClip.delete({ where: { id } });
  }
  revalidatePath("/trash");
}
