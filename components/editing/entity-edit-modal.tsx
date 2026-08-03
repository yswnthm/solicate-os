"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/modal";
import { useToast } from "@/components/editing/toast";
import type { EditResult } from "@/features/update-actions";

export type Values = Record<string, string | number | boolean | null>;

export type FieldOption = { value: string; label: string };

export type FieldConfig =
  | { kind: "text" | "email" | "url"; name: string; label: string; placeholder?: string; hint?: string; required?: boolean; width?: "full" | "half"; autoFocus?: boolean }
  | { kind: "date"; name: string; label: string; hint?: string; required?: boolean; width?: "full" | "half" }
  | { kind: "datetime"; name: string; label: string; hint?: string; required?: boolean; width?: "full" | "half" }
  | { kind: "number"; name: string; label: string; hint?: string; required?: boolean; min?: number; step?: string; width?: "full" | "half" }
  | { kind: "textarea"; name: string; label: string; placeholder?: string; hint?: string; required?: boolean; minHeight?: number; width?: "full" | "half"; autoFocus?: boolean }
  | { kind: "select"; name: string; label: string; options: FieldOption[]; placeholder?: string; hint?: string; required?: boolean; width?: "full" | "half"; autoFocus?: boolean }
  | { kind: "checkbox"; name: string; label: string; hint?: string; width?: "full" | "half" }
  | { kind: "custom"; name: string; label?: string; width?: "full" | "half"; render: (ctx: { value: unknown; setValue: (value: unknown) => void; values: Values }) => React.ReactNode };

export type EditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  record: Record<string, unknown>;
  fields: FieldConfig[];
  onSave: (values: Values) => Promise<EditResult>;
  validate?: (values: Values) => Record<string, string>;
  successMessage?: string;
  saveLabel?: string;
  savingLabel?: string;
  dismissLabel?: string;
  fullWidth?: boolean;
};

function normalize(record: Record<string, unknown>): Values {
  const out: Values = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) out[key] = "";
    else if (typeof value === "string" || typeof value === "boolean" || typeof value === "number") out[key] = value;
    else out[key] = "";
  }
  return out;
}

export function EntityEditModal({
  open,
  onOpenChange,
  title,
  description,
  record,
  fields,
  onSave,
  validate,
  successMessage,
  saveLabel = "Save changes",
  savingLabel = "Saving…",
  dismissLabel = "Cancel",
  fullWidth = false,
}: EditModalProps) {
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();

  const initial = useMemo(() => normalize(record), [record]);
  const [values, setValues] = useState<Values>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (open) {
      const next = normalize(record);
      setValues(next);
      setFieldErrors({});
      setSaveError(null);
      setIsSaving(false);
      setConfirmDiscard(false);
    }
  }, [open, record]);

  const isDirty = useMemo(
    () => JSON.stringify(initial) !== JSON.stringify(values),
    [initial, values],
  );

  const setValue = (name: string, value: unknown) => {
    setValues((current) => ({ ...current, [name]: value as Values[string] }));
  };

  // Cmd/Ctrl+Enter saves from anywhere in the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isSaving, isDirty]);

  const requestClose = () => {
    if (isDirty && !isSaving) setConfirmDiscard(true);
    else onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      if ("required" in field && field.required) {
        const value = values[field.name];
        if (value === "" || value === null || value === undefined) {
          nextErrors[field.name] = `${field.label} is required.`;
        }
      }
    }
    if (validate) Object.assign(nextErrors, validate(values));
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await onSave(values);
      if (result.ok) {
        toast.success(successMessage ?? `${title.replace(/^Edit /, "")} updated.`);
        onOpenChange(false);
        router.refresh();
      } else {
        setSaveError(result.error);
        toast.error(result.error);
        if (result.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            if (key === "form") continue;
            mapped[key] = messages[0];
          }
          setFieldErrors(mapped);
        }
      }
    } catch {
      const message = "Save failed. Check your connection and try again.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const footer = (
    <div className="save-bar">
      <span className={`save-bar-hint${isDirty ? " dirty" : ""}`}>
        {isDirty ? "Unsaved changes" : "No changes"}
      </span>
      <div className="save-bar-actions">
        <button type="button" className="button secondary" onClick={requestClose} disabled={isSaving}>
          {dismissLabel}
        </button>
        <button type="submit" form={formId} className="button" disabled={isSaving || !isDirty}>
          {isSaving && <span className="spinner" aria-hidden />}
          {isSaving ? savingLabel : saveLabel}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={open}
        onClose={requestClose}
        title={title}
        description={description}
        size={fullWidth ? "lg" : "md"}
        footer={footer}
      >
        <form ref={formRef} id={formId} className="form" onSubmit={handleSubmit} noValidate>
          {saveError && <div className="notice danger">{saveError}</div>}
          <div className="edit-fields">
            {fields.map((field) => (
              <div
                key={field.name}
                className={`edit-field ${field.width === "half" ? "half" : "full"}`}
              >
                {field.kind === "checkbox" ? (
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(values[field.name])}
                      onChange={(e) => setValue(field.name, e.target.checked)}
                    />
                    <span>{field.label}</span>
                  </label>
                ) : field.kind === "custom" ? (
                  <FieldRow field={field} values={values} setValue={setValue} />
                ) : (
                  <>
                    <label htmlFor={`edit-${field.name}`}>
                      {field.label}
                      {"required" in field && field.required ? <span className="req"> *</span> : null}
                    </label>
                    <FieldControl field={field} value={values[field.name]} setValue={setValue} />
                  </>
                )}
                {field.kind !== "custom" && field.kind !== "checkbox" && field.hint ? (
                  <p className="field-hint">{field.hint}</p>
                ) : null}
                {fieldErrors[field.name] ? (
                  <p className="field-error">{fieldErrors[field.name]}</p>
                ) : null}
              </div>
            ))}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Discard changes?"
      >
        <p className="modal-description">You have unsaved changes. If you leave now, they will be lost.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button
            className="button"
            onClick={() => {
              setConfirmDiscard(false);
              onOpenChange(false);
            }}
          >
            Discard changes
          </button>
          <button className="button secondary" onClick={() => setConfirmDiscard(false)}>
            Keep editing
          </button>
        </div>
      </Modal>
    </>
  );
}

