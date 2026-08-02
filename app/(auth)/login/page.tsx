import { redirect } from "next/navigation";

import { signIn } from "@/features/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/today");
  const { error } = await searchParams;

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">S</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-.04em" }}>Solicate OS</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Agency operations</div>
          </div>
        </div>
        <h1>Sign in</h1>
        <p>Your internal agency operating record. Approved users only.</p>

        {error && (
          <p className={`notice ${error === "not-approved" ? "error" : ""}`} style={{ marginBottom: 16 }}>
            {error === "not-approved"
              ? "This account has not been approved for Solicate OS."
              : error}
          </p>
        )}

        <form className="form" action={signIn}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@solicate.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </div>
          <button className="button" type="submit" style={{ marginTop: 4 }}>
            Sign in to Solicate OS
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 12 }}>
          Forgot your password? Ask your administrator to reset it in Supabase Auth.
        </p>
      </section>
    </div>
  );
}
