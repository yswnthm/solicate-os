export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { getTemplateBySlug, listTemplateVersions } from "@/lib/ai/template-store";
import { getActiveModels } from "@/lib/ai";
import { TemplateVersionActions } from "@/components/template-version-actions";
import { TemplateEditor } from "@/components/template-editor";
import { requireActiveUser } from "@/lib/auth";

export default async function TemplateDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireActiveUser();
  const { slug } = await params;
  const [detail, activeModels] = await Promise.all([getTemplateBySlug(slug), getActiveModels()]);
  if (!detail) notFound();

  const versions = await listTemplateVersions(detail.id);
  const t = detail.active;

  return (
    <>
      <Link href="/settings" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
        ← All settings
      </Link>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-text">
          <h1>{t.name}</h1>
          <p>
            {slug} · v{t.version} ·{" "}
            <span className={`pill ${detail.is_active ? "active" : ""}`}>{detail.is_active ? "active" : "off"}</span>
          </p>
        </div>
      </div>

      <div className="stack">
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title">
            <h2>How it runs</h2>
          </div>
          <div className="prose" style={{ fontSize: 14 }}>
            <p>{t.description || "No description."}</p>
            <ul>
              <li>
                <strong>Default model:</strong> {t.default_model || "unset"}
              </li>
              <li>
                <strong>Output:</strong> {t.response_format}
                {t.output_field ? ` (field "${t.output_field}")` : ""}
              </li>
              <li>
                <strong>Limits:</strong> {t.max_tokens} tokens · temperature {t.temperature}
              </li>
              <li>
                <strong>Context sources:</strong> {t.context_sources.join(", ") || "none"}
              </li>
              <li>
                <strong>Enabled variables:</strong> {t.enabled_variables.join(", ") || "none"}
              </li>
            </ul>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="section-title">
            <h2>System prompt</h2>
            <span>v{t.version}</span>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 13,
              lineHeight: 1.6,
              background: "var(--surface-2)",
              padding: 16,
              borderRadius: 8,
              overflowWrap: "anywhere",
              margin: 0,
            }}
          >
            {t.system_prompt}
          </pre>
          {t.output_rules.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 13 }}>Output rules</strong>
              <ul style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, paddingLeft: 20 }}>
                {t.output_rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {t.config && (
            <div style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 13 }}>Config</strong>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 12,
                  background: "var(--surface-2)",
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 6,
                  marginBottom: 0,
                }}
              >
                {JSON.stringify(t.config, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <TemplateEditor
          template={t}
          versions={versions}
          activeModelIds={activeModels.map((m) => m.model_id)}
        />

        <TemplateVersionActions
          templateId={detail.id}
          slug={slug}
          isActive={detail.is_active}
          versions={versions}
          currentVersion={t.version}
        />
      </div>
    </>
  );
}
