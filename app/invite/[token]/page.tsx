import { prisma } from "@/lib/prisma";
import { acceptInvite } from "@/app/invite/[token]/actions";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: { email: true, role: true, acceptedAt: true, expiresAt: true, org: { select: { name: true } } },
  });

  const invalid = !invite || !!invite.acceptedAt || invite.expiresAt < new Date();

  if (invalid) {
    return (
      <div className="wrap" style={{ maxWidth: 420 }}>
        <h1>Invite not valid</h1>
        <p className="sub">
          {!invite
            ? "This invite link doesn't exist."
            : invite.acceptedAt
              ? "This invite has already been used."
              : "This invite has expired — ask whoever sent it for a new one."}
        </p>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <h1>Join {invite.org.name}</h1>
      <p className="sub">
        You&apos;ve been invited as {invite.role === "OWNER" ? "an owner" : "an editor"} — {invite.email}
      </p>
      <form action={acceptInvite} style={{ marginTop: 24 }}>
        <input type="hidden" name="token" value={token} />
        <label className="f full">
          Your name
          <input type="text" name="name" required autoFocus autoComplete="name" />
        </label>
        <label className="f full" style={{ marginTop: 12 }}>
          Choose a password
          <input type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
        {error ? <p style={{ color: "var(--danger)", marginTop: 10, fontSize: 14 }}>{error}</p> : null}
        <button className="btn primary" type="submit" style={{ marginTop: 16 }}>
          Join workspace
        </button>
      </form>
    </div>
  );
}
