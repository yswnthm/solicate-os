import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ResponseFormat, TemplateVersion } from "@/lib/ai/types";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// The editable content of a template version. Templates are never overwritten:
// every edit/restore inserts a new row and repoints current_version.
export interface TemplateContent {
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

export interface TemplateMeta {
  id: string;
  slug: string;
  name: string;
  description: string;
  current_version: number;
  is_active: boolean;
}

export interface TemplateDetail extends TemplateMeta {
  active: TemplateVersion;
}

function mapVersion(row: Record<string, unknown>): TemplateVersion {
  return {
    id: String(row.id),
    template_id: String(row.template_id),
    version: Number(row.version),
    name: String(row.name),
    description: String(row.description ?? ""),
    system_prompt: String(row.system_prompt),
    default_model: String(row.default_model ?? ""),
    output_rules: (row.output_rules as string[]) ?? [],
    context_sources: (row.context_sources as string[]) ?? [],
    enabled_variables: (row.enabled_variables as string[]) ?? [],
    config: (row.config as Record<string, unknown>) ?? null,
    response_format: (row.response_format as ResponseFormat) ?? "json_field",
    output_field: String(row.output_field ?? "output"),
    max_tokens: Number(row.max_tokens ?? 2048),
    temperature: Number(row.temperature ?? 0.4),
    change_note: String(row.change_note ?? ""),
  };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getTemplateBySlug(slug: string): Promise<TemplateDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: meta, error } = await supabase
    .from("ai_templates")
    .select("id, slug, name, description, current_version, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  throwOnError(error);
  if (!meta) return null;

  const { data: version, error: versionError } = await supabase
    .from("ai_template_versions")
    .select("*")
    .eq("template_id", meta.id)
    .eq("version", meta.current_version)
    .maybeSingle();
  throwOnError(versionError);
  if (!version) return null;

  return { ...(meta as TemplateMeta), active: mapVersion(version) };
}

export async function listTemplates(): Promise<(TemplateMeta & { version_count: number })[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("ai_templates").select("*").order("name");
  throwOnError(error);
  const metas = (data ?? []) as TemplateMeta[];

  const versions = await Promise.all(
    metas.map(async (m) => {
      const { data: v, error: e } = await supabase
        .from("ai_template_versions")
        .select("id")
        .eq("template_id", m.id);
      throwOnError(e);
      return (v ?? []).length;
    }),
  );
  return metas.map((m, i) => ({ ...m, version_count: versions[i] }));
}

export async function listTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_template_versions")
    .select("*")
    .eq("template_id", templateId)
    .order("version", { ascending: false });
  throwOnError(error);
  return (data ?? []).map(mapVersion);
}

export async function getVersion(templateId: string, version: number): Promise<TemplateVersion | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ai_template_versions")
    .select("*")
    .eq("template_id", templateId)
    .eq("version", version)
    .maybeSingle();
  throwOnError(error);
  return data ? mapVersion(data) : null;
}

// ─── Writes (append-only) ────────────────────────────────────────────────────

async function nextVersion(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, templateId: string) {
  const { data, error } = await supabase
    .from("ai_template_versions")
    .select("version")
    .eq("template_id", templateId)
    .order("version", { ascending: false })
    .limit(1);
  throwOnError(error);
  return ((data?.[0]?.version as number) ?? 0) + 1;
}

/** Insert a new version and repoint the template's current_version. */
export async function createTemplateVersion(
  templateId: string,
  content: Omit<TemplateContent, "change_note"> & { change_note?: string },
  createdById: string,
): Promise<TemplateVersion> {
  const supabase = await createSupabaseServerClient();
  const version = await nextVersion(supabase, templateId);

  const { data, error } = await supabase
    .from("ai_template_versions")
    .insert({
      template_id: templateId,
      version,
      name: content.name,
      description: content.description,
      system_prompt: content.system_prompt,
      default_model: content.default_model,
      output_rules: content.output_rules,
      context_sources: content.context_sources,
      enabled_variables: content.enabled_variables,
      config: content.config,
      response_format: content.response_format,
      output_field: content.output_field,
      max_tokens: content.max_tokens,
      temperature: content.temperature,
      change_note: content.change_note ?? "",
      created_by_id: createdById,
    })
    .select("*")
    .single();
  throwOnError(error);

  const [{ error: metaError }, { error: nameError }] = await Promise.all([
    supabase.from("ai_templates").update({ current_version: version, updated_by_id: createdById }).eq("id", templateId),
    supabase.from("ai_templates").update({ name: content.name, description: content.description, updated_by_id: createdById }).eq("id", templateId),
  ]);
  throwOnError(metaError ?? nameError);

  return mapVersion(data);
}

