import { z } from "zod";

// Zod schemas for the capture-analyze and capture-propose template outputs.
// These are the safety net between the model's JSON and the pipeline state —
// anything that fails parsing goes to the error state for manual handling.

const questionSchema = z.object({
  id: z.string().trim().min(1),
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).max(6),
  allow_other: z.boolean(),
});

// The operator's capture form payload, validated before a session is created.
export const captureInputSchema = z.object({
  scope: z.enum(["existing_project", "new_project", "projectless"]),
  project_id: z.string().uuid().nullable(),
  phase_id: z.string().uuid().nullable(),
  person_id: z.string().uuid().nullable(),
  client_id: z.string().uuid().nullable(),
  new_client_name: z
    .string()
    .nullish()
    .transform((v) => (typeof v === "string" ? v.trim() : null))
    .transform((v) => (v === "" ? null : v)),
  new_phase_name: z
    .string()
    .nullish()
    .transform((v) => (typeof v === "string" ? v.trim() : null))
    .transform((v) => (v === "" ? null : v)),
  text: z.string().trim().min(1, "Describe what happened."),
});

export type CaptureInputParsed = z.infer<typeof captureInputSchema>;

// The model answers confidence on a 0–100 scale (friendlier to LLMs); the
// schema normalizes it to 0–1 for storage and the review UI shows a percentage.
export const captureAnalyzeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  confidence: z.number().min(0).max(100).transform((v) => v / 100),
  understanding: z.string().trim().min(1),
  clarifying_questions: z.array(questionSchema).max(8),
});

export type CaptureAnalyzeOutput = z.infer<typeof captureAnalyzeSchema>;

// The capture-propose template returns a bare actions array (output_field
// "actions" in 0014); each item is validated against the action union in
// actions-schema.ts.
