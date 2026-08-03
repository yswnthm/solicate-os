import { z } from "zod";

// Zod schemas for AI outputs. Templates stay data-driven; these schemas are the
// safety net that validates the model's JSON before the operator approves it.

export const triageDraftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(["note", "meeting", "decision", "document", "update", "milestone", "capture"]),
  project_id: z.string().uuid().nullable().or(z.literal("")),
  body_md: z.string().trim().min(1),
});

export type TriageDraft = z.infer<typeof triageDraftSchema>;

export const batchDraftsSchema = z.object({
  drafts: z.array(triageDraftSchema.extend({ id: z.string() })),
});

export type BatchDraft = z.infer<typeof batchDraftsSchema>["drafts"][number];

export const weeklySummarySchema = z.object({ summary: z.string().trim().min(10) });
export const morningBriefSchema = z.object({ brief: z.string().trim().min(10) });
export const weekReviewSchema = z.object({ review: z.string().trim().min(10) });

export const messageDraftSchema = z.object({ message: z.string().trim().min(1) });