function FieldRow({
  field,
  values,
  setValue,
}: {
  field: Extract<FieldConfig, { kind: "custom" }>;
  values: Values;
  setValue: (name: string, value: unknown) => void;
}) {
  if (field.label) {
    return (
      <>
        <label>{field.label}</label>
        {field.render({ value: values[field.name], setValue: (v) => setValue(field.name, v), values })}
      </>
    );
  }
  return <>{field.render({ value: values[field.name], setValue: (v) => setValue(field.name, v), values })}</>;
}

function FieldControl({
  field,
  value,
  setValue,
}: {
  field: Exclude<FieldConfig, { kind: "custom" } | { kind: "checkbox" }>;
  value: unknown;
  setValue: (name: string, value: unknown) => void;
}) {
  const id = `edit-${field.name}`;
  const stringValue = typeof value === "string" ? value : value == null ? "" : String(value);

  switch (field.kind) {
    case "text":
    case "email":
    case "url":
      return (
        <input
          id={id}
          name={field.name}
          type={field.kind}
          value={stringValue}
          placeholder={field.placeholder}
          autoFocus={field.autoFocus}
          onChange={(e) => setValue(field.name, e.target.value)}
        />
      );
    case "date":
      return (
        <input id={id} name={field.name} type="date" value={stringValue} onChange={(e) => setValue(field.name, e.target.value)} />
      );
    case "datetime":
      return (
        <input id={id} name={field.name} type="datetime-local" value={stringValue} onChange={(e) => setValue(field.name, e.target.value)} />
      );
    case "number":
      return (
        <input
          id={id}
          name={field.name}
          type="number"
          value={stringValue}
          min={field.min}
          step={field.step}
          onChange={(e) => setValue(field.name, e.target.value)}
        />
      );
    case "textarea":
      return (
        <textarea
          id={id}
          name={field.name}
          value={stringValue}
          placeholder={field.placeholder}
          autoFocus={field.autoFocus}
          style={field.minHeight ? { minHeight: field.minHeight } : undefined}
          onChange={(e) => setValue(field.name, e.target.value)}
        />
      );
    case "select":
      return (
        <select
          id={id}
          name={field.name}
          value={stringValue}
          autoFocus={field.autoFocus}
          onChange={(e) => setValue(field.name, e.target.value)}
        >
          {field.placeholder ? <option value="">{field.placeholder}</option> : null}
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
  }
}

export function EditButton({
  onClick,
  label = "Edit",
  className = "button ghost small",
  title,
  icon = true,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
  title?: string;
  icon?: boolean;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      title={title ?? label}
      aria-label={title ?? label}
    >
      {icon && <span aria-hidden>✎</span>}
      {label}
    </button>
  );
}
