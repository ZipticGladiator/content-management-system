import { NextResponse, type NextRequest } from "next/server";
import { getNotifications } from "@/lib/notifications";
import { handle, requireUser } from "@/lib/mobile-api";

export const GET = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  return NextResponse.json({ notifications: await getNotifications(user.orgId) });
});
