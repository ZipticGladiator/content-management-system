"use server";

import { revalidatePath } from "next/cache";
import { YoutubeStatus } from "@/app/generated/prisma/client";
import { scopedPrisma } from "@/lib/org";
import { YOUTUBE_STAGES, YOUTUBE_STEPS, stageLabel } from "@/lib/pipeline";
import { addSystemComment } from "@/app/comments/actions";
import type { PipelineItemInput } from "@/lib/types";

// Every export here takes `orgId` first. A page (server component) binds it
// from the signed-in user's session before handing the action to a client
// component (`createYoutubeVideo.bind(null, session.orgId)`); the mobile API
// (no session cookie — lib/mobile-api.ts) passes its own resolved orgId
// directly. Either way, every query below runs through a client scoped to
// that one org (lib/org.ts) — never the raw, unscoped prisma import.

function toData(data: PipelineItemInput) {
  const steps: Record<string, boolean> = {};
  for (const [key] of YOUTUBE_STEPS) {
    steps[key] = data.steps?.[key] ?? false;
  }
  return {
    title: data.title,
    pitch: data.pitch,
    category: data.category,
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

async function logStatusChange(orgId: string, id: string, from: string, to: string) {
  if (from === to) return;
  await addSystemComment(
    orgId,
    "youtube",
    id,
    `Status changed: ${stageLabel(YOUTUBE_STAGES, from)} → ${stageLabel(YOUTUBE_STAGES, to)}`
  );
}

export async function createYoutubeVideo(orgId: string, data: PipelineItemInput) {
  const db = scopedPrisma(orgId);
  await db.youtubeVideo.create({ data: { ...toData(data), orgId } });
  revalidatePath("/youtube");
}

export async function updateYoutubeVideo(orgId: string, id: string, data: PipelineItemInput) {
  const db = scopedPrisma(orgId);
  const existing = await db.youtubeVideo.findUnique({ where: { id }, select: { status: true } });
  const payload = toData(data);
  const doneSteps: Record<string, boolean> = {};
  if (payload.status === YoutubeStatus.PUBLISHED) {
    for (const [key] of YOUTUBE_STEPS) doneSteps[key] = true;
  }
  await db.youtubeVideo.update({ where: { id }, data: { ...payload, ...doneSteps } });
  if (existing) await logStatusChange(orgId, id, existing.status, payload.status);
  revalidatePath("/youtube");
}

export async function deleteYoutubeVideo(orgId: string, id: string) {
  const db = scopedPrisma(orgId);
  await db.youtubeVideo.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/youtube");
  revalidatePath("/trash");
}

export async function duplicateYoutubeVideo(orgId: string, id: string) {
  const db = scopedPrisma(orgId);
  const v = await db.youtubeVideo.findUnique({ where: { id } });
  if (!v) return;
  await db.youtubeVideo.create({
    data: {
      title: `${v.title} (copy)`,
      pitch: v.pitch,
      category: v.category,
      status: YoutubeStatus.IDEA,
      cost: v.cost,
      editor: v.editor,
      notes: v.notes,
      orgId,
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
export async function updateYoutubeCategory(orgId: string, id: string, category: string) {
  const db = scopedPrisma(orgId);
  await db.youtubeVideo.update({ where: { id }, data: { category } });
  revalidatePath("/youtube");
}

export async function updateYoutubeStatus(orgId: string, id: string, status: string) {
  const db = scopedPrisma(orgId);
  const existing = await db.youtubeVideo.findUnique({ where: { id }, select: { status: true } });
  const data: Record<string, unknown> = { status: status as YoutubeStatus };
  if (status === YoutubeStatus.PUBLISHED) {
    for (const [key] of YOUTUBE_STEPS) data[key] = true;
  }
  await db.youtubeVideo.update({ where: { id }, data });
  if (existing) await logStatusChange(orgId, id, existing.status, status);
  revalidatePath("/youtube");
}
