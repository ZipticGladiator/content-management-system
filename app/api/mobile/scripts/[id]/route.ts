import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ScriptStatus } from "@/app/generated/prisma/client";
import { updateScript } from "@/app/scripts/actions";
import { ApiError, handle, readJson, requireUser } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/scripts/[id]">;

async function loadScript(id: string) {
  const s = await prisma.script.findUnique({
    where: { id },
    include: {
      youtubeVideo: { select: { id: true, title: true, pitch: true } },
      tiktokClip: { select: { id: true, title: true, pitch: true } },
    },
  });
  if (!s) throw new ApiError(404, "Script not found");
  const parent = s.youtubeVideo ?? s.tiktokClip;
  return {
    id: s.id,
    body: s.body,
    status: s.status,
    updatedAt: s.updatedAt.toISOString(),
    platform: s.youtubeVideo ? "YouTube" : "TikTok",
    kind: s.youtubeVideo ? "youtube" : "tiktok",
    itemId: parent?.id ?? null,
    title: parent?.title ?? "Untitled",
    pitch: parent?.pitch ?? "",
  };
}

export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  return NextResponse.json({ script: await loadScript((await ctx.params).id) });
});

/**
 * Body: { body, status, baseUpdatedAt? }. With `baseUpdatedAt` (the version the
 * phone last saw), a script changed elsewhere since then is NOT overwritten:
 * 409 with the current version, so the app can ask which copy to keep. Omit it
 * to overwrite (the "keep mine" choice).
 */
export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { id } = await ctx.params;
  const current = await loadScript(id);
  const body = await readJson<{ body?: unknown; status?: unknown; baseUpdatedAt?: unknown }>(req);
  if (typeof body.baseUpdatedAt === "string") {
    const base = Date.parse(body.baseUpdatedAt);
    if (!Number.isNaN(base) && Date.parse(current.updatedAt) > base) {
      return NextResponse.json({ error: "This script was changed somewhere else", script: current }, { status: 409 });
    }
  }
  const text = typeof body.body === "string" ? body.body : "";
  const status = body.status === ScriptStatus.FINAL ? ScriptStatus.FINAL : ScriptStatus.DRAFT;
  await updateScript(id, text, status);
  return NextResponse.json({ script: await loadScript(id) });
});

// Not reusing deleteScript(): it redirect()s, which only makes sense for the web form.
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { id } = await ctx.params;
  await loadScript(id);
  await prisma.script.delete({ where: { id } });
  revalidatePath("/scripts");
  return NextResponse.json({ ok: true });
});
