import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson } from "@/lib/mobile-api";

export const POST = handle(async (req) => {
  const body = await readJson<{ email?: unknown; password?: unknown }>(req);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) throw new ApiError(401, "Incorrect email or password");

  const token = await createSessionToken({ id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId });
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});
