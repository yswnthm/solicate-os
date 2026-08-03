import { z } from "zod";

// The discriminated union of every action the capture AI may propose. Field
// rules mirror lib/validation.ts so a valid action is a valid mutation. This
// schema is the hard safety net between the model's JSON and the operator's
// review — if an action doesn't parse, it is surfaced to the reviewer, never
// silently dropped or applied.

// Reference fields may be a real uuid OR a cross-action reference like
// "action:<localId>" which the executor resolves once earlier actions run.
const ref = z
  .string()
  .trim()
  .min(1)
  .refine(
    (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) || /^action:/i.test(v),
    "Reference must be a project id or a cross-action reference.",
  );

const reqText = z.string().trim().min(1);
const optText = z
  .string()
  .nullish()
  .transform((v) => (typeof v === "string" ? v.trim() : null))
  .transform((v) => (v === "" ? null : v));
const optDate = z
  .string()
  .nullish()
  .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null));
const optRef = z
  .string()
  .nullish()
  .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) || /^action:/i.test(v));

const actionBase = z.object({
  kind: z.enum([
    "client.create",
    "project.create",
    "project.update_status",
    "project.update",
    "phase.create",
    "phase.complete",
    "phase.pause",
    "phase.update",
    "task.create",
    "task.complete",
    "task.update_priority",
    "issue.create",
    "issue.resolve",
    "entry.create",
    "decision.supersede",
    "finance.invoice",
    "finance.payment",
    "finance.mark_paid",
    "communication.draft",
  ]),
  label: reqText,
  summary: reqText,
  project_id: optRef,
  phase_id: optRef,
  person_id: optRef,
  ref_id: optRef,
});

const clientCreate = z.object({
  kind: z.literal("client.create"),
  payload: z.object({
    name: reqText,
    kind: z.enum(["business", "person"]),
    status: z.enum(["active", "inactive", "archived"]).optional(),
    website_url: optText,
    summary: optText,
  }),
});

const projectCreate = z.object({
  kind: z.literal("project.create"),
  payload: z.object({
    client_id: ref,
    name: reqText,
    code: optText,
    summary: optText,
    status: z.enum(["active", "paused", "completed", "archived"]).optional(),
    started_on: optDate,
    target_date: optDate,
    objective: optText,
    success_definition: optText,
    direction: optText,
  }),
});

const projectUpdateStatus = z.object({
  kind: z.literal("project.update_status"),
  payload: z.object({
    status: z.enum(["active", "paused", "completed", "archived"]),
  }),
});

const projectUpdate = z.object({
  kind: z.literal("project.update"),
  payload: z.object({
    name: optText,
    code: optText,
    summary: optText,
    status: z.enum(["active", "paused", "completed", "archived"]).optional(),
    started_on: optDate,
    target_date: optDate,
    objective: optText,
    success_definition: optText,
    direction: optText,
  }),
});

const phaseCreate = z.object({
  kind: z.literal("phase.create"),
  payload: z.object({
    name: reqText,
    description: optText,
    position: z.coerce.number().int().min(1).optional(),
    status: z.enum(["planned", "active", "on_hold", "completed", "cancelled"]).optional(),
    started_on: optDate,
    target_date: optDate,
  }),
});

const phaseStatus = z.object({
  kind: z.enum(["phase.complete", "phase.pause"]),
  payload: z.object({
    started_on: optDate,
    completed_on: optDate,
  }),
});

const phaseUpdate = z.object({
  kind: z.literal("phase.update"),
  payload: z.object({
    name: optText,
    description: optText,
    started_on: optDate,
    target_date: optDate,
    status: z.enum(["planned", "active", "on_hold", "completed", "cancelled"]).optional(),
  }),
});

const taskCreate = z.object({
  kind: z.literal("task.create"),
  payload: z.object({
    title: reqText,
    description_md: optText,
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    status: z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]).optional(),
    due_at: optDate,
  }),
});

