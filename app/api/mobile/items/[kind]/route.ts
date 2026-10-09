import { NextResponse, type NextRequest } from "next/server";
import { mapTiktokClip, mapYoutubeVideo } from "@/lib/mappers";
import { ITEM_ACTIONS, handle, orgCategoryKeys, parseItemInput, parseKind, readJson, requireScoped } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/items/[kind]">;

const include = {
  script: { select: { id: true } },
  _count: { select: { comments: true, attachments: true } },
} as const;

export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  const { db } = await requireScoped(req);
  const kind = parseKind((await ctx.params).kind);
  const [items, editors] = await Promise.all([
    kind === "youtube"
      ? db.youtubeVideo
          .findMany({ where: { deletedAt: null }, include, orderBy: { createdAt: "asc" } })
          .then((rows) => rows.map(mapYoutubeVideo))
      : db.tiktokClip
          .findMany({ where: { deletedAt: null }, include, orderBy: { createdAt: "asc" } })
          .then((rows) => rows.map(mapTiktokClip)),
    db.editor.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ items, editors: editors.map((e) => e.name) });
});

export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  const { session, db } = await requireScoped(req);
  const kind = parseKind((await ctx.params).kind);
  const input = parseItemInput(kind, await readJson(req), await orgCategoryKeys(db));
  await ITEM_ACTIONS[kind].create(session.orgId, input);
  return NextResponse.json({ ok: true }, { status: 201 });
});
