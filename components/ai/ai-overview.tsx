import Link from "next/link";

import type { AiModelRow } from "@/lib/ai/types";

export interface SettingsProvider {
  name: string;
  key: string;
  configured: boolean;
  home: string;
}

interface SettingsTemplate {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  current_version: number;
  version_count: number;
}

const FEATURES = [
  {
    name: "Capture",
    blurb: "Understand a raw statement, clarify what changed, and propose every operational update.",
    slugs: ["capture-analyze", "capture-propose"],
  },
  {
    name: "Inbox Triage",
    blurb: "Turn one raw inbox item into a clean, filed project record.",
    slugs: ["inbox-triage", "inbox-triage-batch"],
  },
  {
    name: "Morning Brief",
    blurb: "Chief-of-staff day brief built from dashboard data.",
    slugs: ["morning-brief"],
  },
  {
    name: "Finance Capture",
    blurb: "Understand financial input and propose transactions, allocations, and invoice updates.",
    slugs: ["finance-capture-analyze", "finance-capture-propose"],
  },
] as const;

export function AiOverview({
  templates,
  models,
  providers,
}: {
  templates: SettingsTemplate[];
  models: AiModelRow[];
  providers: SettingsProvider[];
}) {
  const bySlug = new Map(templates.map((t) => [t.slug, t]));
  const activeModels = models.filter((m) => m.is_active);
  const configuredProviders = providers.filter((p) => p.configured);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="bento-grid" style={{ marginBottom: 0 }}>
        <div className="col-span-4 card" style={{ padding: "1.25rem", backgroundColor: "var(--card-blue)" }}>
          <div className="metric">{templates.length}</div>
          <div className="metric-label">AI templates</div>
        </div>
        <div className="col-span-4 card" style={{ padding: "1.25rem", backgroundColor: "var(--card-green)" }}>
          <div className="metric">{activeModels.length}</div>
          <div className="metric-label">Active models</div>
        </div>
        <div className="col-span-4 card" style={{ padding: "1.25rem", backgroundColor: "var(--card-orange)" }}>
          <div className="metric">
            {configuredProviders.length}/{providers.length}
          </div>
          <div className="metric-label">Providers configured</div>
        </div>
      </div>

      <section className="card">
        <div className="section-title">
          <h2>Features</h2>
          <span>The 4 workflows this engine powers</span>
        </div>
        <div className="grid two">
          {FEATURES.map((f) => {
            const found = f.slugs.map((s) => bySlug.get(s)).filter(Boolean) as SettingsTemplate[];
            return (
              <div key={f.name} className="card" style={{ padding: 20, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <strong style={{ fontSize: 15 }}>{f.name}</strong>
                  {found.length === f.slugs.length && (
                    <span className="pill active">ready</span>
                  )}
                  {found.length === 0 && <span className="pill">no template</span>}
                </div>
                <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>
                  {f.blurb}
                </p>
                <div className="list" style={{ gap: 6 }}>
                  {found.map((t) => (
                    <Link
                      key={t.id}
                      href={`/settings/ai/templates/${t.slug}`}
                      className="row"
                      style={{ padding: "10px 14px", boxShadow: "none", background: "var(--surface-2)" }}
                    >
                      <span className={`pill ${t.is_active ? "active" : ""}`}>{t.is_active ? "active" : "off"}</span>
                      <div className="row-main">
                        <div className="row-title" style={{ fontSize: 13 }}>{t.name}</div>
                        <div className="row-meta">
                          {t.slug} · v{t.current_version}
                        </div>
                      </div>
                      <span className="button ghost small">Edit</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Provider status</h2>
          <span>Keys are read from server environment variables</span>
        </div>
        <div className="list">
          {providers.map((p) => (
            <div className="row" key={p.name}>
              <span className={`pill ${p.configured ? "active" : ""}`}>{p.configured ? "configured" : "missing"}</span>
              <div className="row-main">
                <div className="row-title">{p.name}</div>
                <div className="row-meta">
                  {p.key} · {p.home}
                </div>
              </div>
              <Link className="button ghost small" href="/settings/ai/providers">
                Keys
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
