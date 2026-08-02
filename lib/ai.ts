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

async function chatJSON<Schema extends z.ZodTypeAny>(
  system: string,
  user: unknown,
  schema: Schema,
  maxTokens = 1024,
): Promise<z.infer<Schema>> {
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
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) },
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

  const parsed = schema.safeParse(JSON.parse(content));
  if (!parsed.success) throw new Error("AI draft failed validation.");

  return parsed.data;
}

const TRIAGE_SYSTEM = `You are the intake analyst for a solo agency operations system called Solicate OS.

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
  return chatJSON(
    TRIAGE_SYSTEM,
    {
      raw_item: rawItem,
      projects: projects.map((p) => ({ id: p.id, name: p.name, client: p.client ?? null })),
    },
    triageDraftSchema,
  );
}

const BATCH_SYSTEM = `You are the intake analyst for a solo agency operations system called Solicate OS.

Given a list of raw inbox items (each with an id) and the list of active projects, draft a filed project record for EACH item.

Return JSON ONLY shaped like: { "drafts": [ { "id": "<the item id>", "title": "...", "type": "note|meeting|decision|document|update|milestone|capture", "project_id": "<matching project id or null>", "body_md": "2-5 sentence first-person summary" } ] }

Rules:
- Draft exactly one entry per provided item, keeping the same id.
- Prefer null project_id over a weak match.
- Body in first-person operator voice: what happened, what it implies, next action. No markdown headers.

Respond with only valid JSON. No commentary.`;

const batchDraftsSchema = z.object({
  drafts: z.array(triageDraftSchema.extend({ id: z.string() })),
});

export type BatchDraft = z.infer<typeof batchDraftsSchema>["drafts"][number];

export async function draftBatchRecords(
  items: { id: string; kind: string; content: string }[],
  projects: ProjectOption[],
): Promise<BatchDraft[]> {
  const result = await chatJSON(
    BATCH_SYSTEM,
    {
      items: items.map((i) => ({ id: i.id, kind: i.kind, content: i.content })),
      projects: projects.map((p) => ({ id: p.id, name: p.name, client: p.client ?? null })),
    },
    batchDraftsSchema,
    2048,
  );
  const byId = new Map(result.drafts.map((d) => [d.id, d]));
  return items
    .map((i) => byId.get(i.id))
    .filter((d): d is BatchDraft => Boolean(d))
    .map((d) => ({ ...d, project_id: d.project_id || null }));
}

const WEEKLY_SYSTEM = `You are the delivery lead for a solo agency operating system. Draft a concise client-facing weekly update in first person ("I", "we" avoided, "I" only for the operator).

Given the project's past-7-days data, write a markdown summary with these sections:
## What moved
## Decisions & outcomes
## Blockers or risks
## Next week

Rules:
- 80-140 words total. Concrete, specific, no fluff, no "this week was productive".
- Reference real task/entry/issue titles where useful.
- If there are no blockers, say "None." under that heading.
- Do not invent facts not present in the data.

Respond with JSON ONLY shaped like: { "summary": "<the markdown>" }`;

const weeklySummarySchema = z.object({ summary: z.string().trim().min(10) });

export async function draftWeeklySummary(input: {
  projectName: string;
  clientName: string | null;
  entries: string[];
  tasks: string[];
  issues: string[];
  messages: string[];
  activity: string[];
}): Promise<string> {
  const result = await chatJSON(WEEKLY_SYSTEM, input, weeklySummarySchema, 1024);
  return result.summary;
}

const MORNING_SYSTEM = `You are the chief-of-staff for a solo agency operator. Draft a short morning brief so they can plan the day.

Given the current dashboard data, write markdown with these sections:
## Attention first
## Today & this week
## Open risks
## Inbox
## Project pulse

Rules:
- 120-180 words total. First person ("I"). No fluff, no "great news".
- List real task/issue/project titles where useful. Show due dates.
- If a section has nothing, write "None." under its heading.
- End with a single line: "Recommended first action:" followed by one concrete task.
- Do not invent facts not present in the data.

Respond with JSON ONLY shaped like: { "brief": "<the markdown>" }`;

const morningBriefSchema = z.object({ brief: z.string().trim().min(10) });

export async function draftMorningBrief(input: {
  dayLabel: string;
  overdue: string[];
  upcoming: string[];
  issues: string[];
  inboxCount: number;
  inboxTop: string[];
  projectPulse: string[];
}): Promise<string> {
  const result = await chatJSON(MORNING_SYSTEM, input, morningBriefSchema, 1024);
  return result.brief;
}

const WEEK_SYSTEM = `You are the chief-of-staff for a solo agency owner. Draft an agency-wide week-in-review in first person ("I").

Given per-project data for the last 7 days, write markdown with these sections:
## Headline
## What moved (per project)
## Decisions & outcomes
## Blockers / risks
## Momentum

Rules:
- 150-220 words total. Concrete and specific; reference real project/task/issue titles.
- Lead with the single most important thing that happened.
- Group "What moved" by project name as sub-bullets.
- If a section has nothing, write "None." under its heading.
- Do not invent facts not present in the data.

Respond with JSON ONLY shaped like: { "review": "<the markdown>" }`;

const weekReviewSchema = z.object({ review: z.string().trim().min(10) });

export async function draftWeekReview(input: {
  projects: {
    name: string;
    client: string | null;
    status: string;
    doneTasks: string[];
    openIssues: string[];
    entries: string[];
    messages: string[];
  }[];
}): Promise<string> {
  const result = await chatJSON(WEEK_SYSTEM, input, weekReviewSchema, 2048);
  return result.review;
}
