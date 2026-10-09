"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function acceptInvite(formData: FormData) {
  const token = String(formData.get("token") || "");
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name || password.length < 8) {
    redirect(`/invite/${token}?error=${encodeURIComponent("Enter your name and a password of at least 8 characters.")}`);
  }

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    redirect(`/invite/${token}?error=${encodeURIComponent("This invite link isn't valid anymore — ask for a new one.")}`);
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email }, select: { id: true } });
  if (existing) {
    redirect(`/invite/${token}?error=${encodeURIComponent("That email already has an account — sign in instead.")}`);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email: invite.email, name, passwordHash, role: invite.role, orgId: invite.orgId },
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return created;
  });

  const tokenValue = await createSessionToken({ id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, tokenValue, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect("/youtube");
}
