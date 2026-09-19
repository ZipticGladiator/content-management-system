import { login } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <h1>Sign in</h1>
      <p className="sub">Sign in with your account to access the CMS.</p>
      <form action={login} style={{ marginTop: 24 }}>
        <input type="hidden" name="from" value={from ?? "/youtube"} />
        <label className="f full">
          Email
          <input type="email" name="email" required autoFocus autoComplete="email" />
        </label>
        <label className="f full" style={{ marginTop: 12 }}>
          Password
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        {error ? (
          <p style={{ color: "var(--danger)", marginTop: 10, fontSize: 14 }}>
            Wrong email or password — try again.
          </p>
        ) : null}
        <button className="btn primary" type="submit" style={{ marginTop: 16 }}>
          Sign in
        </button>
      </form>
    </div>
  );
}
