import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInspiration } from "@/app/inspiration/actions";
import { handle, parseInspirationInput, readJson, requireUser } from "@/lib/mobile-api";

export const GET = handle(async (req: NextRequest) => {
  await requireUser(req);
  const rows = await prisma.inspiration.findMany({ orderBy: { followers: "desc" } });
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
  await requireUser(req);
  await createInspiration(parseInspirationInput(await readJson(req)));
  return NextResponse.json({ ok: true }, { status: 201 });
});
