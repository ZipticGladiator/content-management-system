import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isExpoPushToken } from "@/lib/push";
import { ApiError, handle, readJson, requireUser } from "@/lib/mobile-api";

/** Body: { token, platform } — registers this phone for push notifications (idempotent). */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  const body = await readJson<{ token?: unknown; platform?: unknown }>(req);
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!isExpoPushToken(token)) throw new ApiError(400, "Invalid push token");
  const platform = body.platform === "ios" || body.platform === "android" ? body.platform : "";

  // A phone that signs in as someone else moves to that account.
  await prisma.pushDevice.upsert({
    where: { token },
    create: { token, userId: user.uid, platform },
    update: { userId: user.uid, platform },
  });
  return NextResponse.json({ ok: true });
});

/** DELETE ?token=… — stop pushes to this phone (called on sign-out). */
export const DELETE = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  const token = req.nextUrl.searchParams.get("token") ?? "";
  await prisma.pushDevice.deleteMany({ where: { token, userId: user.uid } });
  return NextResponse.json({ ok: true });
});
