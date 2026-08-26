import { unstable_cache } from "next/cache";
import { createSupabaseServerClientWithToken, getAccessToken, createSupabaseServerClient } from "@/lib/supabase/server";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getSolicateProfile() {
  return getSolicateProfileCached(await getAccessToken());
}

const getSolicateProfileCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    // Use .schema('solicate') to query the internal schema
    const { data, error } = await supabase.schema('solicate').from("profile").select("*").limit(1).maybeSingle();
    throwOnError(error);
    return data;
  },
  ["get-solicate-profile"],
  { revalidate: 60, tags: ["solicate"] },
);

export async function getSolicatePhases() {
  return getSolicatePhasesCached(await getAccessToken());
}

const getSolicatePhasesCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const { data, error } = await supabase.schema('solicate').from("phases").select("*").order("position");
    throwOnError(error);
    return data ?? [];
  },
  ["get-solicate-phases"],
  { revalidate: 60, tags: ["solicate"] },
);

export async function getSolicateServices() {
  return getSolicateServicesCached(await getAccessToken());
}

const getSolicateServicesCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const { data, error } = await supabase.schema('solicate').from("services").select("*").order("name");
    throwOnError(error);
    return data ?? [];
  },
  ["get-solicate-services"],
  { revalidate: 60, tags: ["solicate"] },
);

export async function getSolicateTeam() {
  return getSolicateTeamCached(await getAccessToken());
}

const getSolicateTeamCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const { data, error } = await supabase.schema('solicate').from("team").select("*, public_people:person_id(name), public_app_users:user_id(display_name)").order("joined_on");
    throwOnError(error);
    return data ?? [];
  },
  ["get-solicate-team"],
  { revalidate: 60, tags: ["solicate"] },
);
