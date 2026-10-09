import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { SessionPayload } from "@/lib/auth";
import { PLAN_LIMITS, type OrgLimits, type UsageSnapshot } from "@/lib/plans";

// Multi-tenancy choke point. Every org-scoped query in the app goes through
// the client this file returns, never through a raw `prisma.<model>` call —
// that's what makes "every query scoped to the signed-in user's org" true
// everywhere at once instead of something each of 30+ call sites has to
// remember to do by hand.

/** Every model that carries its own `orgId` column (see prisma/schema.prisma). */
const SCOPED_MODELS = new Set([
  "User",
  "Invite",
  "Category",
  "AiDraftLog",
  "PushDevice",
  "YoutubeVideo",
  "TiktokClip",
  "Script",
  "Comment",
  "Attachment",
  "Asset",
  "Editor",
  "Inspiration",
  "Goal",
  "YoutubeAuth",
  "TiktokAuth",
]);

const READ_OR_FILTER_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

/**
 * A Prisma client where every operation on an org-scoped model is
 * transparently filtered (or stamped, on create) by `orgId`. Prisma's
 * "extended whereUnique" support means merging `orgId` into even a
 * `findUnique`/`update`/`delete`'s `where` is valid — it narrows the match
 * instead of breaking the unique lookup, so a row that exists but belongs to
 * another org behaves exactly like a row that doesn't exist (a 404, via the
 * same P2025 Prisma already throws for "not found" — see lib/mobile-api.ts
 * and the try/catch this file's callers use).
 */
export function scopedPrisma(orgId: string) {
  return prisma.$extends({
    name: "org-scope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SCOPED_MODELS.has(model)) return query(args);
          const a = { ...(args as Record<string, unknown>) };

          if (operation === "create") {
            a.data = { ...(a.data as object), orgId };
          } else if (operation === "createMany") {
            const data = a.data as unknown;
            a.data = Array.isArray(data) ? data.map((d) => ({ ...d, orgId })) : { ...(data as object), orgId };
          } else if (operation === "upsert") {
            a.where = { ...(a.where as object | undefined), orgId };
            a.create = { ...(a.create as object), orgId };
          } else if (READ_OR_FILTER_OPS.has(operation)) {
            a.where = { ...(a.where as object | undefined), orgId };
          }
          return query(a);
        },
      },
    },
  });
}

export type ScopedDb = ReturnType<typeof scopedPrisma>;

export type OrgSession = { session: SessionPayload; db: ScopedDb };

/** For a server action/route that must be signed in and have an org — the common case. Redirects to /login if not. */
export async function requireOrgSession(): Promise<OrgSession> {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  return { session, db: scopedPrisma(session.orgId) };
}

/** Same, but for an OWNER-only action (billing, invites, org settings). */
export async function requireOwnerSession(): Promise<OrgSession> {
  const result = await requireOrgSession();
  if (result.session.role !== "OWNER") throw new Error("Only the workspace owner can do this");
  return result;
}

/** The signed-in user's org row — name, branding, plan. Unscoped lookup by id is fine: the id itself came from their own session. */
export async function getCurrentOrg(orgId: string): Promise<OrgLimits | null> {
  return prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, accentColor: true, plan: true, seatLimit: true, accountLimit: true, aiDraftLimit: true },
  });
}

/** Seats, connected accounts and this month's AI drafts, against the org's plan limits. */
export async function getUsage(db: ScopedDb): Promise<UsageSnapshot> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [seatsUsed, youtubeConnected, tiktokConnected, aiDraftsUsed] = await Promise.all([
    db.user.count(),
    db.youtubeAuth.count(),
    db.tiktokAuth.count(),
    db.aiDraftLog.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);
  return { seatsUsed, accountsUsed: youtubeConnected + tiktokConnected, aiDraftsUsed };
}

export { PLAN_LIMITS };
