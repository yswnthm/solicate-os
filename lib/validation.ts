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
  kind: z.enum(["business", "individual"]),
  website_url: optUrl,
  summary: z.string().trim(),
});

export const personSchema = z.object({
  name: req("Name is required."),
  kind: z.enum(["business", "individual"]).optional(),
  email: optEmail,
  phone: optString,
  website_url: optUrl,
  organization_id: optUuid,
  is_partner: z.boolean(),
  summary: z.string().trim(),
});

export const projectSchema = z
  .object({
    person_id: z.string().uuid("Choose a client."),
    name: req("Project name is required."),
    code: optString,
    summary: z.string().trim(),
    status: z.enum(["active", "paused", "completed", "archived"]),
    started_on: optDate,
    target_date: optDate,
    objective: z.string().trim(),
    success_definition: z.string().trim(),
    direction: z.string().trim(),
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
    scope_deliverables: z.string().trim(),
    scope_requirements: z.string().trim(),
    scope_acceptance: z.string().trim(),
    proposal_quotation: z.string().trim(),
    proposal_pricing: z.string().trim(),
    proposal_revisions: z.string().trim(),
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


export const entrySchema = z
  .object({
    project_id: optUuid,
    phase_id: optUuid,
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
export type EntryInput = z.infer<typeof entrySchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;

// ─── Relationships (Level 1) ────────────────────────────────────────────────

const optMode = z
  .union([
    z.enum(["solicate_leads", "partner_leads", "shared", "advisory_only"]),
    z.literal(""),
    z.null(),
    z.undefined(),
  ])
  .transform((v) => (v === "" || v === undefined ? null : v));

export const relationshipSchema = z
  .object({
    client_id: z.string().uuid(),
    person_id: optUuid,
    type: z.enum(["client", "lead", "partner", "team", "internal"]),
    source: z.enum(["referral_partner", "direct_outreach", "existing_client", "marketplace", "internal"]),
    status: z.enum(["active", "inactive", "archived"]),
    summary: z.string().trim(),
    communication_mode: optMode,
    financial_arrangement: z.enum([
      "none",
      "referral_commission",
      "revenue_share",
      "delivery_split",
      "fixed_fee",
    ]),
    referral_commission: optNumber,
    commission_currency: optString,
    payment_status: z.enum(["not_applicable", "pending", "partially_paid", "paid", "disputed"]),
    terms_note: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.referral_commission !== null && data.referral_commission < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["referral_commission"],
        message: "Commission can't be negative.",
      });
    }
    if (data.financial_arrangement === "fixed_fee" && !data.commission_currency) {
      ctx.addIssue({
        code: "custom",
        path: ["commission_currency"],
        message: "Fixed-fee arrangements need a currency code.",
      });
    }
  });

// ─── Finance items (invoices / payments / expenses) ─────────────────────────

// ─── Finance Ledger ───────────────────────────────────────────────────────────

export const transactionSchema = z.object({
  type: z.enum(["income", "expense", "transfer", "refund", "adjustment"]),
  amount: z.coerce.number().positive("Enter an amount greater than zero.").finite(),
  currency_code: z.string().trim().default("INR"),
  transaction_date: optDate,
  status: z.enum(["planned", "pending", "completed", "cancelled"]).optional(),
  invoice_status: z.enum(["preparing", "sent", "cleared"]).nullable().optional(),
  invoice_date: optDate,
  invoice_sent_at: optDate,
  invoice_cleared_at: optDate,
  invoice_number: z.string().trim().optional(),
  category_id: optUuid,
  payment_method_id: optUuid,
  from_person_id: optUuid,
  from_user_id: optUuid,
  to_person_id: optUuid,
  to_user_id: optUuid,
  reference_number: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const allocationSchema = z.object({
  transaction_id: z.string().uuid(),
  target: z.enum(["project", "phase", "overhead"]).default("project"),
  project_id: optUuid,
  phase_id: optUuid,
  amount: z.coerce.number().positive("Enter an amount greater than zero.").finite(),
  notes: z.string().trim().optional(),
});

export const financeCategorySchema = z.object({
  name: req("Category name is required."),
  transaction_type: z.enum(["income", "expense"]),
  position: z.coerce.number().int().min(1).optional(),
});

export const paymentMethodSchema = z.object({
  name: req("Payment method name is required."),
  is_default: z.boolean().optional(),
});

export type RelationshipInput = z.infer<typeof relationshipSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type AllocationInput = z.infer<typeof allocationSchema>;
