"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg, getUsage, scopedPrisma } from "@/lib/org";
import { ScriptStatus } from "@/app/generated/prisma/client";
import { generateScriptDraft as callAi, type DraftResult, type TopPerformer } from "@/lib/ai";
import { extractYoutubeVideoId, fetchTopVideosByViews } from "@/lib/youtube-analytics";
import { extractTiktokVideoId, fetchClipsViews } from "@/lib/tiktok-analytics";

export async function createScriptForVideo(orgId: string, formData: FormData) {
  const db = scopedPrisma(orgId);
  const youtubeVideoId = String(formData.get("youtubeVideoId") || "");
  if (!youtubeVideoId) return;
  const script = await db.script.create({ data: { youtubeVideoId, orgId } });
  redirect(`/scripts/${script.id}`);
}

export async function createScriptForClip(orgId: string, formData: FormData) {
  const db = scopedPrisma(orgId);
  const tiktokClipId = String(formData.get("tiktokClipId") || "");
  if (!tiktokClipId) return;
  const script = await db.script.create({ data: { tiktokClipId, orgId } });
  redirect(`/scripts/${script.id}`);
}

export async function updateScript(orgId: string, id: string, body: string, status: ScriptStatus) {
  const db = scopedPrisma(orgId);
  await db.script.update({ where: { id }, data: { body, status } });
  revalidatePath("/scripts");
  revalidatePath(`/scripts/${id}`);
}

export async function deleteScript(orgId: string, id: string) {
  const db = scopedPrisma(orgId);
  await db.script.delete({ where: { id } });
  revalidatePath("/scripts");
  redirect("/scripts");
}

async function topYoutubePerformers(db: ReturnType<typeof scopedPrisma>, orgId: string, limit: number): Promise<TopPerformer[]> {
  const [videos, ranked] = await Promise.all([
    db.youtubeVideo.findMany({
      where: { deletedAt: null, status: "PUBLISHED" },
      select: { title: true, url: true },
    }),
    fetchTopVideosByViews(orgId, 25),
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

async function topTiktokPerformers(db: ReturnType<typeof scopedPrisma>, orgId: string, limit: number): Promise<TopPerformer[]> {
  const clips = await db.tiktokClip.findMany({
    where: { deletedAt: null, status: "POSTED" },
    select: { title: true, url: true },
  });
  const idToTitle = new Map<string, string>();
  for (const c of clips) {
    const id = extractTiktokVideoId(c.url);
    if (id) idToTitle.set(id, c.title);
  }
  if (!idToTitle.size) return [];

  const ranked = await fetchClipsViews(orgId, [...idToTitle.keys()]);
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
 * a missing GEMINI_API_KEY, a Gemini-side error, a timeout, or the plan's
 * monthly draft limit — instead of always guessing it was the API key.
 */
export async function generateScriptDraftForScript(orgId: string, scriptId: string): Promise<DraftResult> {
  const db = scopedPrisma(orgId);

  const [org, usage] = await Promise.all([getCurrentOrg(orgId), getUsage(db)]);
  if (org && usage.aiDraftsUsed >= org.aiDraftLimit) {
    return { ok: false, reason: `This workspace has used its ${org.aiDraftLimit} AI drafts for this month — see Billing to upgrade.` };
  }

  const script = await db.script.findUnique({
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
  const topPerformers = await (platform === "YouTube" ? topYoutubePerformers(db, orgId, 3) : topTiktokPerformers(db, orgId, 3));

  const result = await callAi({
    platform,
    title: parent.title,
    pitch: parent.pitch,
    category: parent.category,
    topPerformers,
  });
  if (result.ok) await db.aiDraftLog.create({ data: { orgId } });
  return result;
}
