import { requireOwnerSession, getCurrentOrg, getUsage } from "@/lib/org";
import { PLAN_LIMITS, PLAN_ORDER } from "@/lib/plans";
import { setPlan } from "@/app/billing/actions";

export const dynamic = "force-dynamic";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const over = used >= limit;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span className="cat">
          {used} / {limit >= 999 ? "Unlimited" : limit}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: over ? "var(--danger)" : "var(--accent)",
            transition: "width 0.2s",
          }}
        />
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const { session, db } = await requireOwnerSession();
  const [org, usage] = await Promise.all([getCurrentOrg(session.orgId), getUsage(db)]);
  if (!org) throw new Error("Organization not found");

  const current = PLAN_LIMITS[org.plan];

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>Billing &amp; usage</h1>
          <p className="sub">Currently on the {current.label} plan.</p>
        </div>
      </header>

      <div className="notice" style={{ marginBottom: 24 }}>
        No payment provider is connected yet — switching plans below changes your limits immediately but does not
        charge a card. This is a placeholder until real billing is wired up.
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 18, margin: "0 0 12px" }}>This month&apos;s usage</h2>
        <UsageBar label="Seats" used={usage.seatsUsed} limit={org.seatLimit} />
        <UsageBar label="Connected accounts" used={usage.accountsUsed} limit={org.accountLimit} />
        <UsageBar label="AI drafts" used={usage.aiDraftsUsed} limit={org.aiDraftLimit} />
      </section>

      <section>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 18, margin: "0 0 12px" }}>Plans</h2>
        <div className="bar" style={{ gap: 16, flexWrap: "wrap" }}>
          {PLAN_ORDER.map((plan) => {
            const limits = PLAN_LIMITS[plan];
            const isCurrent = plan === org.plan;
            return (
              <div
                key={plan}
                className="card"
                style={{
                  flex: "1 1 220px",
                  padding: 20,
                  border: isCurrent ? "1px solid var(--accent)" : undefined,
                }}
              >
                <h3 style={{ margin: "0 0 4px", fontFamily: "var(--display)" }}>{limits.label}</h3>
                <p style={{ margin: "0 0 12px" }}>
                  <strong>${limits.priceMonthly}</strong>
                  <span className="cat">/mo</span>
                </p>
                <ul className="cat" style={{ margin: "0 0 16px", paddingLeft: 18 }}>
                  <li>{limits.seatLimit >= 999 ? "Unlimited" : limits.seatLimit} seats</li>
                  <li>{limits.accountLimit >= 999 ? "Unlimited" : limits.accountLimit} connected accounts</li>
                  <li>{limits.aiDraftLimit} AI drafts / month</li>
                </ul>
                {isCurrent ? (
                  <button className="btn" type="button" disabled>
                    Current plan
                  </button>
                ) : (
                  <form action={setPlan.bind(null, plan)}>
                    <button className="btn primary" type="submit">
                      Switch to {limits.label}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
