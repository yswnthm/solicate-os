import { unstable_cache } from "next/cache";

import {
  createSupabaseServerClient,
  createSupabaseServerClientWithToken,
  getAccessToken,
} from "@/lib/supabase/server";
import { getActiveModels } from "@/lib/ai";
import { getTemplateBySlug } from "@/lib/ai/template-store";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// Near-static lists: cached for 60s, invalidated by tag from mutating actions.
// cookies() must stay OUTSIDE the cache scope — the token is read per request
// and passed in, so RLS still scopes rows to the requesting user.
export async function getActiveClients() {
  return getActiveClientsCached(await getAccessToken());
}

const getActiveClientsCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const response = await supabase
      .from("clients")
      .select("id, name, kind, status, summary, website_url")
      .neq("status", "archived")
      .order("name");
    throwOnError(response.error);
    return response.data ?? [];
  },
  ["get-active-clients"],
  { revalidate: 60, tags: ["clients"] },
);

export async function getProjects() {
  return getProjectsCached(await getAccessToken());
}

const getProjectsCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const response = await supabase
      .from("projects")
      .select("id, name, code, status, target_date, updated_at, started_on, summary, objective, client_id, clients(id, name)")
      .neq("status", "archived")
      .order("updated_at", { ascending: false });
    throwOnError(response.error);
    return response.data ?? [];
  },
  ["get-projects"],
  { revalidate: 60, tags: ["projects"] },
);

/** Flat project list for selects — groups by client name */
export async function getActiveProjectsForSelect() {
  return getActiveProjectsForSelectCached(await getAccessToken());
}

const getActiveProjectsForSelectCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const response = await supabase
      .from("projects")
      .select("id, name, clients(id, name)")
      .in("status", ["active", "paused"])
      .order("name");
    throwOnError(response.error);
    return response.data ?? [];
  },
  ["get-active-projects-for-select"],
  { revalidate: 60, tags: ["projects"] },
);

export async function getPeople() {
  return getPeopleCached(await getAccessToken());
}

const getPeopleCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const response = await supabase
      .from("people")
      .select("id, name, email, phone, is_partner, summary")
      .is("archived_at", null)
      .order("is_partner", { ascending: false })
      .order("name");
    throwOnError(response.error);
    return response.data ?? [];
  },
  ["get-people"],
  { revalidate: 60, tags: ["people"] },
);

// Sidebar badge: short-TTL cache, tag-invalidated by inbox mutations.
export async function getInboxCount() {
  return getInboxCountCached(await getAccessToken());
}

const getInboxCountCached = unstable_cache(
  async (accessToken: string | null) => {
    const supabase = createSupabaseServerClientWithToken(accessToken);
    const [messages, entries] = await Promise.all([
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("triage_state", "inbox"),
      supabase.from("entries").select("id", { count: "exact", head: true }).eq("triage_state", "inbox"),
    ]);
    throwOnError(messages.error ?? entries.error);
    return (messages.count ?? 0) + (entries.count ?? 0);
  },
  ["get-inbox-count"],
  { revalidate: 30, tags: ["inbox"] },
);

