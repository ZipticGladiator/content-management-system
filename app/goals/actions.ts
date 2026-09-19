"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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

export async function createGoal(data: GoalInput) {
  await prisma.goal.create({ data: toData(data) });
  revalidatePath("/goals");
}

export async function updateGoal(id: string, data: GoalInput) {
  await prisma.goal.update({ where: { id }, data: toData(data) });
  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/goals");
}
