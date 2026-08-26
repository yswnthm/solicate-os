"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function invalidateSolicateCache() {
  revalidateTag("solicate");
  revalidatePath("/solicate");
  revalidatePath("/solicate/services");
  revalidatePath("/solicate/phases");
  revalidatePath("/solicate/team");
}

export async function updateSolicateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const tagline = formData.get("tagline")?.toString();
  const targetMarket = formData.get("target_market")?.toString();
  const northStar = formData.get("north_star")?.toString();
  const brandVoice = formData.get("brand_voice")?.toString();

  const { error } = await supabase.schema("solicate").from("profile").update({
    tagline,
    target_market: targetMarket,
    north_star: northStar,
    brand_voice: brandVoice,
    updated_at: new Date().toISOString(),
  }).eq("id", "839f3512-6097-6d96-9248-01fc2afebeda"); // singleton

  if (error) {
    return { success: false, error: error.message };
  }

  invalidateSolicateCache();
  return { success: true };
}

export async function updateSolicateService(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const status = formData.get("status")?.toString();
  const pricingFrom = formData.get("pricing_from") ? parseFloat(formData.get("pricing_from") as string) : null;
  const model = formData.get("model")?.toString();
  const notes = formData.get("notes")?.toString();

  const { error } = await supabase.schema("solicate").from("services").update({
    name,
    description,
    status,
    pricing_from: pricingFrom,
    model,
    notes,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  invalidateSolicateCache();
  return { success: true };
}

export async function createSolicateService(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const name = formData.get("name")?.toString();
  const slug = formData.get("slug")?.toString();
  const description = formData.get("description")?.toString();
  const status = formData.get("status")?.toString() || 'planned';
  const pricingFrom = formData.get("pricing_from") ? parseFloat(formData.get("pricing_from") as string) : null;
  const model = formData.get("model")?.toString();
  const notes = formData.get("notes")?.toString();

  const { error } = await supabase.schema("solicate").from("services").insert({
    name,
    slug,
    description,
    status,
    pricing_from: pricingFrom,
    model,
    notes,
  });

  if (error) return { success: false, error: error.message };
  invalidateSolicateCache();
  return { success: true };
}

export async function updateSolicatePhase(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const name = formData.get("name")?.toString();
  const description = formData.get("description")?.toString();
  const status = formData.get("status")?.toString();
  const successDefinition = formData.get("success_definition")?.toString();

  const { error } = await supabase.schema("solicate").from("phases").update({
    name,
    description,
    status,
    success_definition: successDefinition,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  invalidateSolicateCache();
  return { success: true };
}

export async function updateSolicateTeam(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const role = formData.get("role")?.toString();
  const roleType = formData.get("role_type")?.toString();
  const skills = formData.get("skills")?.toString();
  const status = formData.get("status")?.toString();
  const notes = formData.get("notes")?.toString();

  const { error } = await supabase.schema("solicate").from("team").update({
    role,
    role_type: roleType,
    skills,
    status,
    notes,
    updated_at: new Date().toISOString(),
  }).eq("id", id);

  if (error) return { success: false, error: error.message };
  invalidateSolicateCache();
  return { success: true };
}