const taskComplete = z.object({
  kind: z.literal("task.complete"),
  payload: z.object({
    completed_at: optDate,
  }),
});

const taskUpdatePriority = z.object({
  kind: z.literal("task.update_priority"),
  payload: z.object({
    priority: z.enum(["low", "normal", "high", "urgent"]),
  }),
});

const issueCreate = z.object({
  kind: z.literal("issue.create"),
  payload: z.object({
    title: reqText,
    description_md: optText,
    severity: z.enum(["low", "medium", "high", "critical"]).optional(),
    status: z.enum(["open", "investigating", "waiting_external", "resolved", "accepted", "closed"]).optional(),
  }),
});

const issueResolve = z.object({
  kind: z.literal("issue.resolve"),
  payload: z.object({
    resolution_summary: reqText,
    status: z.enum(["resolved", "accepted", "closed"]).optional(),
  }),
});

const entryCreate = z.object({
  kind: z.literal("entry.create"),
  payload: z.object({
    title: reqText,
    type: z.enum(["note", "meeting", "decision", "document", "update", "milestone", "capture"]),
    body_md: optText,
    occurred_at: optDate,
    decision_outcome: optText,
  }),
});

const decisionSupersede = z.object({
  kind: z.literal("decision.supersede"),
  payload: z.object({
    superseded_at: optDate,
  }),
});

const financeInvoice = z.object({
  kind: z.literal("finance.invoice"),
  payload: z.object({
    title: reqText,
    amount: z.coerce.number().positive().finite(),
    currency_code: optText,
    occurred_on: optDate,
    notes: optText,
  }),
});

const financePayment = z.object({
  kind: z.literal("finance.payment"),
  payload: z.object({
    title: reqText,
    amount: z.coerce.number().positive().finite(),
    currency_code: optText,
    occurred_on: optDate,
    notes: optText,
  }),
});

const financeMarkPaid = z.object({
  kind: z.literal("finance.mark_paid"),
  payload: z.object({
    payment_status: z.enum(["pending", "partial", "paid"]).optional(),
    paid_at: optDate,
  }),
});

const communicationDraft = z.object({
  kind: z.literal("communication.draft"),
  payload: z.object({
    content: reqText,
    intent: reqText,
    length_label: z.enum(["very_short", "short", "medium", "detailed"]).optional(),
    styles: z.array(z.string().trim().min(1)).optional(),
  }),
});

const actions = [
  actionBase.merge(clientCreate),
  actionBase.merge(projectCreate),
  actionBase.merge(projectUpdateStatus),
  actionBase.merge(projectUpdate),
  actionBase.merge(phaseCreate),
  actionBase.merge(phaseStatus),
  actionBase.merge(phaseUpdate),
  actionBase.merge(taskCreate),
  actionBase.merge(taskComplete),
  actionBase.merge(taskUpdatePriority),
  actionBase.merge(issueCreate),
  actionBase.merge(issueResolve),
  actionBase.merge(entryCreate),
  actionBase.merge(decisionSupersede),
  actionBase.merge(financeInvoice),
  actionBase.merge(financePayment),
  actionBase.merge(financeMarkPaid),
  actionBase.merge(communicationDraft),
] as const;

// Spreading the const tuple keeps each variant's literal kind + payload type,
// so z.infer preserves per-kind narrowing for the executor's switch.
const actionSchema = z.discriminatedUnion("kind", [...actions]);

export type CaptureAction = z.infer<typeof actionSchema>;
export type ActionKind = CaptureAction["kind"];

/**
 * Validate model output. Actions that fail parsing are returned separately so
 * the caller can surface them to the operator (a bad action is never dropped).
 */
export function validateActions(input: unknown): { valid: CaptureAction[]; invalid: unknown[] } {
  if (!Array.isArray(input)) return { valid: [], invalid: [] };
  const valid: CaptureAction[] = [];
  const invalid: unknown[] = [];
  for (const item of input) {
    const parsed = actionSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
    else invalid.push(item);
  }
  return { valid, invalid };
}

export { actionSchema };
