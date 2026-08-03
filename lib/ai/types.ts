// Shared types for the AI framework. The execution engine is provider-agnostic;
// providers are resolved from the ai_models catalog at runtime.

export const AI_PROVIDERS = ["groq", "gemini"] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  groq: "Groq",
  gemini: "Gemini",
};

export type ResponseFormat = "text" | "json_field";

export interface GenerateParams {
  provider: AiProvider;
  model: string;
  system: string;
  /** JSON-serializable payload sent as the user turn. */
  user: unknown;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
}

/** Row shape of the ai_models catalog. */
export interface AiModelRow {
  id: string;
  provider: AiProvider;
  model_id: string;
  display_name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

/** A template version row as loaded for execution. */
export interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  name: string;
  description: string;
  system_prompt: string;
  default_model: string;
  output_rules: string[];
  context_sources: string[];
  enabled_variables: string[];
  config: Record<string, unknown> | null;
  response_format: ResponseFormat;
  output_field: string;
  max_tokens: number;
  temperature: number;
  change_note: string;
}
