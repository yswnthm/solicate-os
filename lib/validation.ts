import { z } from "zod";

// Shared validation for the editing system. Every update action parses its
// input with one of these schemas and returns field-level errors to the modal.

const req = (message: string) => z.string().trim().min(1, message);

// Optional string: "" / null / undefined → null, trimmed otherwise.
const optString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" ? v.trim() : null))
  .transform((v) => (v === "" ? null : v));

const optUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" ? v.trim() : null))
  .refine((v) => v === null || v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Enter a valid URL (https://…).")
  .transform((v) => (v === "" ? null : v));

const optEmail = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" ? v.trim() : null))
  .refine((v) => v === null || v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email.")
  .transform((v) => (v === "" ? null : v));

// Optional date/datetime: "" / null → null, otherwise keep the raw string.
const optDate = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null));

// Optional numeric: "" / null / NaN → null.
const optNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  });

const optUuid = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null))
  .refine((v) => v === null || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v), "Choose a valid option.");

// Dates are ISO date strings; "YYYY-MM-DD" strings compare lexicographically.
const datesConsistent = <T extends { started_on?: string | null; target_date?: string | null }>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  if (data.started_on && data.target_date && data.target_date < data.started_on) {
    ctx.addIssue({
      code: "custom",
      path: ["target_date"],
      message: "Target date can't be before the start date.",
    });
  }
};

export const clientSchema = z.object({
  name: req("Client name is required."),
  kind: z.enum(["business", "person"]),
  status: z.enum(["active", "inactive", "archived"]),
  website_url: optUrl,
  summary: z.string().trim(),
});

export const personSchema = z.object({
  name: req("Name is required."),
  email: optEmail,
  phone: optString,
  is_partner: z.boolean(),
  summary: z.string().trim(),
});

export const projectSchema = z
  .object({
    client_id: z.string().uuid("Choose a client."),
    name: req("Project name is required."),
    code: optString,
    summary: z.string().trim(),
    status: z.enum(["active", "paused", "completed", "archived"]),
    started_on: optDate,
    target_date: optDate,
  })
  .superRefine(datesConsistent);

export const phaseSchema = z
  .object({
    project_id: z.string().uuid(),
    name: req("Phase name is required."),
    description: z.string().trim(),
    position: z.coerce.number().int().min(1, "Position must be at least 1."),
    status: z.enum(["planned", "active", "on_hold", "completed", "cancelled"]),
    started_on: optDate,
    target_date: optDate,
  })
  .superRefine(datesConsistent);

export const taskSchema = z.object({
  project_id: z.string().uuid(),
  title: req("Task title is required."),
  description_md: z.string().trim(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]),
  assignee_id: optUuid,
  due_at: optDate,
  phase_id: optUuid,
});

export const issueSchema = z
  .object({
    project_id: z.string().uuid(),
    title: req("Issue title is required."),
    description_md: z.string().trim(),
    severity: z.enum(["low", "medium", "high", "critical"]),
    status: z.enum(["open", "investigating", "waiting_external", "resolved", "accepted", "closed"]),
    assignee_id: optUuid,
    resolution_summary: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    const closed = ["resolved", "accepted", "closed"].includes(data.status);
    if (closed && !data.resolution_summary) {
      ctx.addIssue({
        code: "custom",
        path: ["resolution_summary"],
        message: "Add a resolution outcome to close this issue.",
      });
    }
  });

export const entrySchema = z
  .object({
    project_id: optUuid,
    title: req("Title is required."),
    type: z.enum(["note", "meeting", "decision", "document", "update", "milestone", "capture"]),
    body_md: z.string().trim(),
    occurred_at: optDate,
    decision_outcome: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "decision" && !data.decision_outcome) {
      ctx.addIssue({
        code: "custom",
        path: ["decision_outcome"],
        message: "A decision record requires an outcome.",
      });
    }
  });

export const conversationSchema = z.object({
  client_id: z.string().uuid(),
  project_id: optUuid,
  title: req("Conversation title is required."),
  kind: z.enum(["direct", "group"]),
  channel: z.enum(["whatsapp", "email", "manual", "other"]),
});

export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  project_id: optUuid,
  body_md: req("Message body is required."),
});

export const participantSchema = z
  .object({
    project_id: z.string().uuid(),
    person_id: z.string().uuid(),
    role: z.enum(["client_contact", "partner", "collaborator"]),
    role_label: z.string().trim(),
    is_referral_source: z.boolean(),
    communication_mode: z
      .union([
        z.enum(["solicate_leads", "partner_leads", "shared", "advisory_only"]),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .transform((v) => (v === "" || v === undefined ? null : v)),
    financial_arrangement: z.enum([
      "none",
      "referral_commission",
      "revenue_share",
      "delivery_split",
      "fixed_fee",
    ]),
    financial_value: optNumber,
    currency_code: optString,
    payment_status: z.enum(["not_applicable", "pending", "partially_paid", "paid", "disputed"]),
    terms_note: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.financial_value !== null && data.financial_value < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["financial_value"],
        message: "Value can't be negative.",
      });
    }
    if (data.financial_arrangement === "fixed_fee" && !data.currency_code) {
      ctx.addIssue({
        code: "custom",
        path: ["currency_code"],
        message: "Fixed-fee arrangements need a currency code.",
      });
    }
  });

export type ClientInput = z.infer<typeof clientSchema>;
export type PersonInput = z.infer<typeof personSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type PhaseInput = z.infer<typeof phaseSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type IssueInput = z.infer<typeof issueSchema>;
export type EntryInput = z.infer<typeof entrySchema>;
export type ConversationInput = z.infer<typeof conversationSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;
