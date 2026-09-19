"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { InspirationPlatform, InspirationType } from "@/app/generated/prisma/client";

export type InspirationInput = {
  name: string;
  platform: InspirationPlatform;
  type: InspirationType;
  url: string;
  followers: number;
  description: string;
};

export async function createInspiration(data: InspirationInput) {
  await prisma.inspiration.create({ data });
  revalidatePath("/inspiration");
}

export async function updateInspiration(id: string, data: InspirationInput) {
  await prisma.inspiration.update({ where: { id }, data });
  revalidatePath("/inspiration");
}

export async function deleteInspiration(id: string) {
  await prisma.inspiration.delete({ where: { id } });
  revalidatePath("/inspiration");
}
