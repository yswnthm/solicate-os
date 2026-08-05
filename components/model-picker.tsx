"use client";

// The single model picker shared by every AI surface (capture, inbox triage,
// morning brief). Choosing a model
// here overrides the template's default for that run only — the catalog and
// template defaults remain the source of truth.

export interface ModelPickerOption {
  id: string;
  provider: string;
  display_name: string;
}

export function ModelPicker({
  label = "Model (advanced)",
  models,
  value,
  onChange,
  defaultModel,
  fieldId = "ai-model",
}: {
  label?: string;
  models: ModelPickerOption[];
  value: string;
  onChange: (value: string) => void;
  defaultModel?: string;
  fieldId?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <select id={fieldId} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Template default</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.display_name}
          </option>
        ))}
      </select>
      <p className="field-hint">Default: {defaultModel || "unset"}.</p>
    </div>
  );
}
