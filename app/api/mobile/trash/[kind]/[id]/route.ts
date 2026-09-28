import { NextResponse, type NextRequest } from "next/server";
import { purgeItem, restoreItem } from "@/app/trash/actions";
import { handle, parseKind, requireUser } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/trash/[kind]/[id]">;

/** Restore from Trash. */
export const POST = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await ctx.params;
  await restoreItem(parseKind(kind), id);
  return NextResponse.json({ ok: true });
});

/** Permanently delete. */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { kind, id } = await ctx.params;
  await purgeItem(parseKind(kind), id);
  return NextResponse.json({ ok: true });
});
