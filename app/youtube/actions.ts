"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Category, YoutubeStatus } from "@/app/generated/prisma/client";
import { YOUTUBE_STEPS } from "@/lib/pipeline";
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

export async function createYoutubeVideo(data: PipelineItemInput) {
  await prisma.youtubeVideo.create({ data: toData(data) });
  revalidatePath("/youtube");
}

export async function updateYoutubeVideo(id: string, data: PipelineItemInput) {
  const payload = toData(data);
  const doneSteps: Record<string, boolean> = {};
  if (payload.status === YoutubeStatus.PUBLISHED) {
    for (const [key] of YOUTUBE_STEPS) doneSteps[key] = true;
  }
  await prisma.youtubeVideo.update({ where: { id }, data: { ...payload, ...doneSteps } });
  revalidatePath("/youtube");
}

export async function deleteYoutubeVideo(id: string) {
  await prisma.youtubeVideo.delete({ where: { id } });
  revalidatePath("/youtube");
}

export async function updateYoutubeStatus(id: string, status: string) {
  const data: Record<string, unknown> = { status: status as YoutubeStatus };
  if (status === YoutubeStatus.PUBLISHED) {
    for (const [key] of YOUTUBE_STEPS) data[key] = true;
  }
  await prisma.youtubeVideo.update({ where: { id }, data });
  revalidatePath("/youtube");
}
