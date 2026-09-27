import { NextResponse } from "next/server";
import { handle, requireUser } from "@/lib/mobile-api";

export const GET = handle(async (req) => {
  const user = await requireUser(req);
  return NextResponse.json({ user: { id: user.uid, email: user.email, name: user.name, role: user.role } });
});
