import { NextResponse, type NextRequest } from "next/server";
import { mapTiktokClip, mapYoutubeVideo } from "@/lib/mappers";
import type { ItemKind } from "@/lib/types";
import type { ScopedDb } from "@/lib/org";
import {
  ApiError,
  ITEM_ACTIONS,
  assertCategory,
  assertStatus,
  handle,
  orgCategoryKeys,
  parseItemInput,
  parseKind,
  readJson,
  requireScoped,
} from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/items/[kind]/[id]">;

const include = {
  script: { select: { id: true } },
  _count: { select: { comments: true, attachments: true } },
} as const;

async function loadItem(db: ScopedDb, kind: ItemKind, id: string) {
  const item =
    kind === "youtube"
      ? await db.youtubeVideo.findFirst({ where: { id, deletedAt: null }, include }).then((v) => v && mapYoutubeVideo(v))
      : await db.tiktokClip.findFirst({ where: { id, deletedAt: null }, include }).then((c) => c && mapTiktokClip(c));
  if (!item) throw new ApiError(404, "Item not found");
  return item;
}

async function params(ctx: Ctx) {
  const { kind, id } = await ctx.params;
  return { kind: parseKind(kind), id };
}

export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  const { db } = await requireScoped(req);
  const { kind, id } = await params(ctx);
  return NextResponse.json({ item: await loadItem(db, kind, id) });
});

/** Full update, mirroring the web edit dialog. */
export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  const { session, db } = await requireScoped(req);
  const { kind, id } = await params(ctx);
  await loadItem(db, kind, id);
  const input = parseItemInput(kind, await readJson(req), await orgCategoryKeys(db));
  await ITEM_ACTIONS[kind].update(session.orgId, id, input);
  return NextResponse.json({ item: await loadItem(db, kind, id) });
});

/**
 * Narrow status/category update — uses the same targeted actions as the web
 * board so a quick status change can't revert other fields from a stale snapshot.
 */
export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  const { session, db } = await requireScoped(req);
  const { kind, id } = await params(ctx);
  await loadItem(db, kind, id);
  const body = await readJson(req);
  if (body.status !== undefined) await ITEM_ACTIONS[kind].setStatus(session.orgId, id, assertStatus(kind, body.status));
  if (body.category !== undefined) await ITEM_ACTIONS[kind].setCategory(session.orgId, id, assertCategory(body.category, await orgCategoryKeys(db)));
  return NextResponse.json({ item: await loadItem(db, kind, id) });
});

/** Moves the item to Trash (soft delete), same as the web app. */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  const { session, db } = await requireScoped(req);
  const { kind, id } = await params(ctx);
  await loadItem(db, kind, id);
  await ITEM_ACTIONS[kind].remove(session.orgId, id);
  return NextResponse.json({ ok: true });
});
