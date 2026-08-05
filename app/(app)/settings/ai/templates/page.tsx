export const dynamic = "force-dynamic";

import Link from "next/link";
import { listTemplates } from "@/lib/ai/template-store";
import { requireActiveUser } from "@/lib/auth";

export default async function AiTemplatesPage() {
  await requireActiveUser();
  const templates = await listTemplates();

  return (
    <section className="card">
      <div className="section-title">
        <h2>AI templates</h2>
        <span>Editing appends a version — nothing is overwritten</span>
      </div>
      <div className="list">
        {templates.length === 0 ? (
          <div className="empty">No templates found. Run the AI seed migration.</div>
        ) : (
          templates.map((t) => (
            <Link className="row" href={`/settings/ai/templates/${t.slug}`} key={t.id}>
              <span className={`pill ${t.is_active ? "active" : ""}`}>{t.is_active ? "active" : "off"}</span>
              <div className="row-main">
                <div className="row-title">{t.name}</div>
                <div className="row-meta">
                  {t.slug} · v{t.current_version} · {t.version_count} {t.version_count === 1 ? "version" : "versions"}
                </div>
              </div>
              <span className="button ghost small">Edit</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
