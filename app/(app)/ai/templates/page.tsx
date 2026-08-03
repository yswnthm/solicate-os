export const dynamic = "force-dynamic";

import Link from "next/link";

import { listTemplates } from "@/lib/ai/template-store";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { requireActiveUser } from "@/lib/auth";

export default async function TemplatesPage() {
  await requireActiveUser();
  const templates = await listTemplates();

  return (
    <>
      <PageHeader
        title="AI templates"
        description="Every AI capability is a versioned template — the prompts and rules the engine runs. Editing never overwrites a template; it appends a new version."
      />
      {templates.length === 0 ? (
        <div className="empty">No templates found. Run the AI seed migration.</div>
      ) : (
        <div className="list">
          {templates.map((t) => (
            <Link className="row" href={`/ai/templates/${t.slug}`} key={t.id}>
              <span className={`pill ${t.is_active ? "active" : ""}`}>{t.is_active ? "active" : "off"}</span>
              <div className="row-main">
                <div className="row-title">{t.name}</div>
                <div className="row-meta">
                  {t.slug} · v{t.current_version} · {t.version_count} {t.version_count === 1 ? "version" : "versions"}
                </div>
              </div>
              <StatusPill value={t.description ? "→" : "…"} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
