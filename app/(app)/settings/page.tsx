export const dynamic = "force-dynamic";
import Link from "next/link";
import { signOut } from "@/features/actions";
import { requireActiveUser } from "@/lib/auth";
import { getAllModels } from "@/lib/ai";
import { listTemplates } from "@/lib/ai/template-store";
import { isGeminiConfigured } from "@/lib/ai/providers/gemini";
import { isGroqConfigured } from "@/lib/ai/providers/groq";
import { isOpencodeConfigured } from "@/lib/ai/providers/opencode";
import { ModelManagement } from "@/components/model-management";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SettingsPage() {
  const { user, profile } = await requireActiveUser();
  const [models, templates] = await Promise.all([getAllModels(), listTemplates()]);
  const providers = [
    { name: "Groq", key: "GROQ_API_KEY", configured: isGroqConfigured(), home: "console.groq.com" },
    { name: "Gemini", key: "GEMINI_API_KEY", configured: isGeminiConfigured(), home: "ai.google.dev" },
    { name: "Opencode Zen", key: "OPENCODE_API_KEY", configured: isOpencodeConfigured(), home: "opencode.ai/auth" },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Appearance, the AI engine, account, and operational guidelines."
      />
      <div className="stack">
        <section className="card">
          <h3>Appearance</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }}>
            Customize how Solicate OS looks on your device. Choose between light mode, dark mode, or follow system settings.
          </p>
          <ThemeToggle variant="segmented" />
        </section>

        <section className="card">
          <div className="section-title">
            <h2>AI</h2>
            <span>Templates, models, and provider keys behind Capture, Triage, Morning Brief, and Finance Capture</span>
          </div>
          <div className="stack" style={{ gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Templates</h3>
              <div className="list">
                {templates.length === 0 ? (
                  <div className="empty">No templates found. Run the AI seed migration.</div>
                ) : (
                  templates.map((t) => (
                    <Link className="row" href={`/settings/templates/${t.slug}`} key={t.id}>
                      <span className={`pill ${t.is_active ? "active" : ""}`}>{t.is_active ? "active" : "off"}</span>
                      <div className="row-main">
                        <div className="row-title">{t.name}</div>
                        <div className="row-meta">
                          {t.slug} · v{t.current_version} · {t.version_count}{" "}
                          {t.version_count === 1 ? "version" : "versions"}
                        </div>
                      </div>
                      <span className="button ghost small">Edit</span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="divider" />

            <div>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Models</h3>
              <ModelManagement models={models} />
            </div>

            <div className="divider" />

            <div>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Provider keys</h3>
              <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>
                Read from server environment variables, never stored in the database.
              </p>
              <div className="list">
                {providers.map((p) => (
                  <div className="row" key={p.name}>
                    <span className={`pill ${p.configured ? "active" : ""}`}>
                      {p.configured ? "configured" : "missing"}
                    </span>
                    <div className="row-main">
                      <div className="row-title">{p.name}</div>
                      <div className="row-meta">
                        {p.key} · {p.home}
                      </div>
                    </div>
                    <Link
                      className="button ghost small"
                      href={p.configured ? p.home : `https://${p.home}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {p.configured ? "Manage" : "Get key"}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
              and entries all live inside a project.
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
