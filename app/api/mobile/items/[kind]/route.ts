import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapTiktokClip, mapYoutubeVideo } from "@/lib/mappers";
import { ITEM_ACTIONS, handle, parseItemInput, parseKind, readJson, requireUser } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/items/[kind]">;

const include = {
  script: { select: { id: true } },
  _count: { select: { comments: true, attachments: true } },
} as const;

export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const kind = parseKind((await ctx.params).kind);
  const [items, editors] = await Promise.all([
    kind === "youtube"
      ? prisma.youtubeVideo
          .findMany({ where: { deletedAt: null }, include, orderBy: { createdAt: "asc" } })
          .then((rows) => rows.map(mapYoutubeVideo))
      : prisma.tiktokClip
          .findMany({ where: { deletedAt: null }, include, orderBy: { createdAt: "asc" } })
          .then((rows) => rows.map(mapTiktokClip)),
    prisma.editor.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ items, editors: editors.map((e) => e.name) });
});

export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const kind = parseKind((await ctx.params).kind);
  const input = parseItemInput(kind, await readJson(req));
  await ITEM_ACTIONS[kind].create(input);
  return NextResponse.json({ ok: true }, { status: 201 });
});
