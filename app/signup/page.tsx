import Link from "next/link";
import { signup } from "@/app/signup/actions";

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <h1>Create a workspace</h1>
      <p className="sub">Your own pipeline, scripts and calendar — set up in a minute.</p>
      <form action={signup} style={{ marginTop: 24 }}>
        <label className="f full">
          Workspace name
          <input type="text" name="orgName" required autoFocus placeholder="e.g. your channel's name" />
        </label>
        <label className="f full" style={{ marginTop: 12 }}>
          Your name
          <input type="text" name="name" required autoComplete="name" />
        </label>
        <label className="f full" style={{ marginTop: 12 }}>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label className="f full" style={{ marginTop: 12 }}>
          Password
          <input type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
        {error ? <p style={{ color: "var(--danger)", marginTop: 10, fontSize: 14 }}>{error}</p> : null}
        <button className="btn primary" type="submit" style={{ marginTop: 16 }}>
          Create workspace
        </button>
      </form>
      <p className="sub" style={{ marginTop: 20 }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
