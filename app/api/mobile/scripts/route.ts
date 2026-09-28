import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, parseKind, readJson, requireUser } from "@/lib/mobile-api";

export const GET = handle(async (req: NextRequest) => {
  await requireUser(req);
  const [scripts, videosWithoutScript, clipsWithoutScript] = await Promise.all([
    prisma.script.findMany({
      where: { OR: [{ youtubeVideo: { deletedAt: null } }, { tiktokClip: { deletedAt: null } }] },
      select: {
        id: true,
        body: true,
        status: true,
        updatedAt: true,
        youtubeVideo: { select: { id: true, title: true } },
        tiktokClip: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.youtubeVideo.findMany({
      where: { script: null, deletedAt: null },
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tiktokClip.findMany({
      where: { script: null, deletedAt: null },
      select: { id: true, title: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    scripts: scripts.map((s) => ({
      id: s.id,
      title: s.youtubeVideo?.title ?? s.tiktokClip?.title ?? "Untitled",
      platform: s.youtubeVideo ? "YouTube" : "TikTok",
      status: s.status,
      updatedAt: s.updatedAt.toISOString(),
      preview: s.body.slice(0, 160),
      wordCount: s.body.trim() ? s.body.trim().split(/\s+/).length : 0,
    })),
    videosWithoutScript,
    clipsWithoutScript,
  });
});

/** Body: { kind: "youtube" | "tiktok", itemId } — starts an empty draft for that video/clip. */
export const POST = handle(async (req: NextRequest) => {
  await requireUser(req);
  const body = await readJson<{ kind?: unknown; itemId?: unknown }>(req);
  const kind = parseKind(String(body.kind ?? ""));
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  if (!itemId) throw new ApiError(400, "itemId is required");

  const existing = await prisma.script.findFirst({
    where: kind === "youtube" ? { youtubeVideoId: itemId } : { tiktokClipId: itemId },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ id: existing.id });

  const script = await prisma.script.create({
    data: kind === "youtube" ? { youtubeVideoId: itemId } : { tiktokClipId: itemId },
  });
  revalidatePath("/scripts");
  return NextResponse.json({ id: script.id }, { status: 201 });
});
