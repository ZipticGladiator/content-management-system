import { NextResponse, type NextRequest } from "next/server";
import { ITEM_ACTIONS, assertItem, handle, parseKind, requireUser } from "@/lib/mobile-api";

export const POST = handle(async (req: NextRequest, ctx: RouteContext<"/api/mobile/items/[kind]/[id]/duplicate">) => {
  await requireUser(req);
  const { kind: rawKind, id } = await ctx.params;
  const kind = parseKind(rawKind);
  await assertItem(kind, id);
  await ITEM_ACTIONS[kind].duplicate(id);
  return NextResponse.json({ ok: true }, { status: 201 });
});
