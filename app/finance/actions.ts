"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type EditorInput = {
  name: string;
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
