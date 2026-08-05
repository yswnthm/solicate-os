"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { requireActiveUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createTemplate,
  createTemplateVersion,
  duplicateTemplate,
  restoreVersion,
  setActiveVersion,
  type TemplateContent,
} from "@/lib/ai/template-store";
import { AI_PROVIDERS, type AiProvider } from "@/lib/ai/types";

const TAG_TEMPLATES = "ai-templates";
const TAG_MODELS = "ai-models";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ─── Model management ─────────────────────────────────────────────────────────

export async function setModelActive(modelId: string, isActive: boolean) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ai_models").update({ is_active: isActive }).eq("id", modelId);
  throwOnError(error);
  revalidateTag(TAG_MODELS);
}

export async function setModelSortOrder(modelId: string, sortOrder: number) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ai_models").update({ sort_order: sortOrder }).eq("id", modelId);
  throwOnError(error);
  revalidateTag(TAG_MODELS);
}

const modelInputSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  model_id: z.string().trim().min(1),
  display_name: z.string().trim().min(1),
  description: z.string().trim().default(""),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(100),
});

export async function createModel(input: z.infer<typeof modelInputSchema>) {
  const { user } = await requireActiveUser();
  const parsed = modelInputSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_models")
    .insert({
      provider: parsed.provider,
      model_id: parsed.model_id,
      display_name: parsed.display_name,
      description: parsed.description,
      is_active: parsed.is_active,
      sort_order: parsed.sort_order,
      created_by_id: user.id,
    })
    .select("id")
    .single();
  throwOnError(error);
  revalidateTag(TAG_MODELS);
  return data?.id ?? null;
}

export async function updateModel(
  modelId: string,
  input: Partial<Omit<z.infer<typeof modelInputSchema>, "provider" | "model_id">>,
) {
  await requireActiveUser();
  const parsed = modelInputSchema.partial().pick({
    display_name: true,
    description: true,
    is_active: true,
    sort_order: true,
  }).parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ai_models").update(parsed).eq("id", modelId);
  throwOnError(error);
  revalidateTag(TAG_MODELS);
}

export async function deleteModel(modelId: string) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ai_models").delete().eq("id", modelId);
  throwOnError(error);
  revalidateTag(TAG_MODELS);
}

// ─── Template management ──────────────────────────────────────────────────────

export type TemplateEditInput = Omit<TemplateContent, "change_note"> & { change_note?: string };

export async function createTemplateAction(slug: string, input: TemplateEditInput) {
  const { user } = await requireActiveUser();
  const parsedSlug = z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or dashes.")
    .parse(slug);
  const detail = await createTemplate(parsedSlug, input, user.id);
  revalidateTag(TAG_TEMPLATES);
  return detail;
}

export async function updateTemplateAction(templateId: string, input: TemplateEditInput) {
  const { user } = await requireActiveUser();
  const version = await createTemplateVersion(templateId, input, user.id);
  revalidateTag(TAG_TEMPLATES);
  return version;
}

export async function setTemplateActiveVersionAction(templateId: string, version: number) {
  const { user } = await requireActiveUser();
  await setActiveVersion(templateId, version, user.id);
  revalidateTag(TAG_TEMPLATES);
}

export async function restoreTemplateVersionAction(templateId: string, version: number, note?: string) {
  const { user } = await requireActiveUser();
  await restoreVersion(templateId, version, user.id, note);
  revalidateTag(TAG_TEMPLATES);
}

export async function duplicateTemplateAction(templateId: string) {
  const { user } = await requireActiveUser();
  const detail = await duplicateTemplate(templateId, user.id);
  revalidateTag(TAG_TEMPLATES);
  return detail;
}

export async function toggleTemplateActive(templateId: string, isActive: boolean) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ai_templates").update({ is_active: isActive }).eq("id", templateId);
  throwOnError(error);
  revalidateTag(TAG_TEMPLATES);
}

/** Soft-delete: a template is deactivated so the engine no longer loads it. */
export async function deleteTemplate(templateId: string) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ai_templates").update({ is_active: false }).eq("id", templateId);
  throwOnError(error);
  revalidateTag(TAG_TEMPLATES);
}

/** Hard delete: removes the template and its version history (cascade). */
export async function deleteTemplatePermanently(templateId: string) {
  await requireActiveUser();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ai_templates").delete().eq("id", templateId);
  throwOnError(error);
  revalidateTag(TAG_TEMPLATES);
}

export type { AiProvider };
