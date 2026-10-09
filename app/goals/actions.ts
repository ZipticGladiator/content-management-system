"use server";

import { revalidatePath } from "next/cache";
import { scopedPrisma } from "@/lib/org";
import { GoalPlatform } from "@/app/generated/prisma/client";

export type GoalInput = {
  platform: GoalPlatform;
  label: string;
  target: number;
  manualCurrent: number;
  deadline: string | null;
};

function toData(data: GoalInput) {
  return {
    platform: data.platform,
    label: data.label,
    target: Math.max(0, data.target),
    manualCurrent: Math.max(0, data.manualCurrent),
    deadline: data.deadline ? new Date(data.deadline) : null,
  };
}

export async function createGoal(orgId: string, data: GoalInput) {
  const db = scopedPrisma(orgId);
  await db.goal.create({ data: { ...toData(data), orgId } });
  revalidatePath("/goals");
}

export async function updateGoal(orgId: string, id: string, data: GoalInput) {
  const db = scopedPrisma(orgId);
  await db.goal.update({ where: { id }, data: toData(data) });
  revalidatePath("/goals");
}

export async function deleteGoal(orgId: string, id: string) {
  const db = scopedPrisma(orgId);
  await db.goal.delete({ where: { id } });
  revalidatePath("/goals");
}
