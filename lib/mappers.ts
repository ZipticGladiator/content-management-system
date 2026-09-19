import type { YoutubeVideo, TiktokClip } from "@/app/generated/prisma/client";
import { YOUTUBE_STEPS } from "@/lib/pipeline";
import type { PipelineItem } from "@/lib/types";

type WithExtras = {
  script?: { id: string } | null;
  _count?: { comments: number; attachments: number };
};

export function mapYoutubeVideo(v: YoutubeVideo & WithExtras): PipelineItem {
  const steps: Record<string, boolean> = {};
  for (const [key] of YOUTUBE_STEPS) {
    steps[key] = (v as unknown as Record<string, boolean>)[key];
  }
  return {
    id: v.id,
    title: v.title,
    pitch: v.pitch,
    category: v.category,
    status: v.status,
    dueDate: v.dueDate ? v.dueDate.toISOString().slice(0, 10) : null,
    cost: v.cost,
    paid: v.paid,
    editor: v.editor,
    url: v.url,
    topPick: v.topPick,
    notes: v.notes,
    steps,
    scriptId: v.script?.id ?? null,
    commentCount: v._count?.comments ?? 0,
    attachmentCount: v._count?.attachments ?? 0,
  };
}

export function mapTiktokClip(c: TiktokClip & WithExtras): PipelineItem {
  return {
    id: c.id,
    title: c.title,
    pitch: c.pitch,
    category: c.category,
    status: c.status,
    dueDate: c.dueDate ? c.dueDate.toISOString().slice(0, 10) : null,
    cost: c.cost,
    paid: c.paid,
    editor: c.editor,
    url: c.url,
    topPick: false,
    notes: c.notes,
    scriptId: c.script?.id ?? null,
    commentCount: c._count?.comments ?? 0,
    attachmentCount: c._count?.attachments ?? 0,
  };
}
