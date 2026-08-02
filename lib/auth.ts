import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireActiveUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("app_users").select("id, display_name, is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login?error=not-approved");
  return { user, profile };
}
