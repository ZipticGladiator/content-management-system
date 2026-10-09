"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsage, requireOwnerSession } from "@/lib/org";
import { generateInviteToken, inviteExpiry } from "@/lib/invites";
import type { UserRole } from "@/app/generated/prisma/client";

/** Creates a pending invite and redirects back with its link ready to copy — no email service is wired up yet. */
export async function createInvite(formData: FormData) {
  const { session, db } = await requireOwnerSession();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = formData.get("role") === "OWNER" ? "OWNER" : "EDITOR";
  if (!email) redirect("/team?error=Enter+an+email+address");

  const org = await prisma.organization.findUnique({ where: { id: session.orgId }, select: { seatLimit: true } });
  const usage = await getUsage(db);
  const pendingInvites = await db.invite.count({ where: { acceptedAt: null, expiresAt: { gt: new Date() } } });
  if (org && usage.seatsUsed + pendingInvites >= org.seatLimit) {
    redirect("/team?error=This+plan%27s+seat+limit+is+reached+%E2%80%94+see+Billing+to+upgrade");
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) redirect("/team?error=That+email+already+has+an+account");

  const token = generateInviteToken();
  await db.invite.create({
    data: { email, role: role as UserRole, token, invitedByName: session.name, expiresAt: inviteExpiry(), orgId: session.orgId },
  });
  revalidatePath("/team");
  redirect(`/team?invited=${token}`);
}

// These three are only ever called directly from the Team page (never reused by
// the mobile API), so unlike the rest of the app's actions they don't take an
// explicit orgId — requireOwnerSession() re-derives it from the session cookie
// itself, which is actually the safer choice here: there's no bound-argument
// orgId that could drift from who is actually signed in.

export async function revokeInvite(id: string) {
  const { db } = await requireOwnerSession();
  await db.invite.delete({ where: { id } });
  revalidatePath("/team");
}

/** Can't remove the last owner — someone has to be able to manage the workspace. */
export async function removeMember(userId: string) {
  const { db } = await requireOwnerSession();
  const [target, ownerCount] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
    db.user.count({ where: { role: "OWNER" } }),
  ]);
  if (target?.role === "OWNER" && ownerCount <= 1) {
    throw new Error("Can't remove the only owner — promote someone else first.");
  }
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/team");
}

export async function changeMemberRole(userId: string, role: "OWNER" | "EDITOR") {
  const { db } = await requireOwnerSession();
  if (role === "EDITOR") {
    const ownerCount = await db.user.count({ where: { role: "OWNER" } });
    const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role === "OWNER" && ownerCount <= 1) {
      throw new Error("Can't demote the only owner — promote someone else first.");
    }
  }
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/team");
}
