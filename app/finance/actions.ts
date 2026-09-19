"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type EditorInput = {
  name: string;
  email: string;
  rate: number;
  rateUnit: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  notes: string;
};

export async function createEditor(data: EditorInput) {
  await prisma.editor.create({ data });
  revalidatePath("/finance");
}

export async function updateEditor(id: string, data: EditorInput) {
  await prisma.editor.update({ where: { id }, data });
  revalidatePath("/finance");
}

export async function deleteEditor(id: string) {
  await prisma.editor.delete({ where: { id } });
  revalidatePath("/finance");
}

export async function markItemsPaid(items: { id: string; kind: "youtube" | "tiktok" }[]) {
  // Sequential on purpose: concurrent calls to the same bound server action
  // reference (via Promise.all) were observed to silently drop all but one.
  for (const item of items) {
    if (item.kind === "youtube") {
      await prisma.youtubeVideo.update({ where: { id: item.id }, data: { paid: true } });
    } else {
      await prisma.tiktokClip.update({ where: { id: item.id }, data: { paid: true } });
    }
  }
  revalidatePath("/finance");
  revalidatePath("/youtube");
  revalidatePath("/tiktok");
}
