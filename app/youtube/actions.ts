"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Category, YoutubeStatus } from "@/app/generated/prisma/client";
import { YOUTUBE_STAGES, YOUTUBE_STEPS, stageLabel } from "@/lib/pipeline";
import { addSystemComment } from "@/app/comments/actions";
import type { PipelineItemInput } from "@/lib/types";

function toData(data: PipelineItemInput) {
  const steps: Record<string, boolean> = {};
  for (const [key] of YOUTUBE_STEPS) {
    steps[key] = data.steps?.[key] ?? false;
  }
  return {
    title: data.title,
    pitch: data.pitch,
    category: data.category as Category,
    status: data.status as YoutubeStatus,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    cost: data.cost,
    paid: data.paid,
    editor: data.editor,
    url: data.url,
    topPick: data.topPick,
    notes: data.notes,
    ...steps,
  };
}

async function logStatusChange(id: string, from: string, to: string) {
  if (from === to) return;
  await addSystemComment(
    "youtube",
    id,
    `Status changed: ${stageLabel(YOUTUBE_STAGES, from)} → ${stageLabel(YOUTUBE_STAGES, to)}`
  );
}

export async function createYoutubeVideo(data: PipelineItemInput) {
  await prisma.youtubeVideo.create({ data: toData(data) });
  revalidatePath("/youtube");
}

export async function updateYoutubeVideo(id: string, data: PipelineItemInput) {
  const existing = await prisma.youtubeVideo.findUnique({ where: { id }, select: { status: true } });
  const payload = toData(data);
  const doneSteps: Record<string, boolean> = {};
  if (payload.status === YoutubeStatus.PUBLISHED) {
    for (const [key] of YOUTUBE_STEPS) doneSteps[key] = true;
  }
  await prisma.youtubeVideo.update({ where: { id }, data: { ...payload, ...doneSteps } });
  if (existing) await logStatusChange(id, existing.status, payload.status);
  revalidatePath("/youtube");
}

export async function deleteYoutubeVideo(id: string) {
  await prisma.youtubeVideo.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/youtube");
  revalidatePath("/trash");
}

export async function duplicateYoutubeVideo(id: string) {
  const v = await prisma.youtubeVideo.findUnique({ where: { id } });
  if (!v) return;
  await prisma.youtubeVideo.create({
    data: {
      title: `${v.title} (copy)`,
      pitch: v.pitch,
      category: v.category,
      status: YoutubeStatus.IDEA,
      cost: v.cost,
      editor: v.editor,
      notes: v.notes,
    },
  });
  revalidatePath("/youtube");
}

/**
 * Narrow, category-only update for the board's bulk-recategorize action.
 * Deliberately doesn't go through updateYoutubeVideo, which rebuilds the
 * whole record from a client-side snapshot — if that snapshot is stale
 * (e.g. a status change made moments earlier hasn't round-tripped yet),
 * a bulk category update would silently revert it.
 */
export async function updateYoutubeCategory(id: string, category: string) {
  await prisma.youtubeVideo.update({ where: { id }, data: { category: category as Category } });
  revalidatePath("/youtube");
}

export async function updateYoutubeStatus(id: string, status: string) {
  const existing = await prisma.youtubeVideo.findUnique({ where: { id }, select: { status: true } });
  const data: Record<string, unknown> = { status: status as YoutubeStatus };
  if (status === YoutubeStatus.PUBLISHED) {
    for (const [key] of YOUTUBE_STEPS) data[key] = true;
  }
  await prisma.youtubeVideo.update({ where: { id }, data });
  if (existing) await logStatusChange(id, existing.status, status);
  revalidatePath("/youtube");
}