export async function getTodayData(userId: string) {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const endOfWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const [overdue, upcoming, issues, inboxMessages, inboxEntries, changedProjects] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_at, priority, status, project_id, projects(name), phases(name)")
      .eq("assignee_id", userId)
      .in("status", ["todo", "in_progress", "blocked"])
      .not("due_at", "is", null)
      .lt("due_at", now)
      .order("due_at"),
    supabase
      .from("tasks")
      .select("id, title, due_at, priority, status, project_id, projects(name), phases(name)")
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

// Cap message history per conversation; the workspace is a dashboard, not an archive.
const CONVERSATION_MESSAGE_LIMIT = 100;
const PROJECT_MESSAGE_LIMIT = 200;

// AI-only caps — purpose-built for prompt payloads. UI queries use the
// constants above and are NOT affected by these.
const AI_CONVERSATION_MESSAGE_LIMIT = 20;
const AI_PROJECT_MESSAGE_LIMIT = 40;

// Slim project fetch for layouts/headers — the tabs render their own workspace.
export async function getProjectHeader(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const response = await supabase
    .from("projects")
    .select("*, clients(id, name)")
    .eq("id", projectId)
    .maybeSingle();
  throwOnError(response.error);
  return response.data;
}

export async function getProjectWorkspace(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const [project, tasks, issues, entries, participants, conversations, recentMessages, activity, phases, finance, people, users] =
    await Promise.all([
      supabase.from("projects").select("*, clients(id, name)").eq("id", projectId).maybeSingle(),
      supabase
        .from("tasks")
        .select("id, title, description_md, status, priority, due_at, phase_id, assignee_id, phases(id, name, position)")
        .eq("project_id", projectId)
        .order("status")
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("issues")
        .select("id, title, description_md, status, severity, resolution_summary, assignee_id, phase_id, phases(id, name)")
        .eq("project_id", projectId)
        .order("reported_at", { ascending: false }),
      supabase
        .from("entries")
        .select("id, title, type, body_md, occurred_at, decision_outcome, decision_state, project_id, phase_id, phases(id, name)")
        .eq("project_id", projectId)
        .eq("triage_state", "filed")
        .order("occurred_at", { ascending: false })
        .limit(200),
      supabase
        .from("project_participants")
        .select("person_id, role, role_label, communication_mode, financial_arrangement, financial_value, is_referral_source, currency_code, payment_status, terms_note, people(id, name)")
        .eq("project_id", projectId),
      supabase
        .from("conversations")
        .select("id, title, kind, channel, project_id, conversation_participants(people(id, name))")
        .eq("project_id", projectId)
        .order("last_message_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("messages")
        .select("id, body_md, sent_at, direction, conversation_id, people(name), app_users!sender_user_id(display_name), conversations!inner(project_id)")
        .eq("conversations.project_id", projectId)
        .order("sent_at", { ascending: false })
        .limit(PROJECT_MESSAGE_LIMIT),
      supabase
        .from("activity_events")
        .select("id, event_type, summary, occurred_at")
        .eq("project_id", projectId)
        .order("occurred_at", { ascending: false })
        .limit(40),
      supabase
        .from("phases")
        .select("id, name, description, position, status, started_on, target_date, completed_at, project_id, scope_deliverables, scope_requirements, scope_acceptance, proposal_quotation, proposal_pricing, proposal_revisions")
        .eq("project_id", projectId)
        .order("position"),
      supabase
        .from("finance_items")
        .select("id, kind, title, amount, currency_code, occurred_on, notes, phase_id, phases(id, name)")
        .eq("project_id", projectId)
        .order("occurred_on", { ascending: false }),
      supabase.from("people").select("id, name, is_partner").is("archived_at", null).order("name"),
      supabase.from("app_users").select("id, display_name").eq("is_active", true).order("display_name"),
    ]);
  [project, tasks, issues, entries, participants, conversations, recentMessages, activity, phases, finance, people, users].forEach((r) =>
    throwOnError(r.error),
  );

  const messagesByConversation = new Map<string, Record<string, unknown>[]>();
  for (const message of recentMessages.data ?? []) {
    const list = messagesByConversation.get(message.conversation_id) ?? [];
    if (list.length < CONVERSATION_MESSAGE_LIMIT) list.push(message);
    messagesByConversation.set(message.conversation_id, list);
  }
  const conversationsWithMessages = (conversations.data ?? []).map((conversation) => ({
    ...conversation,
    messages: messagesByConversation.get(conversation.id) ?? [],
  }));

  return {
    project: project.data,
    tasks: tasks.data ?? [],
    issues: issues.data ?? [],
    entries: entries.data ?? [],
    participants: participants.data ?? [],
    conversations: conversationsWithMessages,
    recentMessages: recentMessages.data ?? [],
    activity: activity.data ?? [],
    phases: phases.data ?? [],
    finance: finance.data ?? [],
    people: people.data ?? [],
    users: users.data ?? [],
  };
}

/**
 * AI-only slim workspace — same shape as getProjectWorkspace but with tight
 * DB-level limits so the JSON payload fits inside the model's context window.
 *
 * Changes vs the UI workspace:
 *   - entries      limit 40   (was 200), body_md truncated in context builders
 *   - messages     limit 40   (was 200), per-conversation cap = 20 (was 100)
 *   - tasks        limit 60   (was unbounded), no description_md
 *   - issues       limit 30   (was unbounded), no description_md
 *   - finance      limit 25   (was unbounded)
 *   - phases       only id/name/position/status/started_on/target_date (no scope_x/proposal_x)
 *   - people/users same (catalog only, already small)
 *
 * IMPORTANT: getProjectWorkspace is NOT modified — the UI keeps full fidelity.
 */
export async function getProjectWorkspaceForAI(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const [project, tasks, issues, entries, participants, conversations, recentMessages, activity, phases, finance, people, users] =
    await Promise.all([
      supabase.from("projects").select("*, clients(id, name)").eq("id", projectId).maybeSingle(),
      supabase
        .from("tasks")
        // No description_md — saves significant tokens; capture context uses title+status+id
        .select("id, title, status, priority, due_at, phase_id, assignee_id, phases(id, name, position)")
        .eq("project_id", projectId)
        .order("status")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(60),
      supabase
        .from("issues")
        // No description_md — saves significant tokens
        .select("id, title, status, severity, resolution_summary, assignee_id, phase_id, phases(id, name)")
        .eq("project_id", projectId)
        .order("reported_at", { ascending: false })
        .limit(30),
      supabase
        .from("entries")
        // body_md IS included — context builders truncate it to 300 chars
        .select("id, title, type, body_md, occurred_at, decision_outcome, decision_state, project_id, phase_id, phases(id, name)")
        .eq("project_id", projectId)
        .eq("triage_state", "filed")
        .order("occurred_at", { ascending: false })
        .limit(40),
      supabase
        .from("project_participants")
        .select("person_id, role, role_label, communication_mode, financial_arrangement, financial_value, is_referral_source, currency_code, payment_status, terms_note, people(id, name)")
        .eq("project_id", projectId),
      supabase
        .from("conversations")
        .select("id, title, kind, channel, project_id, conversation_participants(people(id, name))")
        .eq("project_id", projectId)
        .order("last_message_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("messages")
        .select("id, body_md, sent_at, direction, conversation_id, people(name), app_users!sender_user_id(display_name), conversations!inner(project_id)")
        .eq("conversations.project_id", projectId)
        .order("sent_at", { ascending: false })
        .limit(AI_PROJECT_MESSAGE_LIMIT),
      supabase
        .from("activity_events")
        .select("id, event_type, summary, occurred_at")
        .eq("project_id", projectId)
        .order("occurred_at", { ascending: false })
        .limit(20),
      supabase
        .from("phases")
        // No scope_*/proposal_* fields — save ~30-60 tokens per phase
        .select("id, name, description, position, status, started_on, target_date, completed_at, project_id")
        .eq("project_id", projectId)
        .order("position"),
      supabase
        .from("finance_items")
        .select("id, kind, title, amount, currency_code, occurred_on, notes, phase_id, phases(id, name)")
        .eq("project_id", projectId)
        .order("occurred_on", { ascending: false })
        .limit(25),
      supabase.from("people").select("id, name, is_partner").is("archived_at", null).order("name"),
      supabase.from("app_users").select("id, display_name").eq("is_active", true).order("display_name"),
    ]);
  [project, tasks, issues, entries, participants, conversations, recentMessages, activity, phases, finance, people, users].forEach((r) =>
    throwOnError(r.error),
  );

  const messagesByConversation = new Map<string, Record<string, unknown>[]>();
  for (const message of recentMessages.data ?? []) {
    const list = messagesByConversation.get(message.conversation_id) ?? [];
    if (list.length < AI_CONVERSATION_MESSAGE_LIMIT) list.push(message);
    messagesByConversation.set(message.conversation_id, list);
  }
  const conversationsWithMessages = (conversations.data ?? []).map((conversation) => ({
    ...conversation,
    messages: messagesByConversation.get(conversation.id) ?? [],
  }));

  return {
    project: project.data,
    tasks: tasks.data ?? [],
    issues: issues.data ?? [],
    entries: entries.data ?? [],
    participants: participants.data ?? [],
    conversations: conversationsWithMessages,
    recentMessages: recentMessages.data ?? [],
    activity: activity.data ?? [],
    phases: phases.data ?? [],
    finance: finance.data ?? [],
    people: people.data ?? [],
    users: users.data ?? [],
  };
}

// ─── Phase workspace ─────────────────────────────────────────────────────────
// A phase owns its execution: tasks, issues, records, finance, and activity
// that reference the phase's records. Everything the phase tabs render comes
// from this single workspace.

// Slim fetch for phase layouts/headers — the tabs render their own workspace.
export async function getPhaseHeader(phaseId: string) {
  const supabase = await createSupabaseServerClient();
  const [phase, project] = await Promise.all([
    supabase.from("phases").select("id, name, position, status, description, project_id").eq("id", phaseId).maybeSingle(),
    supabase
      .from("phases")
      .select("projects(id, name, code)")
      .eq("id", phaseId)
      .maybeSingle(),
  ]);
  throwOnError(phase.error ?? project.error);
  const rawProject = project.data?.projects as unknown;
  const headerProject =
    Array.isArray(rawProject) && rawProject.length > 0 ? (rawProject[0] as { id: string; name: string; code: string }) : rawProject;
  return phase.data
    ? { phase: phase.data, project: (headerProject as { id: string; name: string; code: string } | null) ?? null }
    : { phase: null, project: null };
}

export async function getPhaseWorkspace(phaseId: string) {
  const supabase = await createSupabaseServerClient();
  const phaseResult = await supabase.from("phases").select("*").eq("id", phaseId).maybeSingle();
  throwOnError(phaseResult.error);
  const phase = phaseResult.data;
  if (!phase) {
    return { phase: null, project: null, tasks: [], issues: [], entries: [], finance: [], activity: [], phases: [], users: [] };
  }

  const [project, tasks, issues, entries, finance, phases, users] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, code, status, summary, objective, client_id, clients(id, name)")
      .eq("id", phase.project_id)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, description_md, status, priority, due_at, phase_id, assignee_id, phases(id, name, position)")
      .eq("phase_id", phaseId)
      .order("status")
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("issues")
      .select("id, title, description_md, status, severity, resolution_summary, assignee_id, phase_id, phases(id, name)")
      .eq("phase_id", phaseId)
      .order("reported_at", { ascending: false }),
    supabase
      .from("entries")
      .select("id, title, type, body_md, occurred_at, decision_outcome, decision_state, project_id, phase_id, phases(id, name)")
      .eq("phase_id", phaseId)
      .eq("triage_state", "filed")
      .order("occurred_at", { ascending: false })
      .limit(200),
    supabase
      .from("finance_items")
      .select("id, kind, title, amount, currency_code, occurred_on, notes, phase_id, phases(id, name)")
      .eq("phase_id", phaseId)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("phases")
      .select("id, name, description, position, status, started_on, target_date, completed_at, project_id")
      .eq("project_id", phase.project_id)
      .order("position"),
    supabase.from("app_users").select("id, display_name").eq("is_active", true).order("display_name"),
  ]);
  [project, tasks, issues, entries, finance, phases, users].forEach((r) => throwOnError(r.error));

  const recordIds = [
    phase.id,
    ...(tasks.data ?? []).map((t) => t.id),
    ...(issues.data ?? []).map((i) => i.id),
    ...(entries.data ?? []).map((e) => e.id),
  ];
  const activity = await supabase
    .from("activity_events")
    .select("id, event_type, summary, occurred_at")
    .eq("project_id", phase.project_id)
    .in("record_id", recordIds)
    .order("occurred_at", { ascending: false })
    .limit(80);
  throwOnError(activity.error);

  return {
    phase,
    project: project.data,
    tasks: tasks.data ?? [],
    issues: issues.data ?? [],
    entries: entries.data ?? [],
    finance: finance.data ?? [],
    activity: activity.data ?? [],
    phases: phases.data ?? [],
    users: users.data ?? [],
  };
}

// ─── Relationships (Level 1) ──────────────────────────────────────────────────

export async function getRelationships() {
  const supabase = await createSupabaseServerClient();
  const response = await supabase
    .from("relationships")
    .select("*, clients(id, name, status, summary), people(id, name, is_partner)")
    .order("created_at", { ascending: false });
  throwOnError(response.error);
  return response.data ?? [];
}

export async function getRelationshipDetail(relationshipId: string) {
  const supabase = await createSupabaseServerClient();
  const relationshipResult = await supabase
    .from("relationships")
    .select("*, clients(id, name, status, summary, website_url), people(id, name, email, phone, is_partner)")
    .eq("id", relationshipId)
    .maybeSingle();
  throwOnError(relationshipResult.error);
  const relationship = relationshipResult.data;
  if (!relationship) return { relationship: null, projects: [] };

  const projects = await supabase
    .from("projects")
    .select("id, name, code, status, target_date, summary, updated_at")
    .eq("client_id", relationship.client_id)
    .order("updated_at", { ascending: false });
  throwOnError(projects.error);

  return { relationship, projects: projects.data ?? [] };
}

export async function getClientDetail(clientId: string) {
  const supabase = await createSupabaseServerClient();
  const [client, contacts, projects, conversations, people, relationships] = await Promise.all([
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
    supabase.from("people").select("id, name, is_partner").is("archived_at", null).order("name"),
    supabase
      .from("relationships")
      .select("*, people(id, name, is_partner)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);
  [client, contacts, projects, conversations, people, relationships].forEach((r) => throwOnError(r.error));
  return {
    client: client.data,
    contacts: contacts.data ?? [],
    projects: projects.data ?? [],
    conversations: conversations.data ?? [],
    people: people.data ?? [],
    relationships: relationships.data ?? [],
  };
}

export async function getInboxData() {
  const supabase = await createSupabaseServerClient();
  const [messages, entries] = await Promise.all([
    supabase
      .from("messages")
      .select("id, body_md, sent_at, conversation_id, conversations(title, project_id, clients(name))")
      .eq("triage_state", "inbox")
      .order("sent_at", { ascending: false })
      .limit(100),
    supabase
      .from("entries")
      .select("id, title, type, body_md, occurred_at, project_id, decision_outcome, projects(name)")
      .eq("triage_state", "inbox")
      .order("occurred_at", { ascending: false })
      .limit(100),
  ]);
  [messages, entries].forEach((r) => throwOnError(r.error));
  return { messages: messages.data ?? [], entries: entries.data ?? [] };
}

export async function getPersonDetail(personId: string) {
  const supabase = await createSupabaseServerClient();
  const [person, participations, clientLinks, conversations, relationships] = await Promise.all([
    supabase.from("people").select("*").eq("id", personId).maybeSingle(),
    supabase
      .from("project_participants")
      .select("role, role_label, financial_arrangement, financial_value, currency_code, projects(id, name, status, code, clients(name))")
      .eq("person_id", personId)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_people")
      .select("role_label, is_primary, clients(id, name, status)")
      .eq("person_id", personId)
      .order("created_at", { ascending: false }),
    supabase
      .from("conversation_participants")
      .select("conversations(id, title, channel, project_id, last_message_at)")
      .eq("person_id", personId)
      .is("left_at", null)
      .order("conversations(last_message_at)", { ascending: false }),
    supabase
      .from("relationships")
      .select("id, source, status, summary, financial_arrangement, referral_commission, commission_currency, clients(id, name, status)")
      .eq("person_id", personId)
      .order("created_at", { ascending: false }),
  ]);
  [person, participations, clientLinks, conversations, relationships].forEach((r) => throwOnError(r.error));
  return {
    person: person.data,
    participations: participations.data ?? [],
    clientLinks: clientLinks.data ?? [],
    conversations: conversations.data ?? [],
    relationships: relationships.data ?? [],
  };
}

export async function searchRecords(query: string) {  if (!query.trim()) return { entries: [], messages: [], projects: [], people: [] };
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

// Options for the AI Capture page. Not cached — the form should always show
// the current project/phase catalog the moment a capture starts.
export async function getCaptureFormOptions() {
  const supabase = await createSupabaseServerClient();
  const [projects, phases, clients, people, models, template] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, clients(id, name)")
      .in("status", ["active", "paused"])
      .order("name"),
    supabase
      .from("phases")
      .select("id, project_id, name, position, status")
      .order("position"),
    supabase.from("clients").select("id, name").neq("status", "archived").order("name"),
    supabase.from("people").select("id, name").is("archived_at", null).order("name"),
    getActiveModels(),
    getTemplateBySlug("capture-analyze"),
  ]);
  [projects, phases, clients, people].forEach((r) => throwOnError(r.error));

  return {
    projects: (projects.data ?? []).map((p) => ({
      id: String(p.id),
      name: String(p.name),
      client: String((p.clients as { name?: unknown } | null | undefined)?.name ?? "") || null,
      phases: (phases.data ?? [])
        .filter((ph) => ph.project_id === p.id)
        .map((ph) => ({
          id: String(ph.id),
          name: String(ph.name),
          position: Number(ph.position),
          status: String(ph.status),
        })),
    })),
    clients: (clients.data ?? []).map((c) => ({ id: String(c.id), name: String(c.name) })),
    people: (people.data ?? []).map((p) => ({ id: String(p.id), name: String(p.name) })),
    models: models.map((m) => ({ id: m.model_id, provider: m.provider, display_name: m.display_name })),
    default_model: template?.active.default_model ?? "",
  };
}
