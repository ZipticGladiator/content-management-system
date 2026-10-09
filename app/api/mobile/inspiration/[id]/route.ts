import { NextResponse, type NextRequest } from "next/server";
import { deleteInspiration, updateInspiration } from "@/app/inspiration/actions";
import { handle, parseInspirationInput, readJson, requireScoped } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/inspiration/[id]">;

export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  const { session } = await requireScoped(req);
  const { id } = await ctx.params;
  await updateInspiration(session.orgId, id, parseInspirationInput(await readJson(req)));
  return NextResponse.json({ ok: true });
});

export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  const { session } = await requireScoped(req);
  const { id } = await ctx.params;
  await deleteInspiration(session.orgId, id);
  return NextResponse.json({ ok: true });
});
