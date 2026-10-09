import { NextResponse, type NextRequest } from "next/server";
import { createAsset } from "@/app/assets/actions";
import { handle, parseAssetInput, readJson, requireScoped } from "@/lib/mobile-api";

/** Every asset (newest first) plus the videos/clips an asset can be linked to. */
export const GET = handle(async (req: NextRequest) => {
  const { db } = await requireScoped(req);
  const [rows, videos, clips] = await Promise.all([
    db.asset.findMany({
      include: {
        youtubeVideo: { select: { id: true, title: true } },
        tiktokClip: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.youtubeVideo.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
    db.tiktokClip.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return NextResponse.json({
    assets: rows.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      type: r.type,
      notes: r.notes,
      item: r.youtubeVideo
        ? { kind: "youtube", id: r.youtubeVideo.id, title: r.youtubeVideo.title }
        : r.tiktokClip
          ? { kind: "tiktok", id: r.tiktokClip.id, title: r.tiktokClip.title }
          : null,
      createdAt: r.createdAt.toISOString(),
    })),
    itemOptions: [
      ...videos.map((v) => ({ kind: "youtube", id: v.id, title: v.title })),
      ...clips.map((c) => ({ kind: "tiktok", id: c.id, title: c.title })),
    ],
  });
});

export const POST = handle(async (req: NextRequest) => {
  const { session } = await requireScoped(req);
  await createAsset(session.orgId, parseAssetInput(await readJson(req)));
  return NextResponse.json({ ok: true }, { status: 201 });
});
