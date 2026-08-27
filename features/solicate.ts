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
    const { data: teamMembers, error } = await supabase
      .schema("solicate")
      .from("team")
      .select("*")
      .order("joined_on");
    throwOnError(error);

    if (!teamMembers || teamMembers.length === 0) return [];

    const personIds = teamMembers.map((m: any) => m.person_id).filter(Boolean);
    const userIds = teamMembers.map((m: any) => m.user_id).filter(Boolean);

    const [peopleRes, usersRes] = await Promise.all([
      personIds.length
        ? supabase.from("people").select("id, name").in("id", personIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabase.from("app_users").select("id, display_name").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const peopleMap = new Map((peopleRes.data ?? []).map((p: any) => [p.id, p]));
    const usersMap = new Map((usersRes.data ?? []).map((u: any) => [u.id, u]));

    return teamMembers.map((m: any) => ({
      ...m,
      public_people: m.person_id ? peopleMap.get(m.person_id) ?? null : null,
      public_app_users: m.user_id ? usersMap.get(m.user_id) ?? null : null,
    }));
  },
  ["get-solicate-team"],
  { revalidate: 60, tags: ["solicate"] },
);
