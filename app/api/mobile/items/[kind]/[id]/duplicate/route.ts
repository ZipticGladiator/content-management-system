import { NextResponse, type NextRequest } from "next/server";
import { ITEM_ACTIONS, handle, parseKind, requireUser } from "@/lib/mobile-api";

export const POST = handle(async (req: NextRequest, ctx: RouteContext<"/api/mobile/items/[kind]/[id]/duplicate">) => {
  await requireUser(req);
  const { kind, id } = await ctx.params;
  await ITEM_ACTIONS[parseKind(kind)].duplicate(id);
  return NextResponse.json({ ok: true }, { status: 201 });
});
