-- 0021: V3 embeddings — semantic memory foundation.
--
-- The bounded snapshots (≤40 recent entries, etc.) can miss older records the
-- current capture/message actually references. V3 adds semantic retrieval:
-- records are chunked, embedded, and stored in semantic_chunks; a capture can
-- then pull the records most SIMILAR to its text even when they are old.
--
-- This migration:
--   1. pgvector extension + semantic_chunks table (hnsw index) + match RPC.
--   2. capture-analyze v4: describes the new semantic_matches context field.
--
-- Embeddings are generated in the app (Gemini text-embedding-004, 768 dims)
-- and stored here. Everything degrades gracefully: when no embedding provider
-- is configured, contexts simply skip semantic retrieval.

-- ─── 1. pgvector ─────────────────────────────────────────────────────────────

create extension if not exists vector with schema extensions;

create table public.semantic_chunks (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('entry', 'message', 'task', 'issue')),
  source_id uuid not null,
  project_id uuid references public.projects(id) on delete cascade,
  chunk_index int not null default 0,
  chunk_text text not null,
  embedding extensions.vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, source_id, chunk_index)
);

create index semantic_chunks_embedding_idx on public.semantic_chunks
  using hnsw (embedding vector_cosine_ops);
create index semantic_chunks_source_idx on public.semantic_chunks(source_type, source_id);
create index semantic_chunks_project_idx on public.semantic_chunks(project_id);

create trigger semantic_chunks_updated_at before update on public.semantic_chunks
  for each row execute function public.set_updated_at();

-- Cosine-similarity matcher. Runs as invoker, so RLS on semantic_chunks applies.
create or replace function public.match_semantic_chunks(
  query_embedding extensions.vector(768),
  match_count int default 8,
  match_project_id uuid default null
) returns table (
  id uuid,
  source_type text,
  source_id uuid,
  project_id uuid,
  chunk_text text,
  similarity float
)
language sql stable set search_path = public as $$
  select c.id, c.source_type, c.source_id, c.project_id, c.chunk_text,
         1 - (c.embedding <=> query_embedding) as similarity
    from public.semantic_chunks c
   where c.embedding is not null
     and (match_project_id is null or c.project_id = match_project_id)
   order by c.embedding <=> query_embedding
   limit match_count;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.semantic_chunks enable row level security;

create policy "active users manage semantic chunks" on public.semantic_chunks
  for all using (public.is_active_internal_user()) with check (public.is_active_internal_user());

-- ─── 2. capture-analyze v4: semantic matches ─────────────────────────────────

insert into public.ai_template_versions (
  template_id, version, name, description, system_prompt,
  default_model, output_rules, context_sources, enabled_variables,
  response_format, output_field, max_tokens, temperature, change_note, created_by_id
) values (
  '9a000000-0000-4000-8000-000000000012', 4,
  'Capture Understanding',
  'Understand a capture, score confidence, and ask the questions needed to remove uncertainty.',
  $str$You are the understanding engine for Solicate OS, a solo agency operating system.

A capture is a natural-language statement of something that happened. Your job is to understand it deeply enough to drive operational updates. You are not storing a note — you are figuring out what changed in reality and what the operating system must reflect.

You will receive a JSON payload:
- capture: the operator's raw statement.
- scope: "existing_project" (the capture belongs to a selected project), "new_project" (this capture starts a brand-new project), or "projectless" (agency-level, not tied to any project).
- context: when scope is existing_project — a RECENT BOUNDED SNAPSHOT of the project (the most recent 40 entries, 60 tasks, 30 open issues, 25 finance items, all phases) PLUS semantic_matches: records retrieved from the archive by similarity to the capture. semantic_matches can include OLDER entries, decisions, tasks, and messages that the recent snapshot misses; each match shows its type, id, and text.
- answers: answers to any earlier clarifying questions. Empty object on the first pass.

First reason silently about what actually happened: what changed, what the operator is asking to happen next, and which parts of the operating system are affected.

Return JSON ONLY shaped like:
{
  "title": "short capture title under 8 words",
  "confidence": 0-100,
  "understanding": "3-6 sentences: what happened, what it implies for the operating system, what the operator wants next",
  "clarifying_questions": [ ... ]
}

CONFIDENCE RULES:
- Confidence 100 only when every fact that would change an action is present: exact statuses, amounts, dates, names, references.
- Drop confidence for each missing fact that would change a proposed action: an unknown amount, an unknown phase, an unknown client, an unknown decision outcome, an ambiguous status.
- The operator prefers a few extra questions over a wrong action. Never silently assume a fact because you are fairly confident — if a missing fact would change an action, ask about it.
- Ask a SEPARATE question for every missing or ambiguous fact that would change an action. Never bundle several facts into one question. A capture typically needs 1-4 questions; ask all of them, not fewer.
- If every fact that could change an action is certain, clarifying_questions may be [].
- Never guess or invent facts. Missing facts mean lower confidence, never assumptions.
- Do NOT ask about records that simply aren't in the snapshot. semantic_matches tells you an older record exists and is relevant; you may reference it, but do not assume details of records you were not shown.
- Use semantic_matches to ground understanding — they are real archive records, not the operator's words.

Each clarifying question:
{
  "id": "q1",
  "question": "plain-language question",
  "options": ["Likely answer", "Another answer", "Other"],
  "allow_other": true
}
- Provide 2-5 plausible options drawn from the domain (statuses, amounts, phases, names). If you truly cannot offer plausible options, use options: ["Other"] with allow_other true.
- Questions must be answerable in one tap or one short typed phrase.
- One question per fact, in priority order.

Ground every sentence of the understanding in the capture and context. Never invent client names, amounts, dates, or statuses.

Respond with only valid JSON. No commentary.$str$,
  'llama-3.3-70b-versatile',
  '["Return only valid JSON","No invented facts","Ask a separate question for every missing fact","A few extra questions beat a wrong action","Do not ask about records absent from the snapshot","Use semantic_matches as real archive evidence"]',
  '["project","phases","tasks","issues","entries","decisions","finance","people","messages","activity"]',
  '["capture","scope","context","answers"]',
  'json_field', '', 1536, 0.2,
  'v4: analyze may now receive semantic_matches — archive records retrieved by similarity to the capture, enabling grounding on older records the recent snapshot misses.',
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (template_id, version) do nothing;

update public.ai_templates set current_version = 4 where id = '9a000000-0000-4000-8000-000000000012';
