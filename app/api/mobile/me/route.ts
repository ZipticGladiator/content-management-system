import { NextResponse } from "next/server";
import { handle, requireScoped } from "@/lib/mobile-api";
import { getCurrentOrg, getUsage } from "@/lib/org";

export const GET = handle(async (req) => {
  const { session, db } = await requireScoped(req);
  const [org, usage] = await Promise.all([getCurrentOrg(session.orgId), getUsage(db)]);
  return NextResponse.json({
    user: { id: session.uid, email: session.email, name: session.name, role: session.role },
    org: org && {
      id: org.id,
      name: org.name,
      accentColor: org.accentColor,
      plan: org.plan,
      limits: { seatLimit: org.seatLimit, accountLimit: org.accountLimit, aiDraftLimit: org.aiDraftLimit },
      usage,
    },
  });
});
