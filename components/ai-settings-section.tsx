"use client";

import Link from "next/link";
import { useState } from "react";

import { ModelManagement } from "@/components/model-management";
import { classNames } from "@/lib/utils";
import type { AiModelRow } from "@/lib/ai/types";

export interface SettingsTemplate {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  current_version: number;
  version_count: number;
}

export interface SettingsProvider {
  name: string;
  key: string;
  configured: boolean;
  home: string;
}

const TABS = [
  { key: "models", label: "Models" },
  { key: "templates", label: "Templates" },
  { key: "keys", label: "Provider keys" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function AiSettingsPanel({
  templates,
  models,
  providers,
}: {
  templates: SettingsTemplate[];
  models: AiModelRow[];
  providers: SettingsProvider[];
}) {
  const [tab, setTab] = useState<TabKey>("models");

  return (
    <div className="stack" style={{ gap: 20 }}>
      <nav className="tabs" style={{ margin: 0 }} aria-label="AI settings">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={classNames("tab", tab === t.key && "active")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === "templates" && <span className="tab-count">{templates.length}</span>}
            {t.key === "keys" && <span className="tab-count">{providers.filter((p) => p.configured).length} ok</span>}
          </button>
        ))}
      </nav>

      {tab === "models" && (
        <section className="card">
          <div className="section-title">
            <h2>Model catalog</h2>
            <span>Active models are available as template defaults and fallbacks</span>
          </div>
          <ModelManagement models={models} />
        </section>
      )}

      {tab === "templates" && (
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
                <Link className="row" href={`/settings/templates/${t.slug}`} key={t.id}>
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
      )}

      {tab === "keys" && (
        <section className="card">
          <div className="section-title">
            <h2>Provider keys</h2>
            <span>Read from server environment variables, never stored in the database</span>
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
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
