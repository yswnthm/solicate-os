export const dynamic = "force-dynamic";
import { signOut } from "@/features/actions";
import { requireActiveUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SettingsPage() {
  const { user, profile } = await requireActiveUser();
  return (
    <>
      <PageHeader title="Settings" description="Account and application configuration." />
      <div className="stack">
        <section className="card">
          <h3>Appearance</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }}>
            Customize how Solicate OS looks on your device. Choose between light mode, dark mode, or follow system settings.
          </p>
          <ThemeToggle variant="segmented" />
        </section>

        <section className="card">
          <h3>Account</h3>
          <div className="list" style={{ marginTop: 8 }}>
            <div className="row">
              <div className="row-main">
                <div className="row-title">{profile.display_name}</div>
                <div className="row-meta">{user.email}</div>
              </div>
              <span className="pill active">Active</span>
            </div>
          </div>
          <div className="divider" style={{ margin: "16px 0" }} />
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            To change your email or password, use the Supabase project settings or ask your workspace administrator.
          </p>
          <form action={signOut}>
            <button className="button secondary small" type="submit">
              Sign out
            </button>
          </form>
        </section>

        <section className="card">
          <h3>About Solicate OS</h3>
          <p>Version 1 — internal agency operating system.</p>
          <p style={{ marginTop: 8 }}>
            This is an internal tool for 1–3 Solicate team members. It is not a client portal, SaaS product, or
            public application. Partners and client contacts are external records managed by Solicate; they cannot
            log in.
          </p>
        </section>

        <section className="card">
          <h3>Operational guidelines</h3>
          <div className="stack" style={{ marginTop: 12, gap: 12, fontSize: 13, color: "var(--muted)" }}>
            <p>
              <strong style={{ color: "var(--ink-2)" }}>Capture first, triage later.</strong> Use the Inbox or
              quick capture on Today. Don&apos;t leave things in your head.
            </p>
            <p>
              <strong style={{ color: "var(--ink-2)" }}>Projects are the unit of work.</strong> Tasks, issues,
              entries, and conversations all live inside a project.
            </p>
            <p>
              <strong style={{ color: "var(--ink-2)" }}>Tasks vs issues.</strong> A task is work to do. An issue is
              a problem, risk, or unresolved concern. Don&apos;t conflate them.
            </p>
            <p>
              <strong style={{ color: "var(--ink-2)" }}>Archive, don&apos;t delete.</strong> Completed and closed
              projects remain searchable.
            </p>
            <p>
              <strong style={{ color: "var(--ink-2)" }}>Decisions need outcomes.</strong> When you record a
              decision, always add the decision outcome.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
