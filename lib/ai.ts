import { z } from "zod";

// Groq exposes an OpenAI-compatible endpoint. We call it directly so the
// provider can be swapped without adding a heavy SDK dependency.

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export const triageDraftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(["note", "meeting", "decision", "document", "update", "milestone", "capture"]),
  project_id: z.string().uuid().nullable().or(z.literal("")),
  body_md: z.string().trim().min(1),
});

export type TriageDraft = z.infer<typeof triageDraftSchema>;

export type ProjectOption = { id: string; name: string; client?: string | null };

const SYSTEM_PROMPT = `You are the intake analyst for a solo agency operations system called Solicate OS.

The user captures thoughts and client messages into an inbox. Your job is to turn one raw item into a clean, filed project record the operator will approve.

Given the raw item and the list of active projects, return JSON ONLY with these fields:
- title: a concrete, imperative-or-descriptive summary under 12 words.
- type: one of note, meeting, decision, document, update, milestone, capture.
- project_id: the single best-matching project id, or null if none fits. Prefer null over a weak match.
- body_md: a 2-5 sentence first-person summary: what happened, what it implies, and the next action. No markdown headers, no intro phrases like "Here is the summary".

Respond with only valid JSON. No commentary.`;

export async function draftInboxRecord(
  rawItem: string,
  projects: ProjectOption[],
): Promise<TriageDraft> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            raw_item: rawItem,
            projects: projects.map((p) => ({ id: p.id, name: p.name, client: p.client ?? null })),
          }),
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response.");

  const raw = JSON.parse(content);
  const parsed = triageDraftSchema.safeParse(raw);
  if (!parsed.success) throw new Error("AI draft failed validation.");

  return { ...parsed.data, project_id: parsed.data.project_id || null };
}
