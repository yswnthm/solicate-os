import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateGemini, isGeminiConfigured } from "@/lib/ai/providers/gemini";
import { generateGroq, isGroqConfigured } from "@/lib/ai/providers/groq";
import { generateOpencode, isOpencodeConfigured } from "@/lib/ai/providers/opencode";
import type { AiModelRow, AiProvider, GenerateParams } from "@/lib/ai/types";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ─── Provider dispatch ───────────────────────────────────────────────────────

export function isProviderConfigured(provider: AiProvider) {
  return provider === "groq"
    ? isGroqConfigured()
    : provider === "gemini"
      ? isGeminiConfigured()
      : provider === "opencode"
        ? isOpencodeConfigured()
        : false;
}

export async function generate(params: GenerateParams): Promise<string> {
  switch (params.provider) {
    case "groq":
      return generateGroq(params);
    case "gemini":
      return generateGemini(params);
    case "opencode":
      return generateOpencode(params);
    default:
      throw new Error(`Unsupported provider: ${(params as { provider: string }).provider}`);
  }
}

// ─── Model catalog (ai_models) ────────────────────────────────────────────────

function mapModel(row: Record<string, unknown>): AiModelRow {
  return {
    id: String(row.id),
    provider: row.provider as AiProvider,
    model_id: String(row.model_id),
    display_name: String(row.display_name),
    description: String(row.description ?? ""),
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order ?? 0),
  };
}

export async function getActiveModels(): Promise<AiModelRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_models")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  throwOnError(error);
  return (data ?? []).map(mapModel);
}

export async function getAllModels(): Promise<AiModelRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("ai_models").select("*").order("provider").order("sort_order");
  throwOnError(error);
  return (data ?? []).map(mapModel);
}

/**
 * Resolve a model_id from the catalog to its provider. Falls back to the
 * template's configured model when a model_id is empty.
 */
export async function resolveModel(modelId: string, fallbackModelId?: string): Promise<AiModelRow | null> {
  const supabase = await createSupabaseServerClient();
  const ids = [modelId, fallbackModelId].filter(Boolean) as string[];
  if (ids.length === 0) return null;
  const { data, error } = await supabase
    .from("ai_models")
    .select("*")
    .in("model_id", ids)
    .eq("is_active", true)
    .order("sort_order");
  throwOnError(error);
  const rows = (data ?? []).map(mapModel);
  return rows.find((r) => r.model_id === modelId) ?? rows.find((r) => r.model_id === fallbackModelId) ?? rows[0] ?? null;
}
