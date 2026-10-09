import { NextResponse, type NextRequest } from "next/server";
import { ITEM_ACTIONS, assertItem, handle, parseKind, requireScoped } from "@/lib/mobile-api";

export const POST = handle(async (req: NextRequest, ctx: RouteContext<"/api/mobile/items/[kind]/[id]/duplicate">) => {
  const { session, db } = await requireScoped(req);
  const { kind: rawKind, id } = await ctx.params;
  const kind = parseKind(rawKind);
  await assertItem(db, kind, id);
  await ITEM_ACTIONS[kind].duplicate(session.orgId, id);
  return NextResponse.json({ ok: true }, { status: 201 });
});
