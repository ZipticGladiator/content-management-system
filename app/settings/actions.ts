"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOwnerSession } from "@/lib/org";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function updateOrgProfile(formData: FormData) {
  const { session } = await requireOwnerSession();
  const name = String(formData.get("name") || "").trim();
  const accentColor = String(formData.get("accentColor") || "").trim();
  if (!name) redirect("/settings?error=Enter+a+workspace+name");
  if (!HEX_COLOR.test(accentColor)) redirect("/settings?error=Accent+color+must+be+a+hex+value+like+%23ccff00");

  await prisma.organization.update({ where: { id: session.orgId }, data: { name, accentColor } });
  revalidatePath("/", "layout");
}

export async function addCategory(formData: FormData) {
  const { session, db } = await requireOwnerSession();
  const label = String(formData.get("label") || "").trim();
  if (!label) redirect("/settings?error=Enter+a+category+name");

  const key = label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "CATEGORY";
  const existing = await db.category.findUnique({ where: { orgId_key: { orgId: session.orgId, key } } });
  if (existing) redirect("/settings?error=That+category+already+exists");

  const count = await db.category.count();
  await db.category.create({ data: { key, label, order: count, orgId: session.orgId } });
  revalidatePath("/settings");
}

export async function renameCategory(id: string, formData: FormData) {
  const { db } = await requireOwnerSession();
  const label = String(formData.get("label") || "").trim();
  if (!label) redirect("/settings?error=Enter+a+category+name");
  await db.category.update({ where: { id }, data: { label } });
  revalidatePath("/settings");
}

export async function deleteCategory(id: string) {
  const { db } = await requireOwnerSession();
  const count = await db.category.count();
  if (count <= 1) throw new Error("A workspace needs at least one category.");
  await db.category.delete({ where: { id } });
  revalidatePath("/settings");
}
