import { NextResponse, type NextRequest } from "next/server";
import { generateScriptDraftForScript } from "@/app/scripts/actions";
import { handle, requireScoped } from "@/lib/mobile-api";

/**
 * Hook + outline draft from Gemini — the same generator as the web editor's
 * "Generate with AI". Always 200 with { ok, text } or { ok: false, reason };
 * one Gemini attempt per request (see lib/ai.ts), the app retries.
 */
export const POST = handle(async (req: NextRequest, ctx: RouteContext<"/api/mobile/scripts/[id]/ai-draft">) => {
  const { session } = await requireScoped(req);
  const { id } = await ctx.params;
  return NextResponse.json(await generateScriptDraftForScript(session.orgId, id));
});
