"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ScriptStatus } from "@/app/generated/prisma/client";
import { generateScriptDraft as callAi, type DraftResult, type TopPerformer } from "@/lib/ai";
import { extractYoutubeVideoId, fetchTopVideosByViews } from "@/lib/youtube-analytics";
import { extractTiktokVideoId, fetchClipsViews } from "@/lib/tiktok-analytics";

export async function createScriptForVideo(formData: FormData) {
  const youtubeVideoId = String(formData.get("youtubeVideoId") || "");
  if (!youtubeVideoId) return;
  const script = await prisma.script.create({ data: { youtubeVideoId } });
  redirect(`/scripts/${script.id}`);
}

export async function createScriptForClip(formData: FormData) {
  const tiktokClipId = String(formData.get("tiktokClipId") || "");
  if (!tiktokClipId) return;
  const script = await prisma.script.create({ data: { tiktokClipId } });
  redirect(`/scripts/${script.id}`);
}

export async function updateScript(id: string, body: string, status: ScriptStatus) {
  await prisma.script.update({ where: { id }, data: { body, status } });
  revalidatePath("/scripts");
  revalidatePath(`/scripts/${id}`);
}

export async function deleteScript(id: string) {
  await prisma.script.delete({ where: { id } });
  revalidatePath("/scripts");
  redirect("/scripts");
}

async function topYoutubePerformers(limit: number): Promise<TopPerformer[]> {
  const [videos, ranked] = await Promise.all([
    prisma.youtubeVideo.findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: { title: true, url: true },
    }),
    fetchTopVideosByViews(25),
  ]);
  if (!ranked) return [];

  const byId = new Map(videos.map((v) => [extractYoutubeVideoId(v.url), v.title]));
  const performers: TopPerformer[] = [];
  for (const r of ranked) {
    const title = byId.get(r.videoId);
    if (title) performers.push({ title, views: r.views });
    if (performers.length >= limit) break;
  }
  return performers;
}

async function topTiktokPerformers(limit: number): Promise<TopPerformer[]> {
  const clips = await prisma.tiktokClip.findMany({
    where: { deletedAt: null, status: "POSTED" },
    select: { title: true, url: true },
  });
  const idToTitle = new Map<string, string>();
  for (const c of clips) {
    const id = extractTiktokVideoId(c.url);
    if (id) idToTitle.set(id, c.title);
  }
  if (!idToTitle.size) return [];

  const ranked = await fetchClipsViews([...idToTitle.keys()]);
  if (!ranked) return [];

  return ranked
    .map((r) => ({ title: idToTitle.get(r.videoId) ?? "", views: r.views }))
    .filter((p) => p.title)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/**
 * Generates a hook + outline draft for a script from its parent video/clip's
 * pitch, plus this channel's best-performing past videos where analytics are
 * connected. Returns a structured ok/reason result (rather than throwing or
 * returning a bare null) so the UI can show the real cause of a failure —
 * a missing GEMINI_API_KEY, a Gemini-side error, or a timeout — instead of
 * always guessing it was the API key.
 */
export async function generateScriptDraftForScript(scriptId: string): Promise<DraftResult> {
  const script = await prisma.script.findUnique({
    where: { id: scriptId },
    include: {
      youtubeVideo: { select: { title: true, pitch: true, category: true } },
      tiktokClip: { select: { title: true, pitch: true, category: true } },
    },
  });
  if (!script) return { ok: false, reason: "Script not found" };

  const parent = script.youtubeVideo ?? script.tiktokClip;
  if (!parent) return { ok: false, reason: "Script has no parent video or clip" };

  const platform: "YouTube" | "TikTok" = script.youtubeVideo ? "YouTube" : "TikTok";
  const topPerformers = await (platform === "YouTube" ? topYoutubePerformers(3) : topTiktokPerformers(3));

  return callAi({
    platform,
    title: parent.title,
    pitch: parent.pitch,
    category: parent.category,
    topPerformers,
  });
}
