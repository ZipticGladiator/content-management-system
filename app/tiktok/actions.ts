"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Category, TiktokStatus } from "@/app/generated/prisma/client";
import type { PipelineItemInput } from "@/lib/types";

function toData(data: PipelineItemInput) {
  return {
    title: data.title,
    pitch: data.pitch,
    category: data.category as Category,
    status: data.status as TiktokStatus,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    url: data.url,
    notes: data.notes,
  };
}

export async function createTiktokClip(data: PipelineItemInput) {
  await prisma.tiktokClip.create({ data: toData(data) });
  revalidatePath("/tiktok");
}

export async function updateTiktokClip(id: string, data: PipelineItemInput) {
  await prisma.tiktokClip.update({ where: { id }, data: toData(data) });
  revalidatePath("/tiktok");
}

export async function deleteTiktokClip(id: string) {
  await prisma.tiktokClip.delete({ where: { id } });
  revalidatePath("/tiktok");
}

export async function updateTiktokStatus(id: string, status: string) {
  await prisma.tiktokClip.update({ where: { id }, data: { status: status as TiktokStatus } });
  revalidatePath("/tiktok");
}
