import type { Plan } from "@/app/generated/prisma/client";

// The three tiers from the Social Flow pricing plan. Numbers here are the
// product's own defaults — an org's actual limits live on its own row
// (Organization.seatLimit etc.), copied from here whenever its plan changes,
// so a later change to these constants doesn't silently move the ground
// under an org that's already subscribed.

export type PlanLimits = {
  label: string;
  priceMonthly: number;
  priceAnnualMonthly: number;
  seatLimit: number;
  accountLimit: number;
  aiDraftLimit: number;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  STARTER: { label: "Starter", priceMonthly: 19, priceAnnualMonthly: 15, seatLimit: 2, accountLimit: 1, aiDraftLimit: 20 },
  CREATOR_PRO: { label: "Creator Pro", priceMonthly: 49, priceAnnualMonthly: 39, seatLimit: 5, accountLimit: 3, aiDraftLimit: 100 },
  AGENCY: { label: "Agency", priceMonthly: 149, priceAnnualMonthly: 119, seatLimit: 999, accountLimit: 999, aiDraftLimit: 500 },
};

export const PLAN_ORDER: Plan[] = ["STARTER", "CREATOR_PRO", "AGENCY"];

export type OrgLimits = {
  id: string;
  name: string;
  accentColor: string;
  plan: Plan;
  seatLimit: number;
  accountLimit: number;
  aiDraftLimit: number;
};

export type UsageSnapshot = {
  seatsUsed: number;
  accountsUsed: number;
  aiDraftsUsed: number;
};

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function seatsRemaining(org: OrgLimits, seatsUsed: number): number {
  return Math.max(0, org.seatLimit - seatsUsed);
}

export function accountsRemaining(org: OrgLimits, accountsUsed: number): number {
  return Math.max(0, org.accountLimit - accountsUsed);
}

export function aiDraftsRemaining(org: OrgLimits, aiDraftsUsed: number): number {
  return Math.max(0, org.aiDraftLimit - aiDraftsUsed);
}
