import { NextResponse, type NextRequest } from "next/server";
import { deleteAsset, updateAsset } from "@/app/assets/actions";
import { handle, parseAssetInput, readJson, requireUser } from "@/lib/mobile-api";

type Ctx = RouteContext<"/api/mobile/assets/[id]">;

export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { id } = await ctx.params;
  await updateAsset(id, parseAssetInput(await readJson(req)));
  return NextResponse.json({ ok: true });
});

/** Removes the CMS entry only; the file on Google Drive is untouched. */
export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireUser(req);
  const { id } = await ctx.params;
  await deleteAsset(id);
  return NextResponse.json({ ok: true });
});
