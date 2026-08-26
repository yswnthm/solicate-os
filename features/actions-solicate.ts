"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EditResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function invalidateSolicateCache() {
  revalidateTag("solicate");
  revalidatePath("/solicate");
  revalidatePath("/solicate/services");
  revalidatePath("/solicate/phases");
  revalidatePath("/solicate/team");
}

export async function updateSolicateProfile(values: Record<string, any>): Promise<EditResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const tagline = values.tagline ? String(values.tagline).trim() : null;
    const targetMarket = values.target_market ? String(values.target_market).trim() : null;
    const northStar = values.north_star ? String(values.north_star).trim() : null;
    const brandVoice = values.brand_voice ? String(values.brand_voice).trim() : "";
    const websiteUrl = values.website_url ? String(values.website_url).trim() : null;

    const { error } = await supabase
      .schema("solicate")
      .from("profile")
      .update({
        tagline,
        target_market: targetMarket,
        north_star: northStar,
        brand_voice: brandVoice,
        website_url: websiteUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "839f3512-6097-6d96-9248-01fc2afebeda");

    if (error) return { ok: false, error: error.message };

    invalidateSolicateCache();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update profile." };
  }
}

export async function updateSolicateService(id: string, values: Record<string, any>): Promise<EditResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const name = values.name ? String(values.name).trim() : "";
    const description = values.description ? String(values.description).trim() : null;
    const status = values.status ? String(values.status).trim() : "active";
    const pricingFrom = values.pricing_from ? parseFloat(String(values.pricing_from)) : null;
    const pricingCurrency = values.pricing_currency ? String(values.pricing_currency).trim() : "INR";
    const model = values.model ? String(values.model).trim() : "phase_based";
    const notes = values.notes ? String(values.notes).trim() : null;

    const { error } = await supabase
      .schema("solicate")
      .from("services")
      .update({
        name,
        description,
        status,
        pricing_from: pricingFrom,
        pricing_currency: pricingCurrency,
        model,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    invalidateSolicateCache();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update service." };
  }
}

export async function createSolicateService(values: Record<string, any>): Promise<EditResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const name = values.name ? String(values.name).trim() : "";
    const slug = values.slug ? String(values.slug).trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const description = values.description ? String(values.description).trim() : null;
    const status = values.status ? String(values.status).trim() : "active";
    const pricingFrom = values.pricing_from ? parseFloat(String(values.pricing_from)) : null;
    const pricingCurrency = values.pricing_currency ? String(values.pricing_currency).trim() : "INR";
    const model = values.model ? String(values.model).trim() : "phase_based";
    const notes = values.notes ? String(values.notes).trim() : null;

    const { error } = await supabase
      .schema("solicate")
      .from("services")
      .insert({
        name,
        slug,
        description,
        status,
        pricing_from: pricingFrom,
        pricing_currency: pricingCurrency,
        model,
        notes,
      });

    if (error) return { ok: false, error: error.message };

    invalidateSolicateCache();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to create service." };
  }
}

export async function updateSolicatePhase(id: string, values: Record<string, any>): Promise<EditResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const name = values.name ? String(values.name).trim() : "";
    const description = values.description ? String(values.description).trim() : null;
    const status = values.status ? String(values.status).trim() : "planned";
    const startedOn = values.started_on ? String(values.started_on).trim() : null;
    const targetDate = values.target_date ? String(values.target_date).trim() : null;
    const successDefinition = values.success_definition ? String(values.success_definition).trim() : null;

    const { error } = await supabase
      .schema("solicate")
      .from("phases")
      .update({
        name,
        description,
        status,
        started_on: startedOn,
        target_date: targetDate,
        success_definition: successDefinition,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    invalidateSolicateCache();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update phase." };
  }
}

export async function updateSolicateTeam(id: string, values: Record<string, any>): Promise<EditResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const name = values.name ? String(values.name).trim() : "";
    const role = values.role ? String(values.role).trim() : "";
    const roleType = values.role_type ? String(values.role_type).trim() : "partner";
    const skills = values.skills ? String(values.skills).trim() : null;
    const status = values.status ? String(values.status).trim() : "active";
    const joinedOn = values.joined_on ? String(values.joined_on).trim() : null;
    const notes = values.notes ? String(values.notes).trim() : null;

    const { error } = await supabase
      .schema("solicate")
      .from("team")
      .update({
        name,
        role,
        role_type: roleType,
        skills,
        status,
        joined_on: joinedOn,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    invalidateSolicateCache();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update team member." };
  }
}
