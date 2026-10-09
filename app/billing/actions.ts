"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwnerSession } from "@/lib/org";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan } from "@/app/generated/prisma/client";

const PLANS = new Set<Plan>(["STARTER", "CREATOR_PRO", "AGENCY"]);

/**
 * Sets the org's plan and copies that tier's limits onto the org row. There is
 * no Stripe (or any payment processor) wired up — this is a stand-in switch so
 * the rest of the product (seat/account/AI-draft limits) has something real to
 * enforce against ahead of actual billing integration.
 */
export async function setPlan(plan: string) {
  const { session } = await requireOwnerSession();
  if (!PLANS.has(plan as Plan)) throw new Error("Unknown plan");
  const limits = PLAN_LIMITS[plan as Plan];
  await prisma.organization.update({
    where: { id: session.orgId },
    data: {
      plan: plan as Plan,
      seatLimit: limits.seatLimit,
      accountLimit: limits.accountLimit,
      aiDraftLimit: limits.aiDraftLimit,
    },
  });
  revalidatePath("/billing");
}
