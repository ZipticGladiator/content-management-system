import { NextResponse, type NextRequest } from "next/server";
import { createInspiration } from "@/app/inspiration/actions";
import { handle, parseInspirationInput, readJson, requireScoped } from "@/lib/mobile-api";

export const GET = handle(async (req: NextRequest) => {
  const { db } = await requireScoped(req);
  const rows = await db.inspiration.findMany({ orderBy: { followers: "desc" } });
  return NextResponse.json({
    items: rows.map(({ id, name, platform, type, url, followers, description }) => ({
      id,
      name,
      platform,
      type,
      url,
      followers,
      description,
    })),
  });
});

export const POST = handle(async (req: NextRequest) => {
  const { session } = await requireScoped(req);
  await createInspiration(session.orgId, parseInspirationInput(await readJson(req)));
  return NextResponse.json({ ok: true }, { status: 201 });
});
