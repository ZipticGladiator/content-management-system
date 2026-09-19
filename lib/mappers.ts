import type { YoutubeVideo, TiktokClip } from "@/app/generated/prisma/client";
import { YOUTUBE_STEPS } from "@/lib/pipeline";
import type { PipelineItem } from "@/lib/types";

export function mapYoutubeVideo(v: YoutubeVideo & { script?: { id: string } | null }): PipelineItem {
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
    editor: v.editor,
    url: v.url,
    topPick: v.topPick,
    notes: v.notes,
    steps,
    scriptId: v.script?.id ?? null,
  };
}

export function mapTiktokClip(c: TiktokClip & { script?: { id: string } | null }): PipelineItem {
  return {
    id: c.id,
    title: c.title,
    pitch: c.pitch,
    category: c.category,
    status: c.status,
    dueDate: c.dueDate ? c.dueDate.toISOString().slice(0, 10) : null,
    cost: 0,
    editor: "",
    url: c.url,
    topPick: false,
    notes: c.notes,
    scriptId: c.script?.id ?? null,
  };
}
