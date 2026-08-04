import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveProjectsForSelect, getInboxData, getProjectWorkspace, getProjects, getTodayData } from "@/features/queries";

function throwOnError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// The context retrieval engine. Solicate builds a structured memory package
// automatically — the model never needs the operator to explain context.

/** Truncate a string to at most maxChars characters. */
function truncate(text: string | null | undefined, maxChars: number): string {
  if (!text) return "";
  return text.length <= maxChars ? text : text.slice(0, maxChars) + "…";
}

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

// Reduced from 40: 25 messages covers all realistic recent threads with a
// person on a project; beyond that is history the model doesn't need.
const MESSAGE_HISTORY_LIMIT = 25;

export async function getMessageDraftContext(vars: {
  projectId: string;
  personId: string;
  phaseId?: string | null;
}): Promise<MessageDraftContext> {
  const supabase = await createSupabaseServerClient();

  // Phases split into two queries: lean fetch for all phases (no scope_*/proposal_*),
  // and a single-row detail fetch for the selected phase only. This avoids shipping
  // scope/proposal text for every phase when the drafter only uses it for one.
  const phaseDetailPromise = vars.phaseId
    ? supabase
        .from("phases")
        .select("id, name, description, position, status, started_on, target_date, completed_at, scope_deliverables, scope_requirements, scope_acceptance, proposal_quotation, proposal_pricing, proposal_revisions")
        .eq("id", vars.phaseId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [project, phases, openTasks, doneTasks, issues, entries, finance, person, participant, conversations, phaseDetail] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, code, summary, objective, success_definition, direction, status, started_on, target_date, completed_at, people!projects_person_id_fkey(id, name)")
      .eq("id", vars.projectId)
      .maybeSingle(),
    supabase
      .from("phases")
      // Lean fetch for all phases — no scope_*/proposal_* fields.
      // The selected phase's detail is fetched separately via phaseDetailPromise.
      .select("id, name, description, position, status, started_on, target_date, completed_at")
      .eq("project_id", vars.projectId)
      .order("position"),
    // Open tasks queried separately from done ones so the done slice can never
    // be silently dropped by a status-ordered limit (see recently_done below).
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_at, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .in("status", ["todo", "in_progress", "blocked"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("tasks")
      .select("id, title, status, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .eq("status", "done")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from("issues")
      .select("id, title, description_md, status, severity, resolution_summary, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .order("reported_at", { ascending: false })
      // Reduced from 80: open issues that matter fit in 30.
      .limit(30),
    supabase
      .from("entries")
      .select("id, title, type, body_md, occurred_at, decision_outcome, decision_state, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .eq("triage_state", "filed")
      .order("occurred_at", { ascending: false })
      // Reduced from 80: 40 entries covers ~4-6 weeks of typical activity.
      .limit(40),
    supabase
      .from("finance_items")
      .select("id, kind, title, amount, currency_code, occurred_on, notes, phase_id, phases(id, name)")
      .eq("project_id", vars.projectId)
      .order("occurred_on", { ascending: false })
      // Reduced from 20: 20 finance items covers all realistic project finances.
      .limit(20),
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
    // Phase detail last — kept separate so the lean phases query above stays clean.
    phaseDetailPromise,
  ]);

  [
    project,
    phases,
    openTasks,
    doneTasks,
    issues,
    entries,
    finance,
    person,
    participant,
    conversations,
    phaseDetail,
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
        // Truncate message bodies: 200 chars is plenty for drafting context.
        body: truncate(m.body_md as string | null, 200),
        sent_at: m.sent_at,
      }));
  }

  const personRow = person.data;
  const participantRow = participant.data;
  // Use the separately-fetched detail row for the selected phase (has scope_*/proposal_*).
  const phaseRow = vars.phaseId ? (phaseDetail.data ?? null) : null;

  // Reduced from 12: 8 entries per type is enough for drafting; beyond that
  // is history the model shouldn't be composing prose about anyway.
  const byType = (type: string) =>
    (entries.data ?? [])
      .filter((e) => e.type === type)
      .slice(0, 8)
      .map((e) => ({
        title: e.title,
        body: truncate(e.body_md as string | null, 200),
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
      client: (project.data?.people as Record<string, unknown> | undefined)?.name ?? null,
    },
    // Lean phase list — no scope_*/proposal_* (those are in the detail fetch below).
    phases: (phases.data ?? []).map((p) => ({
      position: p.position,
      name: p.name,
      status: p.status,
      description: p.description,
      started_on: p.started_on,
      target_date: p.target_date,
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
      // Open tasks come from their own query — the done slice below can never
      // be dropped by a status-ordered limit.
      open: (openTasks.data ?? []).map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_at: t.due_at,
        phase: (t.phases as unknown as Record<string, unknown> | undefined)?.name ?? null,
      })),
      recently_done: (doneTasks.data ?? []).map((t) => ({ title: t.title, phase: (t.phases as unknown as Record<string, unknown> | undefined)?.name ?? null })),
    },
    // Reduced open filter from 20 → 15.
    issues: (issues.data ?? [])
      .filter((i) => !["resolved", "accepted", "closed"].includes(i.status))
      .slice(0, 15)
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
  // weekly-summary only needs recent titles — getProjectWorkspace is fine here
  // since the context builder further filters to 20 items.
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
    clientName: (workspace.project as any).people?.name ?? null,
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

  // H6: constant-cost rebuild. Previously this fetched 5 queries PER project
  // (≈2500 queries at 500 projects). Now it runs a fixed set of GLOBAL queries
  // plus the deterministic rollup views, regardless of how many projects exist.
  const supabase = await createSupabaseServerClient();
  const [
    statusRollup,
    financeRollup,
    decisions,
    doneTasks,
    resolvedIssues,
    openIssues,
    entries,
    messages,
    activity,
  ] = await Promise.all([
    supabase.from("status_rollup").select("project_id, open_tasks, done_tasks, open_issues, resolved_issues, phase_count, active_phases"),
    supabase.from("finance_rollup").select("project_id, invoices_count, invoiced_total, payments_count, paid_total, outstanding"),
    supabase.from("decision_log").select("project_id, title, decision_outcome, occurred_at").gte("occurred_at", weekAgo),
    supabase
      .from("tasks")
      .select("project_id, title")
      .eq("status", "done")
      .gte("completed_at", weekAgo),
    supabase
      .from("issues")
      .select("project_id, title")
      .in("status", ["resolved", "accepted"])
      .gte("resolved_at", weekAgo),
    supabase
      .from("issues")
      .select("project_id, title, severity")
      .not("status", "eq", "resolved")
      .not("status", "eq", "accepted")
      .not("status", "eq", "closed")
      .order("reported_at", { ascending: false }),
    supabase
      .from("entries")
      .select("project_id, title")
      .eq("triage_state", "filed")
      .gte("occurred_at", weekAgo)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("messages")
      .select("body_md, sent_at, conversations!inner(project_id)")
      .gte("sent_at", weekAgo)
      .order("sent_at", { ascending: false })
      .limit(200),
    supabase
      .from("activity_events")
      .select("project_id, record_type, event_type, summary, occurred_at")
      .gte("occurred_at", weekAgo)
      .order("occurred_at", { ascending: false })
      .limit(300),
  ]);

  [
    statusRollup,
    financeRollup,
    decisions,
    doneTasks,
    resolvedIssues,
    openIssues,
    entries,
    messages,
    activity,
  ].forEach((r) => throwOnError(r.error));

  const groupBy = (rows: unknown[], key: string) => {
    const map = new Map<string, unknown[]>();
    for (const row of rows) {
      const k = (row as Record<string, unknown>)[key] as string | null | undefined;
      if (!k) continue;
      const arr = map.get(k) ?? [];
      arr.push(row);
      map.set(k, arr);
    }
    return map;
  };

  const statusBy = groupBy(statusRollup.data ?? [], "project_id");
  const financeBy = groupBy(financeRollup.data ?? [], "project_id");
  const decisionsBy = groupBy(decisions.data ?? [], "project_id");
  const doneBy = groupBy(doneTasks.data ?? [], "project_id");
  const resolvedBy = groupBy(resolvedIssues.data ?? [], "project_id");
  const openBy = groupBy(openIssues.data ?? [], "project_id");
  const entriesBy = groupBy(entries.data ?? [], "project_id");
  const messagesBy = groupBy(messages.data ?? [], "project_id");
  const activityBy = groupBy(activity.data ?? [], "project_id");

  const perProject = projects.map((p: any) => {
    const id = p.id;
    const rollup = (statusBy.get(id)?.[0] ?? {}) as Record<string, unknown>;
    const fin = (financeBy.get(id)?.[0] ?? {}) as Record<string, unknown>;

    return {
      name: p.name,
      client: p.people?.name ?? null,
      status: p.status,
      rollup: {
        open_tasks: rollup.open_tasks ?? 0,
        done_tasks: rollup.done_tasks ?? 0,
        open_issues: rollup.open_issues ?? 0,
        active_phases: rollup.active_phases ?? 0,
      },
      finance:
        fin.invoiced_total != null
          ? { invoiced: fin.invoiced_total, paid: fin.paid_total, outstanding: fin.outstanding }
          : null,
      decisions: (decisionsBy.get(id) ?? [])
        .slice(0, 5)
        .map((d: any) => ({ title: d.title, outcome: d.decision_outcome, date: d.occurred_at })),
      done_tasks: (doneBy.get(id) ?? []).slice(0, 10).map((t: any) => `- ${t.title}`),
      resolved_issues: (resolvedBy.get(id) ?? []).slice(0, 5).map((i: any) => `- ${i.title}`),
      open_issues: (openBy.get(id) ?? [])
        .slice(0, 5)
        .map((i: any) => `- ${i.title} [${i.severity}]`),
      entries: (entriesBy.get(id) ?? []).slice(0, 8).map((e: any) => `- ${e.title}`),
      messages: (messagesBy.get(id) ?? [])
        .slice(0, 6)
        .map((m: any) => `- ${truncate(m.body_md as string | null, 80)}`),
      activity: (activityBy.get(id) ?? [])
        .slice(0, 8)
        .map((a: any) => `- ${a.summary}`),
    };
  });

  return { period: { from: weekAgo, to: new Date().toISOString() }, projects: perProject };
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
    client: p.people?.name ?? null,
  }));
}
