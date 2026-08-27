import { unstable_cache } from "next/cache";
import { createSupabaseServerClientWithToken, getAccessToken, createSupabaseServerClient } from "@/lib/supabase/server";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SolicateSubtask {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SolicateTask {
  id: string;
  phase_id: string | null;
  assignee_id: string | null;
  title: string;
  description_md: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  position: number;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: SolicateSubtask[];
  assignee?: { id: string; name: string; role: string; role_type: string } | null;
}

export interface SolicatePhase {
  id: string;
  position: number;
  name: string;
  status: 'planned' | 'active' | 'completed';
  started_on: string | null;
  target_date: string | null;
  description: string | null;
  success_definition: string | null;
  updated_at: string;
  tasks?: SolicateTask[];
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

export async function getSolicatePhases(): Promise<SolicatePhase[]> {
  return getSolicatePhasesCached(await getAccessToken());
}

const getSolicatePhasesCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const { data, error } = await supabase
      .schema('solicate')
      .from("phases")
      .select(`
        *,
        tasks (*, subtasks (*))
      `)
      .order("position");
      
    throwOnError(error);

    // Sort tasks and subtasks by position
    const phases = data ?? [];
    return phases.map((phase: any) => ({
      ...phase,
      tasks: (phase.tasks ?? [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((task: any) => ({
          ...task,
          subtasks: (task.subtasks ?? []).sort((a: any, b: any) => a.position - b.position)
        }))
    })) as SolicatePhase[];
  },
  ["get-solicate-phases"],
  { revalidate: 60, tags: ["solicate"] },
);

export async function getSolicatePhase(phaseId: string): Promise<{
  phase: SolicatePhase | null;
  tasks: SolicateTask[];
  phases: SolicatePhase[];
  team: any[];
}> {
  const supabase = createSupabaseServerClientWithToken(await getAccessToken());
  const [phaseRes, tasksRes, phasesRes, teamRes] = await Promise.all([
    supabase.schema("solicate").from("phases").select("*").eq("id", phaseId).maybeSingle(),
    supabase.schema("solicate").from("tasks").select("*, subtasks(*)").eq("phase_id", phaseId).order("created_at", { ascending: true }),
    supabase.schema("solicate").from("phases").select("*").order("position"),
    supabase.schema("solicate").from("team").select("id, name, role, role_type"),
  ]);

  throwOnError(phaseRes.error);
  throwOnError(tasksRes.error);

  const teamMap = new Map((teamRes.data ?? []).map((m: any) => [m.id, m]));
  const tasks = (tasksRes.data ?? []).map((t: any) => ({
    ...t,
    assignee: t.assignee_id ? teamMap.get(t.assignee_id) ?? null : null,
    subtasks: (t.subtasks ?? []).sort((a: any, b: any) => a.position - b.position),
  })) as SolicateTask[];

  return {
    phase: phaseRes.data as SolicatePhase | null,
    tasks,
    phases: (phasesRes.data ?? []) as SolicatePhase[],
    team: teamRes.data ?? [],
  };
}

export async function getSolicateAllTasks(): Promise<SolicateTask[]> {
  return getSolicateAllTasksCached(await getAccessToken());
}

const getSolicateAllTasksCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const [tasksRes, teamRes] = await Promise.all([
      supabase
        .schema("solicate")
        .from("tasks")
        .select(`
          *,
          subtasks (*)
        `)
        .order("created_at", { ascending: true }),
      supabase
        .schema("solicate")
        .from("team")
        .select("id, name, role, role_type")
    ]);

    throwOnError(tasksRes.error);
    const teamMap = new Map((teamRes.data ?? []).map((m: any) => [m.id, m]));

    return (tasksRes.data ?? []).map((t: any) => ({
      ...t,
      assignee: t.assignee_id ? teamMap.get(t.assignee_id) ?? null : null,
      subtasks: (t.subtasks ?? []).sort((a: any, b: any) => a.position - b.position),
    })) as SolicateTask[];
  },
  ["get-solicate-all-tasks"],
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
