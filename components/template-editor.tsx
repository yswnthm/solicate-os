"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateTemplateAction } from "@/features/ai-manage-actions";
import type { ResponseFormat, TemplateVersion } from "@/lib/ai/types";

interface EditorForm {
  name: string;
  description: string;
  system_prompt: string;
  default_model: string;
  output_rules: string;
  context_sources: string;
  enabled_variables: string;
  config: string;
  response_format: ResponseFormat;
  output_field: string;
  max_tokens: string;
  temperature: string;
  change_note: string;
}

const splitLines = (s: string) =>
  s.split("\n").map((line) => line.trim()).filter(Boolean);

export function TemplateEditor({
  template,
  versions,
  activeModelIds,
}: {
  template: TemplateVersion;
  versions: TemplateVersion[];
  activeModelIds: string[];
}) {
  const router = useRouter();
  const latest = versions[0] ?? template;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState<EditorForm>({
    name: template.name,
    description: template.description,
    system_prompt: template.system_prompt,
    default_model: template.default_model,
    output_rules: template.output_rules.join("\n"),
    context_sources: template.context_sources.join("\n"),
    enabled_variables: template.enabled_variables.join("\n"),
    config: template.config ? JSON.stringify(template.config, null, 2) : "",
    response_format: template.response_format,
    output_field: template.output_field,
    max_tokens: String(template.max_tokens),
    temperature: String(template.temperature),
    change_note: "",
  });

  const set =
    (key: keyof EditorForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let config: Record<string, unknown> | null = null;
      if (form.config.trim()) {
        try {
          config = JSON.parse(form.config);
        } catch {
          throw new Error("Config must be valid JSON.");
        }
      }
      await updateTemplateAction(template.template_id, {
        name: form.name.trim(),
        description: form.description.trim(),
        system_prompt: form.system_prompt,
        default_model: form.default_model.trim(),
        output_rules: splitLines(form.output_rules),
        context_sources: splitLines(form.context_sources),
        enabled_variables: splitLines(form.enabled_variables),
        config,
        response_format: form.response_format,
        output_field: form.output_field.trim(),
        max_tokens: Number(form.max_tokens),
        temperature: Number(form.temperature),
        change_note: form.change_note.trim() || `Edited v${latest.version}.`,
      });
      setNotice(`Saved as v${latest.version + 1}. It is now the active version.`);
      setForm((f) => ({ ...f, change_note: "" }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" style={{ padding: 20 }}>
      <div className="section-title">
        <h2>Edit template</h2>
        <button type="button" className="button secondary small" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide editor" : "Open editor"}
        </button>
      </div>
      {open && (
        <form className="form" style={{ marginTop: 16 }} onSubmit={onSubmit}>
          {error && <div className="notice" style={{ margin: "0 0 16px" }}>{error}</div>}
          {notice && <div className="notice" style={{ margin: "0 0 16px" }}>{notice}</div>}

          <div className="form-grid">
            <div className="field">
              <label htmlFor="tpl-name">Name</label>
              <input id="tpl-name" value={form.name} onChange={set("name")} required />
            </div>
            <div className="field">
              <label htmlFor="tpl-model">Default model</label>
              <input
                id="tpl-model"
                value={form.default_model}
                onChange={set("default_model")}
                list="tpl-model-options"
                placeholder="e.g. llama-3.3-70b-versatile"
              />
              <datalist id="tpl-model-options">
                {activeModelIds.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="field">
            <label htmlFor="tpl-desc">Description</label>
            <textarea id="tpl-desc" value={form.description} onChange={set("description")} rows={2} />
          </div>

          <div className="field">
            <label htmlFor="tpl-prompt">System prompt</label>
            <textarea
              id="tpl-prompt"
              value={form.system_prompt}
              onChange={set("system_prompt")}
              rows={12}
              style={{ fontFamily: "inherit", lineHeight: 1.6 }}
            />
          </div>

          <div className="field">
            <label htmlFor="tpl-rules">Output rules (one per line)</label>
            <textarea id="tpl-rules" value={form.output_rules} onChange={set("output_rules")} rows={4} />
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="tpl-context">Context sources (one per line)</label>
              <textarea id="tpl-context" value={form.context_sources} onChange={set("context_sources")} rows={3} />
            </div>
            <div className="field">
              <label htmlFor="tpl-vars">Enabled variables (one per line)</label>
              <textarea id="tpl-vars" value={form.enabled_variables} onChange={set("enabled_variables")} rows={3} />
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="tpl-format">Response format</label>
              <select id="tpl-format" value={form.response_format} onChange={set("response_format")}>
                <option value="json_field">json_field</option>
                <option value="text">text</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="tpl-field">Output field</label>
              <input id="tpl-field" value={form.output_field} onChange={set("output_field")} placeholder="output" />
            </div>
            <div className="field">
              <label htmlFor="tpl-tokens">Max tokens</label>
              <input id="tpl-tokens" type="number" value={form.max_tokens} onChange={set("max_tokens")} min={1} />
            </div>
            <div className="field">
              <label htmlFor="tpl-temp">Temperature</label>
              <input
                id="tpl-temp"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={form.temperature}
                onChange={set("temperature")}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="tpl-config">Config (JSON)</label>
            <textarea id="tpl-config" value={form.config} onChange={set("config")} rows={4} />
          </div>

          <div className="field">
            <label htmlFor="tpl-note">Change note</label>
            <input
              id="tpl-note"
              value={form.change_note}
              onChange={set("change_note")}
              placeholder={`e.g. Tightened output rules`}
            />
          </div>

          <p className="muted" style={{ fontSize: 13, margin: "0 0 16px" }}>
            Saving appends a new version (v{latest.version + 1}) and makes it the active one — nothing is overwritten.
          </p>

          <button className="button" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save as new version"}
          </button>
        </form>
      )}
    </section>
  );
}
