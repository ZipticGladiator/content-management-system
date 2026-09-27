import { NextResponse, type NextRequest } from "next/server";
import { deleteInspiration, updateInspiration } from "@/app/inspiration/actions";
import { handle, parseInspirationInput, readJson, requireUser } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/inspiration/[id]">;

export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { id } = await ctx.params;
  await updateInspiration(id, parseInspirationInput(await readJson(req)));
  return NextResponse.json({ ok: true });
});

export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { id } = await ctx.params;
  await deleteInspiration(id);
  return NextResponse.json({ ok: true });
});
