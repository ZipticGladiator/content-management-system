"use server";

import { revalidatePath } from "next/cache";
import { scopedPrisma } from "@/lib/org";

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

export async function createEditor(orgId: string, data: EditorInput) {
  const db = scopedPrisma(orgId);
  await db.editor.create({ data: { ...data, orgId } });
  revalidatePath("/finance");
}

export async function updateEditor(orgId: string, id: string, data: EditorInput) {
  const db = scopedPrisma(orgId);
  await db.editor.update({ where: { id }, data });
  revalidatePath("/finance");
}

export async function deleteEditor(orgId: string, id: string) {
  const db = scopedPrisma(orgId);
  await db.editor.delete({ where: { id } });
  revalidatePath("/finance");
}

export async function markItemsPaid(orgId: string, items: { id: string; kind: "youtube" | "tiktok" }[]) {
  const db = scopedPrisma(orgId);
  // Sequential on purpose: concurrent calls to the same bound server action
  // reference (via Promise.all) were observed to silently drop all but one.
  for (const item of items) {
    if (item.kind === "youtube") {
      await db.youtubeVideo.update({ where: { id: item.id }, data: { paid: true } });
    } else {
      await db.tiktokClip.update({ where: { id: item.id }, data: { paid: true } });
    }
  }
  revalidatePath("/finance");
  revalidatePath("/youtube");
  revalidatePath("/tiktok");
}
