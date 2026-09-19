"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Category, TiktokStatus } from "@/app/generated/prisma/client";
import { TIKTOK_STAGES, stageLabel } from "@/lib/pipeline";
import { addSystemComment } from "@/app/comments/actions";
import type { PipelineItemInput } from "@/lib/types";

function toData(data: PipelineItemInput) {
  return {
    title: data.title,
    pitch: data.pitch,
    category: data.category as Category,
    status: data.status as TiktokStatus,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    cost: data.cost,
    paid: data.paid,
    editor: data.editor,
    url: data.url,
    notes: data.notes,
  };
}

async function logStatusChange(id: string, from: string, to: string) {
  if (from === to) return;
  await addSystemComment(
    "tiktok",
    id,
    `Status changed: ${stageLabel(TIKTOK_STAGES, from)} → ${stageLabel(TIKTOK_STAGES, to)}`
  );
}

export async function createTiktokClip(data: PipelineItemInput) {
  await prisma.tiktokClip.create({ data: toData(data) });
  revalidatePath("/tiktok");
}

export async function updateTiktokClip(id: string, data: PipelineItemInput) {
  const existing = await prisma.tiktokClip.findUnique({ where: { id }, select: { status: true } });
  const payload = toData(data);
  await prisma.tiktokClip.update({ where: { id }, data: payload });
  if (existing) await logStatusChange(id, existing.status, payload.status);
  revalidatePath("/tiktok");
}

export async function deleteTiktokClip(id: string) {
  await prisma.tiktokClip.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/tiktok");
  revalidatePath("/trash");
}

export async function duplicateTiktokClip(id: string) {
  const c = await prisma.tiktokClip.findUnique({ where: { id } });
  if (!c) return;
  await prisma.tiktokClip.create({
    data: {
      title: `${c.title} (copy)`,
      pitch: c.pitch,
      category: c.category,
      status: TiktokStatus.IDEA,
      cost: c.cost,
      editor: c.editor,
      notes: c.notes,
    },
  });
  revalidatePath("/tiktok");
}

export async function updateTiktokStatus(id: string, status: string) {
  const existing = await prisma.tiktokClip.findUnique({ where: { id }, select: { status: true } });
  await prisma.tiktokClip.update({ where: { id }, data: { status: status as TiktokStatus } });
  if (existing) await logStatusChange(id, existing.status, status);
  revalidatePath("/tiktok");
}
