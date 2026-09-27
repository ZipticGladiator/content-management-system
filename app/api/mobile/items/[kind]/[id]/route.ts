import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapTiktokClip, mapYoutubeVideo } from "@/lib/mappers";
import type { ItemKind } from "@/lib/types";
import {
  ApiError,
  ITEM_ACTIONS,
  assertCategory,
  assertStatus,
  handle,
  parseItemInput,
  parseKind,
  readJson,
  requireUser,
} from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/items/[kind]/[id]">;

const include = {
  script: { select: { id: true } },
  _count: { select: { comments: true, attachments: true } },
} as const;

async function loadItem(kind: ItemKind, id: string) {
  const item =
    kind === "youtube"
      ? await prisma.youtubeVideo.findFirst({ where: { id, deletedAt: null }, include }).then((v) => v && mapYoutubeVideo(v))
      : await prisma.tiktokClip.findFirst({ where: { id, deletedAt: null }, include }).then((c) => c && mapTiktokClip(c));
  if (!item) throw new ApiError(404, "Item not found");
  return item;
}

async function params(ctx: Ctx) {
  const { kind, id } = await ctx.params;
  return { kind: parseKind(kind), id };
}

export const GET = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await params(ctx);
  return NextResponse.json({ item: await loadItem(kind, id) });
});

/** Full update, mirroring the web edit dialog. */
export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await params(ctx);
  await loadItem(kind, id);
  await ITEM_ACTIONS[kind].update(id, parseItemInput(kind, await readJson(req)));
  return NextResponse.json({ item: await loadItem(kind, id) });
});

/**
 * Narrow status/category update — uses the same targeted actions as the web
 * board so a quick status change can't revert other fields from a stale snapshot.
 */
export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await params(ctx);
  await loadItem(kind, id);
  const body = await readJson(req);
  if (body.status !== undefined) await ITEM_ACTIONS[kind].setStatus(id, assertStatus(kind, body.status));
  if (body.category !== undefined) await ITEM_ACTIONS[kind].setCategory(id, assertCategory(body.category));
  return NextResponse.json({ item: await loadItem(kind, id) });
});

/** Moves the item to Trash (soft delete), same as the web app. */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await params(ctx);
  await loadItem(kind, id);
  await ITEM_ACTIONS[kind].remove(id);
  return NextResponse.json({ ok: true });
});