export async function createTemplate(
  slug: string,
  content: Omit<TemplateContent, "change_note"> & { change_note?: string },
  createdById: string,
): Promise<TemplateDetail> {
  const supabase = await createSupabaseServerClient();
  const { data: meta, error } = await supabase
    .from("ai_templates")
    .insert({
      slug,
      name: content.name,
      description: content.description,
      current_version: 1,
      is_active: true,
      created_by_id: createdById,
    })
    .select("id, slug, name, description, current_version, is_active")
    .single();
  throwOnError(error);
  if (!meta) throw new Error("Failed to create the template.");

  await createTemplateVersion(meta.id, { ...content, change_note: content.change_note ?? "Initial version." }, createdById);
  return getTemplateBySlug(meta.slug) as Promise<TemplateDetail>;
}

export async function setActiveVersion(templateId: string, version: number, updatedById: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ai_templates")
    .update({ current_version: version, updated_by_id: updatedById })
    .eq("id", templateId);
  throwOnError(error);
}

/** Restore is itself versioned: it copies an old version's content as the newest row. */
export async function restoreVersion(templateId: string, version: number, updatedById: string, note?: string) {
  const source = await getVersion(templateId, version);
  if (!source) throw new Error("Source version not found.");
  return createTemplateVersion(
    templateId,
    {
      name: source.name,
      description: source.description,
      system_prompt: source.system_prompt,
      default_model: source.default_model,
      output_rules: source.output_rules,
      context_sources: source.context_sources,
      enabled_variables: source.enabled_variables,
      config: source.config,
      response_format: source.response_format,
      output_field: source.output_field,
      max_tokens: source.max_tokens,
      temperature: source.temperature,
      change_note: note || `Restored from version ${version}.`,
    },
    updatedById,
  );
}

export async function duplicateTemplate(templateId: string, createdById: string): Promise<TemplateDetail | null> {
  const supabase = await createSupabaseServerClient();
  const current = await getVersion(templateId, (await getTemplateMeta(supabase, templateId))?.current_version ?? 1);
  const meta = await getTemplateMeta(supabase, templateId);
  if (!current || !meta) throw new Error("Template not found.");

  const { data, error } = await supabase
    .from("ai_templates")
    .insert({
      slug: `${meta.slug}-copy`,
      name: `${current.name} (Copy)`,
      description: current.description,
      current_version: 1,
      is_active: true,
      created_by_id: createdById,
    })
    .select("id, slug, name, description, current_version, is_active")
    .single();
  throwOnError(error);
  if (!data) throw new Error("Failed to duplicate the template.");

  await createTemplateVersion(
    data.id,
    {
      name: current.name,
      description: current.description,
      system_prompt: current.system_prompt,
      default_model: current.default_model,
      output_rules: current.output_rules,
      context_sources: current.context_sources,
      enabled_variables: current.enabled_variables,
      config: current.config,
      response_format: current.response_format,
      output_field: current.output_field,
      max_tokens: current.max_tokens,
      temperature: current.temperature,
      change_note: "Duplicated from original.",
    },
    createdById,
  );
  return getTemplateBySlug(data.slug);
}

async function getTemplateMeta(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  templateId: string,
): Promise<TemplateMeta | null> {
  const { data, error } = await supabase
    .from("ai_templates")
    .select("id, slug, name, description, current_version, is_active")
    .eq("id", templateId)
    .maybeSingle();
  throwOnError(error);
  return (data as TemplateMeta) ?? null;
}
