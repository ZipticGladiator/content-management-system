"use server";

import { revalidatePath } from "next/cache";
import { scopedPrisma } from "@/lib/org";
import { InspirationPlatform, InspirationType } from "@/app/generated/prisma/client";

export type InspirationInput = {
  name: string;
  platform: InspirationPlatform;
  type: InspirationType;
  url: string;
  followers: number;
  description: string;
};

export async function createInspiration(orgId: string, data: InspirationInput) {
  const db = scopedPrisma(orgId);
  await db.inspiration.create({ data: { ...data, orgId } });
  revalidatePath("/inspiration");
}

export async function updateInspiration(orgId: string, id: string, data: InspirationInput) {
  const db = scopedPrisma(orgId);
  await db.inspiration.update({ where: { id }, data });
  revalidatePath("/inspiration");
}

export async function deleteInspiration(orgId: string, id: string) {
  const db = scopedPrisma(orgId);
  await db.inspiration.delete({ where: { id } });
  revalidatePath("/inspiration");
}
