-- 0012: AI framework seed — model catalog + editable templates.
-- Idempotent (ON CONFLICT DO NOTHING), like the import migrations.
-- created_by_id resolves to the first active internal app_user.
--
-- Migrated templates (inbox-triage, inbox-triage-batch, weekly-summary,
-- morning-brief, week-in-review) carry the prompts that previously lived in
-- lib/ai.ts verbatim, so the rewire is behavior-identical.

do $guard$
begin
  if not exists (select 1 from public.app_users where is_active = true) then
    raise exception 'No active app_user exists. Sign in to the app once so the auth trigger creates your app_users row, then re-run.';
  end if;
end $guard$;

-- ─── Models ──────────────────────────────────────────────────────────────────

insert into public.ai_models (provider, model_id, display_name, description, is_active, sort_order, created_by_id) values
  ('groq', 'llama-3.3-70b-versatile', 'Llama 3.3 70B Versatile', 'Strong instruction following across tasks. Default.', true, 1, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('groq', 'openai/gpt-oss-120b', 'GPT OSS 120B', 'OpenAI flagship open-weight model with reasoning.', true, 2, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('groq', 'openai/gpt-oss-20b', 'GPT OSS 20B', 'Very fast, cheap generalist for high volume.', true, 3, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('groq', 'llama-3.1-8b-instant', 'Llama 3.1 8B Instant', 'Fastest text tier for high-volume drafting.', true, 4, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('gemini', 'gemini-3.6-flash', 'Gemini 3.6 Flash', 'Latest stable — balances speed with intelligence.', true, 5, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('gemini', 'gemini-2.5-flash', 'Gemini 2.5 Flash', 'Best price-performance for low-latency tasks.', true, 6, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('gemini', 'gemini-2.5-pro', 'Gemini 2.5 Pro', 'Most advanced reasoning for complex tasks.', true, 7, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('gemini', 'gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite', 'Fastest, most cost-effective 3.5 tier.', true, 8, (select id from public.app_users where is_active = true order by created_at limit 1))
on conflict (provider, model_id) do nothing;

-- ─── Templates ───────────────────────────────────────────────────────────────

insert into public.ai_templates (id, slug, name, description, current_version, is_active, created_by_id) values
  ('9a000000-0000-4000-8000-000000000001', 'message-drafter', 'Message Drafter', 'Draft a ready-to-send message using the complete project memory. Returns only the message.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000002', 'inbox-triage', 'Inbox Triage', 'Turn one raw inbox item into a clean, filed project record.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000003', 'inbox-triage-batch', 'Inbox Triage (Batch)', 'Turn every inbox item into a filed project record in one pass.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000004', 'weekly-summary', 'Weekly Summary', 'Client-facing weekly update from the last 7 days of project activity.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000005', 'morning-brief', 'Morning Brief', 'Chief-of-staff day brief from dashboard data.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000006', 'week-in-review', 'Week in Review', 'Agency-wide review of the last 7 days across every project.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000007', 'proposal-writer', 'Proposal Writer', 'Draft a client proposal from scope, proposal, and finance context.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000008', 'meeting-summary', 'Meeting Summary', 'Summarize meeting notes into concise outcomes and actions.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000009', 'decision-analyzer', 'Decision Analyzer', 'Analyze a decision with context, options, and risk.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000010', 'phase-summary', 'Phase Summary', 'Summarize a phase: scope, progress, decisions, and next steps.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1)),
  ('9a000000-0000-4000-8000-000000000011', 'project-summary', 'Project Summary', 'Summarize a project for a stakeholder or a fresh start.', 1, true, (select id from public.app_users where is_active = true order by created_at limit 1))
on conflict (id) do nothing;

-- ─── Message Drafter ─────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, config, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000001', 1, 'Message Drafter', 'Draft a ready-to-send message using the complete project memory. Returns only the message.',
  $str$You are the communications assistant for a solo agency operating system called Solicate OS.

Your job: draft ONE ready-to-send message from the operator to a specific person, using the complete project memory provided.

You will receive a JSON payload with two keys:
- context: the project memory package — project, phases, selected phase (if any), recipient, conversation history, decisions, tasks, issues, milestones, notes, documents, meetings, and financials.
- operator: the operator's intent, the desired length, the communication styles to use, the flow and direction for the message, and any additional context the operator supplied.

Rules:
- Write exactly one message. Return it as JSON ONLY: {"message": "..."}
- Return only the final message text. No reasoning, no analysis, no explanation, no preamble.
- First person, in the operator's voice. Never introduce yourself or mention that this was drafted.
- Ground every claim in the context. Never invent facts, dates, amounts, numbers, or statuses not present in context.
- Follow the intent precisely. Do not add topics the operator did not ask about.
- Honor the requested length and every selected communication style. Follow operator.direction as the message flow — the order in which points appear and how the message progresses. When operator.additional_context states something, treat it as ground truth.
- Plain conversational text. No markdown, no bullet lists, no headers, no signatures.

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only the final message","No reasoning","No markdown","No explanation","Never invent facts outside the context","Write in the operator''s first-person voice"]',
  '["project","phase","person","messages","decisions","tasks","issues","milestones","notes","documents","meetings","financials"]',
  '["project","person","phase","intent","length","styles","additional_context","direction","model"]',
  '{"lengths":[{"id":"very_short","label":"Very Short","hint":"1-2 sentences, under 25 words"},{"id":"short","label":"Short","hint":"2-3 sentences, under 50 words"},{"id":"medium","label":"Medium","hint":"3-5 sentences, under 100 words"},{"id":"detailed","label":"Detailed","hint":"5-8 sentences, under 200 words"},{"id":"very_detailed","label":"Very Detailed","hint":"8+ sentences, 200+ words"}],"styles":["Professional","Friendly","Casual","Direct","Persuasive","Appreciative","Reassuring","Confident","Apologetic","Excited"]}',
  'json_field', 'message', 2048, 0.4, 'Initial version.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Inbox Triage ────────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000002', 1, 'Inbox Triage', 'Turn one raw inbox item into a clean, filed project record.',
  $str$You are the intake analyst for a solo agency operations system called Solicate OS.

The user captures thoughts and client messages into an inbox. Your job is to turn one raw item into a clean, filed project record the operator will approve.

Given the raw item and the list of active projects, return JSON ONLY with these fields:
- title: a concrete, imperative-or-descriptive summary under 12 words.
- type: one of note, meeting, decision, document, update, milestone, capture.
- project_id: the single best-matching project id, or null if none fits. Prefer null over a weak match.
- body_md: a 2-5 sentence first-person summary: what happened, what it implies, and the next action. No markdown headers, no intro phrases like "Here is the summary".

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","No commentary"]',
  '["projects","inbox"]',
  '["item","projects"]',
  'json_field', '', 1024, 0.3, 'Migrated from lib/ai.ts verbatim.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000003', 1, 'Inbox Triage (Batch)', 'Turn every inbox item into a filed project record in one pass.',
  $str$You are the intake analyst for a solo agency operations system called Solicate OS.

Given a list of raw inbox items (each with an id) and the list of active projects, draft a filed project record for EACH item.

Return JSON ONLY shaped like: { "drafts": [ { "id": "<the item id>", "title": "...", "type": "note|meeting|decision|document|update|milestone|capture", "project_id": "<matching project id or null>", "body_md": "2-5 sentence first-person summary" } ] }

Rules:
- Draft exactly one entry per provided item, keeping the same id.
- Prefer null project_id over a weak match.
- Body in first-person operator voice: what happened, what it implies, next action. No markdown headers.

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","No commentary","One draft per item"]',
  '["projects","inbox"]',
  '["items","projects"]',
  'json_field', 'drafts', 2048, 0.3, 'Migrated from lib/ai.ts verbatim.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Weekly Summary ──────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000004', 1, 'Weekly Summary', 'Client-facing weekly update from the last 7 days of project activity.',
  $str$You are the delivery lead for a solo agency operating system. Draft a concise client-facing weekly update in first person ("I", "we" avoided, "I" only for the operator).

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

Respond with JSON ONLY shaped like: { "summary": "<the markdown>" }$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","80-140 words","No invented facts"]',
  '["project","entries","tasks","issues","messages","activity"]',
  '["project"]',
  'json_field', 'summary', 1024, 0.4, 'Migrated from lib/ai.ts verbatim.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Morning Brief ───────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000005', 1, 'Morning Brief', 'Chief-of-staff day brief from dashboard data.',
  $str$You are the chief-of-staff for a solo agency operator. Draft a short morning brief so they can plan the day.

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

Respond with JSON ONLY shaped like: { "brief": "<the markdown>" }$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","120-180 words","No invented facts"]',
  '["tasks","issues","inbox","project"]',
  '["user"]',
  'json_field', 'brief', 1024, 0.4, 'Migrated from lib/ai.ts verbatim.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Week in Review ──────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000006', 1, 'Week in Review', 'Agency-wide review of the last 7 days across every project.',
  $str$You are the chief-of-staff for a solo agency owner. Draft an agency-wide week-in-review in first person ("I").

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

Respond with JSON ONLY shaped like: { "review": "<the markdown>" }$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","150-220 words","No invented facts"]',
  '["projects","entries","tasks","issues","messages"]',
  '[]',
  'json_field', 'review', 2048, 0.4, 'Migrated from lib/ai.ts verbatim.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Proposal Writer ─────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000007', 1, 'Proposal Writer', 'Draft a client proposal from scope, proposal, and finance context.',
  $str$You are the proposals lead for a solo agency operating system called Solicate OS.

Given the project, phase scope (deliverables, requirements, acceptance criteria), the phase proposal (quotation, pricing, revisions), and financial history, draft a client-facing proposal in first person.

Rules:
- Return JSON ONLY shaped like: {"proposal": "<the proposal in markdown>"}
- Sections: What we will deliver, Scope & inclusions, Investment, Timeline, Next steps.
- Ground every number in the provided finance/quote context. Never invent pricing.
- Professional, concise, no fluff.

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","Never invent pricing","Professional tone"]',
  '["project","phase","financials"]',
  '["project","phase"]',
  'json_field', 'proposal', 2048, 0.4, 'Initial version.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Meeting Summary ─────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000008', 1, 'Meeting Summary', 'Summarize meeting notes into concise outcomes and actions.',
  $str$You are the meeting scribe for a solo agency operating system.

Given the meeting records and surrounding project context, produce a clean meeting summary.

Rules:
- Return JSON ONLY shaped like: {"summary": "<the markdown summary>"}
- Sections: What was covered, Decisions, Action items (with owner if inferable).
- First person ("I") when the operator acted. Concrete, no filler.

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","Concrete, no filler"]',
  '["project","entries","decisions","tasks"]',
  '["project","phase"]',
  'json_field', 'summary', 1024, 0.4, 'Initial version.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Decision Analyzer ───────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000009', 1, 'Decision Analyzer', 'Analyze a decision with context, options, and risk.',
  $str$You are the decision analyst for a solo agency operating system.

Given a decision in question plus the surrounding project context, analyze it.

Rules:
- Return JSON ONLY shaped like: {"analysis": "<the markdown analysis>"}
- Sections: The decision, Context & constraints, Options, Recommendation, Risks.
- Ground in the provided context. Flag unknowns explicitly instead of guessing.
- Concise and direct.

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","Flag unknowns explicitly"]',
  '["project","decisions","issues","financials"]',
  '["project","decision"]',
  'json_field', 'analysis', 1024, 0.3, 'Initial version.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Phase Summary ───────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000010', 1, 'Phase Summary', 'Summarize a phase: scope, progress, decisions, and next steps.',
  $str$You are the delivery lead for a solo agency operating system.

Given a phase (scope, proposal, tasks, issues, records, finance), write a phase summary.

Rules:
- Return JSON ONLY shaped like: {"summary": "<the markdown summary>"}
- Sections: Phase status, What was done, Decisions, Blockers, Remaining work.
- Reference real titles. Never invent facts not in the data.

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","Reference real titles","No invented facts"]',
  '["project","phase","tasks","issues","entries","decisions","financials"]',
  '["project","phase"]',
  'json_field', 'summary', 1024, 0.4, 'Initial version.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

-- ─── Project Summary ─────────────────────────────────────────────────────────

insert into public.ai_template_versions (template_id, version, name, description, system_prompt, default_model, output_rules, context_sources, enabled_variables, response_format, output_field, max_tokens, temperature, change_note, created_by_id) values
(
  '9a000000-0000-4000-8000-000000000011', 1, 'Project Summary', 'Summarize a project for a stakeholder or a fresh start.',
  $str$You are the delivery lead for a solo agency operating system.

Given a project's full context (strategy, phases, tasks, issues, decisions, records, finance), write a project summary.

Rules:
- Return JSON ONLY shaped like: {"summary": "<the markdown summary>"}
- Sections: What this project is, Where we are, Decisions so far, Blockers, Next steps.
- Reference real titles. Never invent facts not in the data.

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","Reference real titles","No invented facts"]',
  '["project","phase","tasks","issues","entries","decisions","financials","messages"]',
  '["project"]',
  'json_field', 'summary', 2048, 0.4, 'Initial version.', (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;
