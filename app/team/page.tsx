import Link from "next/link";
import { requireOwnerSession } from "@/lib/org";
import { PLAN_LIMITS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { createInvite, removeMember, revokeInvite } from "@/app/team/actions";
import InviteLinkBanner from "@/components/InviteLinkBanner";
import RoleSelect from "@/components/RoleSelect";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string; error?: string }>;
}) {
  const { invited, error } = await searchParams;
  const { session, db } = await requireOwnerSession();

  const [org, members, invites] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.orgId }, select: { plan: true, seatLimit: true } }),
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.invite.findMany({ where: { acceptedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);

  const seatsUsed = members.length;
  const seatLimit = org?.seatLimit ?? PLAN_LIMITS.STARTER.seatLimit;

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>Team</h1>
          <p className="sub">
            {seatsUsed} of {seatLimit} seats used
            {seatsUsed >= seatLimit ? (
              <>
                {" — "}
                <Link href="/billing">upgrade for more</Link>
              </>
            ) : null}
          </p>
        </div>
      </header>

      {invited ? <InviteLinkBanner token={invited} /> : null}
      {error ? (
        <div className="notice" style={{ color: "var(--danger)" }}>
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 18, margin: "0 0 12px" }}>Members</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td className="cat">{m.email}</td>
                  <td>
                    <RoleSelect userId={m.id} role={m.role} disabled={m.id === session.uid} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {m.id === session.uid ? (
                      <span className="cat">You</span>
                    ) : (
                      <form action={removeMember.bind(null, m.id)}>
                        <button className="btn danger" type="submit">
                          Remove
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 18, margin: "0 0 12px" }}>Invite a teammate</h2>
        <form action={createInvite} className="bar" style={{ alignItems: "flex-end" }}>
          <label className="f">
            Email
            <input type="email" name="email" required placeholder="teammate@example.com" />
          </label>
          <label className="f">
            Role
            <select name="role" defaultValue="EDITOR">
              <option value="EDITOR">Editor</option>
              <option value="OWNER">Owner</option>
            </select>
          </label>
          <button className="btn primary" type="submit">
            Send invite
          </button>
        </form>
        <p className="sub" style={{ marginTop: 8 }}>
          There&apos;s no email service wired up yet — sending an invite gives you a link to copy and send yourself.
        </p>
      </section>

      {invites.length ? (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 18, margin: "0 0 12px" }}>Pending invites</h2>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Expires</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.email}</td>
                    <td className="cat">{inv.role === "OWNER" ? "Owner" : "Editor"}</td>
                    <td className="cat">{inv.expiresAt.toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <form action={revokeInvite.bind(null, inv.id)}>
                        <button className="btn" type="submit">
                          Revoke
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
