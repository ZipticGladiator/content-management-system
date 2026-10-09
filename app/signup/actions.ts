"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { DEFAULT_CATEGORIES } from "@/lib/invites";

/** Creates a brand-new workspace (Organization) and its first user, who becomes OWNER. */
export async function signup(formData: FormData) {
  const orgName = String(formData.get("orgName") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!orgName || !name || !email || password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Fill in every field — passwords need at least 8 characters.")}`);
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    redirect(`/signup?error=${encodeURIComponent("That email is already in use — sign in instead, or use another address.")}`);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({ data: { name: orgName } });
    await tx.category.createMany({ data: DEFAULT_CATEGORIES.map((c) => ({ ...c, orgId: org.id })) });
    return tx.user.create({ data: { email, name, passwordHash, role: "OWNER", orgId: org.id } });
  });

  const token = await createSessionToken({ id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  redirect("/youtube");
}
