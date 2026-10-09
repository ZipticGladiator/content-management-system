"use server";

import { revalidatePath } from "next/cache";
import { TiktokStatus } from "@/app/generated/prisma/client";
import { scopedPrisma } from "@/lib/org";
import { TIKTOK_STAGES, stageLabel } from "@/lib/pipeline";
import { addSystemComment } from "@/app/comments/actions";
import type { PipelineItemInput } from "@/lib/types";

// See app/youtube/actions.ts for why every export here takes `orgId` first.

function toData(data: PipelineItemInput) {
  return {
    title: data.title,
    pitch: data.pitch,
    category: data.category,
    status: data.status as TiktokStatus,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    cost: data.cost,
    paid: data.paid,
    editor: data.editor,
    url: data.url,
    notes: data.notes,
  };
}

async function logStatusChange(orgId: string, id: string, from: string, to: string) {
  if (from === to) return;
  await addSystemComment(
    orgId,
    "tiktok",
    id,
    `Status changed: ${stageLabel(TIKTOK_STAGES, from)} → ${stageLabel(TIKTOK_STAGES, to)}`
  );
}

export async function createTiktokClip(orgId: string, data: PipelineItemInput) {
  const db = scopedPrisma(orgId);
  await db.tiktokClip.create({ data: { ...toData(data), orgId } });
  revalidatePath("/tiktok");
}

export async function updateTiktokClip(orgId: string, id: string, data: PipelineItemInput) {
  const db = scopedPrisma(orgId);
  const existing = await db.tiktokClip.findUnique({ where: { id }, select: { status: true } });
  const payload = toData(data);
  await db.tiktokClip.update({ where: { id }, data: payload });
  if (existing) await logStatusChange(orgId, id, existing.status, payload.status);
  revalidatePath("/tiktok");
}

export async function deleteTiktokClip(orgId: string, id: string) {
  const db = scopedPrisma(orgId);
  await db.tiktokClip.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/tiktok");
  revalidatePath("/trash");
}

export async function duplicateTiktokClip(orgId: string, id: string) {
  const db = scopedPrisma(orgId);
  const c = await db.tiktokClip.findUnique({ where: { id } });
  if (!c) return;
  await db.tiktokClip.create({
    data: {
      title: `${c.title} (copy)`,
      pitch: c.pitch,
      category: c.category,
      status: TiktokStatus.IDEA,
      cost: c.cost,
      editor: c.editor,
      notes: c.notes,
      orgId,
    },
  });
  revalidatePath("/tiktok");
}

/**
 * Narrow, category-only update for the board's bulk-recategorize action.
 * Deliberately doesn't go through updateTiktokClip, which rebuilds the
 * whole record from a client-side snapshot — if that snapshot is stale
 * (e.g. a status change made moments earlier hasn't round-tripped yet),
 * a bulk category update would silently revert it.
 */
export async function updateTiktokCategory(orgId: string, id: string, category: string) {
  const db = scopedPrisma(orgId);
  await db.tiktokClip.update({ where: { id }, data: { category } });
  revalidatePath("/tiktok");
}

export async function updateTiktokStatus(orgId: string, id: string, status: string) {
  const db = scopedPrisma(orgId);
  const existing = await db.tiktokClip.findUnique({ where: { id }, select: { status: true } });
  await db.tiktokClip.update({ where: { id }, data: { status: status as TiktokStatus } });
  if (existing) await logStatusChange(orgId, id, existing.status, status);
  revalidatePath("/tiktok");
}
