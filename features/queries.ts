import { createSupabaseServerClient } from "@/lib/supabase/server";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getActiveClients() {
  const supabase = await createSupabaseServerClient();
  const response = await supabase
    .from("clients")
    .select("id, name, kind, status, summary")
    .neq("status", "archived")
    .order("name");
  throwOnError(response.error);
  return response.data ?? [];
}

export async function getProjects() {
  const supabase = await createSupabaseServerClient();
  const response = await supabase
    .from("projects")
    .select("id, name, code, status, target_date, updated_at, clients(id, name)")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  throwOnError(response.error);
  return response.data ?? [];
}

/** Flat project list for selects — groups by client name */
export async function getActiveProjectsForSelect() {
  const supabase = await createSupabaseServerClient();
  const response = await supabase
    .from("projects")
    .select("id, name, clients(id, name)")
    .in("status", ["active", "paused"])
    .order("name");
  throwOnError(response.error);
  return response.data ?? [];
}

export async function getPeople() {
  const supabase = await createSupabaseServerClient();
  const response = await supabase
    .from("people")
    .select("id, name, email, phone, is_partner, summary")
    .is("archived_at", null)
    .order("is_partner", { ascending: false })
    .order("name");
  throwOnError(response.error);
  return response.data ?? [];
}

export async function getTodayData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const endOfWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const [overdue, upcoming, issues, inboxMessages, inboxEntries, changedProjects] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_at, priority, status, project_id, projects(name)")
      .eq("assignee_id", userId)
      .in("status", ["todo", "in_progress", "blocked"])
      .not("due_at", "is", null)
      .lt("due_at", now)
      .order("due_at"),
    supabase
      .from("tasks")
      .select("id, title, due_at, priority, status, project_id, projects(name)")
      .eq("assignee_id", userId)
      .in("status", ["todo", "in_progress", "blocked"])
      .not("due_at", "is", null)
      .gte("due_at", now)
      .lte("due_at", endOfWeek)
      .order("due_at"),
    supabase
      .from("issues")
      .select("id, title, severity, status, project_id, projects(name)")
      .in("status", ["open", "investigating", "waiting_external"])
      .order("reported_at", { ascending: false })
      .limit(8),
    supabase
      .from("messages")
      .select("id, body_md, sent_at, conversation_id, conversations(title, project_id)")
      .eq("triage_state", "inbox")
      .order("sent_at", { ascending: false })
      .limit(6),
    supabase
      .from("entries")
      .select("id, title, type, occurred_at, project_id, projects(name)")
      .eq("triage_state", "inbox")
      .order("occurred_at", { ascending: false })
      .limit(6),
    supabase
      .from("projects")
      .select("id, name, status, updated_at, clients(name)")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  [overdue, upcoming, issues, inboxMessages, inboxEntries, changedProjects].forEach((r) => throwOnError(r.error));
  return {
    overdue: overdue.data ?? [],
    upcoming: upcoming.data ?? [],
    issues: issues.data ?? [],
    inboxMessages: inboxMessages.data ?? [],
    inboxEntries: inboxEntries.data ?? [],
    changedProjects: changedProjects.data ?? [],
  };
}

export async function getProjectWorkspace(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const [project, tasks, issues, entries, participants, conversations, activity, people, users] = await Promise.all([
    supabase.from("projects").select("*, clients(id, name)").eq("id", projectId).maybeSingle(),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("status")
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("issues").select("*").eq("project_id", projectId).order("reported_at", { ascending: false }),
    supabase
      .from("entries")
      .select("*")
      .eq("project_id", projectId)
      .eq("triage_state", "filed")
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("project_participants")
      .select("*, people(id, name, is_partner, email, phone)")
      .eq("project_id", projectId),
    supabase
      .from("conversations")
      .select(
        "*, conversation_participants(people(id, name, is_partner)), messages(id, body_md, sent_at, direction, sender_person_id, sender_user_id)",
      )
      .eq("project_id", projectId)
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("activity_events")
      .select("*")
      .eq("project_id", projectId)
      .order("occurred_at", { ascending: false })
      .limit(40),
    supabase.from("people").select("id, name, is_partner").is("archived_at", null).order("name"),
    supabase.from("app_users").select("id, display_name").eq("is_active", true).order("display_name"),
  ]);
  [project, tasks, issues, entries, participants, conversations, activity, people, users].forEach((r) =>
    throwOnError(r.error),
  );
  return {
    project: project.data,
    tasks: tasks.data ?? [],
    issues: issues.data ?? [],
    entries: entries.data ?? [],
    participants: participants.data ?? [],
    conversations: conversations.data ?? [],
    activity: activity.data ?? [],
    people: people.data ?? [],
    users: users.data ?? [],
  };
}

export async function getClientDetail(clientId: string) {
  const supabase = await createSupabaseServerClient();
  const [client, contacts, projects, conversations, people] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
    supabase
      .from("client_people")
      .select("role_label, is_primary, people(id, name, email, phone, is_partner)")
      .eq("client_id", clientId),
    supabase
      .from("projects")
      .select("id, name, code, status, target_date")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("conversations")
      .select("id, title, kind, channel, project_id, last_message_at")
      .eq("client_id", clientId)
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    supabase.from("people").select("id, name").is("archived_at", null).order("name"),
  ]);
  [client, contacts, projects, conversations, people].forEach((r) => throwOnError(r.error));
  return {
    client: client.data,
    contacts: contacts.data ?? [],
    projects: projects.data ?? [],
    conversations: conversations.data ?? [],
    people: people.data ?? [],
  };
}

export async function getInboxData() {
  const supabase = await createSupabaseServerClient();
  const [messages, entries] = await Promise.all([
    supabase
      .from("messages")
      .select("id, body_md, sent_at, conversation_id, conversations(title, project_id, clients(name))")
      .eq("triage_state", "inbox")
      .order("sent_at", { ascending: false }),
    supabase
      .from("entries")
      .select("id, title, type, occurred_at, project_id, projects(name)")
      .eq("triage_state", "inbox")
      .order("occurred_at", { ascending: false }),
  ]);
  [messages, entries].forEach((r) => throwOnError(r.error));
  return { messages: messages.data ?? [], entries: entries.data ?? [] };
}

export async function searchRecords(query: string) {
  if (!query.trim()) return { entries: [], messages: [], projects: [], people: [] };
  const supabase = await createSupabaseServerClient();
  const search = query.trim();
  const [entries, messages, projects, people] = await Promise.all([
    supabase
      .from("entries")
      .select("id, project_id, title, type, occurred_at, projects(name)")
      .textSearch("search_vector", search, { type: "websearch" })
      .limit(20),
    supabase
      .from("messages")
      .select("id, conversation_id, body_md, sent_at, conversations(title, project_id)")
      .textSearch("search_vector", search, { type: "websearch" })
      .limit(20),
    supabase.from("projects").select("id, name, code, status, clients(name)").ilike("name", `%${search}%`).limit(10),
    supabase.from("people").select("id, name, is_partner, email").ilike("name", `%${search}%`).limit(10),
  ]);
  [entries, messages, projects, people].forEach((r) => throwOnError(r.error));
  return {
    entries: entries.data ?? [],
    messages: messages.data ?? [],
    projects: projects.data ?? [],
    people: people.data ?? [],
  };
}
