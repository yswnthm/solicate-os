import { generate, resolveModel } from "@/lib/ai";
import { getMessageDraftContext } from "@/lib/ai/context";
import { getTemplateBySlug } from "@/lib/ai/template-store";
import type { AiModelRow, TemplateVersion } from "@/lib/ai/types";

// The reusable AI execution pipeline:
//   User input → Load template → Retrieve context → Merge → Select model
//   → Generate → Parse/return.
// Every future AI feature is a new template (slug) + optional context builder;
// this engine is never touched again.

export interface RunTemplateInput {
  slug: string;
  variables?: Record<string, unknown>;
  /** Pre-built context package. When omitted, the slug's context builder runs. */
  context?: Record<string, unknown>;
  /** Override the template's default model with a catalog model_id. */
  modelId?: string;
}

export interface RunTemplateResult {
  /** Raw model output (JSON or text). */
  content: string;
  /** Extracted output: the output_field of parsed JSON, or raw text. */
  data: unknown;
  model: AiModelRow | null;
  template: TemplateVersion;
}

export interface PreparedTemplate {
  system: string;
  payload: Record<string, unknown> | Record<string, unknown>[];
  model: AiModelRow | null;
  template: TemplateVersion;
}

const CONTEXT_BUILDERS: Record<string, (variables?: Record<string, unknown>) => Promise<Record<string, unknown>>> = {
  "message-drafter": async (variables) =>
    (await getMessageDraftContext({
      projectId: String(variables?.projectId ?? ""),
      personId: String(variables?.personId ?? ""),
      phaseId: variables?.phaseId ? String(variables.phaseId) : null,
    })) as unknown as Record<string, unknown>,
};

/**
 * Load template → build context → merge payload → assemble system prompt →
 * resolve model. The exported result is identical to what runTemplate sends to
 * the model provider, so it can be surfaced to the operator for use in an
 * external model (e.g. pasting into ChatGPT).
 */
export async function prepareTemplate(input: RunTemplateInput): Promise<PreparedTemplate> {
  const detail = await getTemplateBySlug(input.slug);
  if (!detail) throw new Error(`AI template "${input.slug}" is not active.`);
  const tpl = detail.active;

  const context =
    input.context ??
    (CONTEXT_BUILDERS[input.slug] ? await CONTEXT_BUILDERS[input.slug](input.variables) : {});

  const hasVariables = Boolean(input.variables && Object.keys(input.variables).length > 0);
  const payload = hasVariables ? { context, operator: input.variables } : context;

  const model = await resolveModel(input.modelId ?? "", tpl.default_model);
  if (!model) throw new Error("No active model found. Check AI → Models.");

  const outputRules = Array.isArray(tpl.output_rules) && tpl.output_rules.length > 0
    ? `\n\nOUTPUT RULES:\n- ${tpl.output_rules.join("\n- ")}`
    : "";
  const system = `${tpl.system_prompt}${outputRules}`;

  return { system, payload, model, template: tpl };
}

/** Single combined prompt block, ready to paste into an external model. */
export function formatPromptForChat(prepared: PreparedTemplate): string {
  return `${prepared.system}\n\nCONTEXT & REQUEST (JSON):\n${JSON.stringify(prepared.payload, null, 2)}`;
}

export async function runTemplate(input: RunTemplateInput): Promise<RunTemplateResult> {
  const prepared = await prepareTemplate(input);
  const { system, payload, template: tpl } = prepared;
  const model = prepared.model!; // prepareTemplate throws when no model is active.

  const content = await generate({
    provider: model.provider,
    model: model.model_id,
    system,
    user: payload,
    temperature: Number(tpl.temperature),
    maxTokens: Number(tpl.max_tokens),
    responseFormat: tpl.response_format,
  });

  let data: unknown = content;
  if (tpl.response_format === "json_field") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON.");
    }
    data = tpl.output_field
      ? (parsed as Record<string, unknown>)?.[tpl.output_field]
      : parsed;
    if (data === undefined || data === null || data === "") {
      throw new Error(`AI response is missing "${tpl.output_field || "output"}".`);
    }
  }

  return { content, data, model, template: tpl };
}
