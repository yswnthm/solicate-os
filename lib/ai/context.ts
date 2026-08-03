import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProjectsForSelect, getInboxData, getProjectWorkspace, getProjects, getTodayData } from "@/features/queries";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// The context retrieval engine. Solicate builds a structured memory package
// automatically — the model never needs the operator to explain context.

// ─── Message Drafter context ─────────────────────────────────────────────────

export interface MessageDraftContext {
  project: Record<string, unknown> | null;
  phases: Record<string, unknown>[];
  phase: Record<string, unknown> | null;
  person: Record<string, unknown> | null;
  messages: Record<string, unknown>[];
  decisions: Record<string, unknown>[];
  tasks: Record<string, unknown>;
  issues: Record<string, unknown>[];
  milestones: Record<string, unknown>[];
  notes: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  meetings: Record<string, unknown>[];
  financials: Record<string, unknown>;
}

const MESSAGE_HISTORY_LIMIT = 40;

export async function getMessageDraftContext(vars: {
  projectId: string;
  personId: string;
  phaseId?: string | null;
}): Promise<MessageDraftContext> {
  const supabase = await createSupabaseServerClient();

  const [project, phases, tasks, issues, entries, finance, person, participant, conversations] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, code, summary, objective, success_definition, direction, status, started_on, target_date, completed_at, clients(id, name)")
      .eq("id", vars.projectId)
      .maybeSingle(),
    supabase
      .from("phases")
      .select("id, name, description, position, status, started_on, target_date, completed_at, scope_deliverables, scope_requirements, scope_acceptance, proposal_quotation, proposal_pricing, proposal_revisions")
      .eq("project_id", vars.projectId)
      .order("position"),
    supabase
      .from("tasks")
      .select("id, title, description_md, status, priority, due_at, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .order("status")
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(120),
    supabase
      .from("issues")
      .select("id, title, description_md, status, severity, resolution_summary, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .order("reported_at", { ascending: false })
      .limit(80),
    supabase
      .from("entries")
      .select("id, title, type, body_md, occurred_at, decision_outcome, decision_state, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .eq("triage_state", "filed")
      .order("occurred_at", { ascending: false })
      .limit(80),
    supabase
      .from("finance_items")
      .select("id, kind, title, amount, currency_code, occurred_on, notes, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .order("occurred_on", { ascending: false })
      .limit(40),
    supabase.from("people").select("id, name, email, phone, is_partner, summary").eq("id", vars.personId).maybeSingle(),
    supabase
      .from("project_participants")
      .select("role, role_label, communication_mode, financial_arrangement, financial_value, currency_code, payment_status, terms_note, is_referral_source")
      .eq("project_id", vars.projectId)
      .eq("person_id", vars.personId)
      .maybeSingle(),
    supabase
      .from("conversations")
      .select("id, title, kind, channel, last_message_at, conversation_participants!inner(person_id)")
      .eq("project_id", vars.projectId)
      .eq("conversation_participants.person_id", vars.personId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(20),
  ]);

  [
    project,
    phases,
    tasks,
    issues,
    entries,
    finance,
    person,
    participant,
    conversations,
  ].forEach((r) => throwOnError(r.error));

  // ── Conversation history with this person on this project ──────────────────
  const conversationIds = (conversations.data ?? []).map((c) => c.id);
  let history: Record<string, unknown>[] = [];
  if (conversationIds.length > 0) {
    const messages = await supabase
      .from("messages")
      .select("id, body_md, sent_at, direction, conversation_id, people(name), app_users!sender_user_id(display_name), conversations(title)")
      .in("conversation_id", conversationIds)
      .order("sent_at", { ascending: false })
      .limit(MESSAGE_HISTORY_LIMIT);
    throwOnError(messages.error);
    history = (messages.data ?? [])
      .slice()
      .reverse()
      .map((m) => ({
        conversation: (m.conversations as unknown as Record<string, unknown> | undefined)?.title ?? "",
        direction: m.direction,
        sender:
          m.direction === "inbound"
            ? (m.people as unknown as Record<string, unknown> | undefined)?.name ?? "contact"
            : (m.app_users as unknown as Record<string, unknown> | undefined)?.display_name ?? "operator",
        body: m.body_md,
        sent_at: m.sent_at,
      }));
  }

  const personRow = person.data;
  const participantRow = participant.data;
  const phaseRow =
    vars.phaseId && (phases.data ?? []).some((p) => p.id === vars.phaseId)
      ? (phases.data ?? []).find((p) => p.id === vars.phaseId) ?? null
      : null;

  const byType = (type: string) =>
    (entries.data ?? [])
      .filter((e) => e.type === type)
      .slice(0, 12)
      .map((e) => ({
        title: e.title,
        body: e.body_md,
        outcome: e.decision_outcome,
        date: e.occurred_at,
        phase: (e.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
      }));

  const financialItems = (finance.data ?? []).map((f) => ({
    kind: f.kind,
    title: f.title,
    amount: Number(f.amount),
    currency: f.currency_code,
    date: f.occurred_on,
    phase: (f.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
  }));

  return {
    project: {
      name: project.data?.name,
      code: project.data?.code,
      status: project.data?.status,
      summary: project.data?.summary,
      objective: project.data?.objective,
      success_definition: project.data?.success_definition,
      direction: project.data?.direction,
      started_on: project.data?.started_on,
      target_date: project.data?.target_date,
      client: (project.data?.clients as Record<string, unknown> | undefined)?.name ?? null,
    },
    phases: (phases.data ?? []).map((p) => ({
      position: p.position,
      name: p.name,
      status: p.status,
      description: p.description,
      started_on: p.started_on,
      target_date: p.target_date,
      deliverables: p.scope_deliverables,
    })),
    phase: phaseRow
      ? {
          name: phaseRow.name,
          status: phaseRow.status,
          description: phaseRow.description,
          started_on: phaseRow.started_on,
          target_date: phaseRow.target_date,
          deliverables: phaseRow.scope_deliverables,
          requirements: phaseRow.scope_requirements,
          acceptance: phaseRow.scope_acceptance,
          proposal_quotation: phaseRow.proposal_quotation,
          proposal_pricing: phaseRow.proposal_pricing,
          proposal_revisions: phaseRow.proposal_revisions,
        }
      : null,
    person: {
      name: personRow?.name,
      email: personRow?.email,
      phone: personRow?.phone,
      is_partner: personRow?.is_partner,
      summary: personRow?.summary,
      role: participantRow?.role_label || participantRow?.role || null,
      communication_mode: participantRow?.communication_mode,
      relationship_note: participantRow?.terms_note,
    },
    messages: history,
    decisions: byType("decision"),
    tasks: {
      open: (tasks.data ?? [])
        .filter((t) => !["done", "cancelled"].includes(t.status))
        .slice(0, 30)
        .map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_at: t.due_at,
          phase: (t.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
        })),
      recently_done: (tasks.data ?? [])
        .filter((t) => t.status === "done")
        .slice(0, 10)
        .map((t) => ({ title: t.title, phase: (t.phases as unknown as Record<string, unknown> | undefined)?.name ?? null })),
    },
    issues: (issues.data ?? [])
      .filter((i) => !["resolved", "accepted", "closed"].includes(i.status))
      .slice(0, 20)
      .map((i) => ({
        title: i.title,
        status: i.status,
        severity: i.severity,
        phase: (i.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
      })),
    milestones: byType("milestone"),
    notes: byType("note"),
    documents: byType("document"),
    meetings: byType("meeting"),
    financials: {
      items: financialItems,
      totals: {
        invoiced: financialItems.filter((f) => f.kind === "invoice").reduce((s, f) => s + f.amount, 0),
        paid: financialItems.filter((f) => f.kind === "payment").reduce((s, f) => s + f.amount, 0),
      },
    },
  };
}

// ─── Migrated feature contexts (identical payloads to the old prompts) ───────

export async function getWeeklySummaryContext(projectId: string) {
  const workspace = await getProjectWorkspace(projectId);
  if (!workspace.project) throw new Error("Project not found.");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recent = (list: any[], key = "occurred_at") =>
    (list ?? [])
      .filter((x: any) => new Date(x[key] ?? 0) >= new Date(weekAgo))
      .map((x: any) => `- ${x.title ?? x.summary ?? ""}`)
      .slice(0, 20);

  return {
    projectName: workspace.project.name,
    clientName: (workspace.project as any).clients?.name ?? null,
    entries: recent(workspace.entries),
    tasks: workspace.tasks
      .filter((t: any) => t.status === "done")
      .slice(0, 20)
      .map((t: any) => `- ${t.title}`),
    issues: workspace.issues
      .filter((i: any) => i.status !== "resolved")
      .slice(0, 10)
      .map((i: any) => `- ${i.title}`),
    messages: recent(workspace.recentMessages, "sent_at").slice(0, 10),
    activity: recent(workspace.activity).slice(0, 20),
  };
}

export async function getMorningBriefContext(userId: string) {
  const data = await getTodayData(userId);
  const inbox = await getInboxData();

  return {
    dayLabel: new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    overdue: data.overdue.slice(0, 8).map((t: any) => `- ${t.title} (due ${new Date(t.due_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`),
    upcoming: data.upcoming.slice(0, 8).map((t: any) => `- ${t.title} (due ${new Date(t.due_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`),
    issues: data.issues.slice(0, 6).map((i: any) => `- ${i.title} [${i.severity}]`),
    inboxCount: inbox.messages.length + inbox.entries.length,
    inboxTop: [...inbox.entries, ...inbox.messages]
      .slice(0, 5)
      .map((x: any) => `- ${x.title ?? x.conversations?.title ?? "message"}`),
    projectPulse: data.changedProjects.slice(0, 5).map((p: any) => `- ${p.name} (${p.status})`),
  };
}

export async function getWeekReviewContext() {
  const projects = await getProjects();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const perProject = await Promise.all(
    projects.map(async (p: any) => {
      const w = await getProjectWorkspace(p.id);
      return {
        name: w.project?.name ?? p.name,
        client: (w.project as any)?.clients?.name ?? null,
        status: w.project?.status ?? p.status,
        doneTasks: w.tasks
          .filter((t: any) => t.status === "done")
          .slice(0, 10)
          .map((t: any) => `- ${t.title}`),
        openIssues: w.issues
          .filter((i: any) => i.status !== "resolved")
          .slice(0, 5)
          .map((i: any) => `- ${i.title}`),
        entries: w.entries
          .filter((e: any) => new Date(e.occurred_at ?? 0) >= new Date(weekAgo))
          .slice(0, 8)
          .map((e: any) => `- ${e.title}`),
        messages: w.recentMessages
          .filter((m: any) => new Date(m.sent_at ?? 0) >= new Date(weekAgo))
          .slice(0, 6)
          .map((m: any) => `- ${m.body_md.slice(0, 80)}`),
      };
    }),
  );
  return { projects: perProject };
}

export async function getInboxItemContext(kindValue: "entry" | "message", itemId: string) {
  const supabase = await createSupabaseServerClient();
  let rawItem: string;
  if (kindValue === "entry") {
    const { data, error } = await supabase
      .from("entries")
      .select("title, body_md")
      .eq("id", itemId)
      .maybeSingle();
    throwOnError(error);
    rawItem = `Capture: ${(data as any)?.title ?? ""}\n${(data as any)?.body_md ?? ""}`;
  } else {
    const { data, error } = await supabase
      .from("messages")
      .select("body_md, conversations(title)")
      .eq("id", itemId)
      .maybeSingle();
    throwOnError(error);
    rawItem = `Message (${(data as any)?.conversations?.title ?? "conversation"}): ${(data as any)?.body_md ?? ""}`;
  }
  return { raw_item: rawItem };
}

export async function getBatchInboxContext() {
  const inbox = await getInboxData();
  const entries = inbox.entries.map((e: any) => ({
    id: e.id,
    kind: "entry",
    content: `Capture: ${e.title ?? ""}\n${e.body_md ?? ""}`,
  }));
  const messages = inbox.messages.map((m: any) => ({
    id: m.id,
    kind: "message",
    content: `Message (${m.conversations?.title ?? "conversation"}): ${m.body_md ?? ""}`,
  }));
  return { items: [...entries, ...messages] };
}

export async function getProjectsForContext() {
  const projects = await getActiveProjectsForSelect();
  return projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    client: p.clients?.name ?? null,
  }));
}
