# Handoff Prompt — Audit & optimize token efficiency of the Capture and Message Drafter backends

## Your role
You are a senior backend performance + AI-systems auditor. Investigate, quantify, and IMPROVE the token efficiency of two AI features in this repo (`solicate-os`, a Next.js 15 App Router + Supabase solo-agency operating system): the **Capture** pipeline and the **Message Drafter**. You have full read/write access, `bun` as the package manager, and a linked Supabase project. Capture evidence, propose and implement a concrete plan, and verify it. Do not re-litigate things listed as working. Do not touch credentials.

## TL;DR / Goal
The AI retrieval/prompt layer reaches token-count limits "too easily" and ships giant context payloads to the models. Your job:
1. **Audit** the context retrieval + template prompt system for both features.
2. Quantify the bloat (real limits, query sizes, truncation gaps).
3. **Implement** a plan that reduces input tokens and makes the pipeline efficient — without breaking the operator-approval guarantees (capture) or the drafting UX (message drafter).
4. Verify with `bun run typecheck`, `bun run lint`, `bun run build`, and apply any DB/template changes via a pushed migration.

The operator has specifically been exploring a **"generate an audit, then propose"** design (a handoff stage that condenses retrieved context into a compact, id-preserving digest that the proposer/drafter then consumes instead of the raw workspace) plus **slim retrieval** (bounded, truncation-first queries). You are free to adopt, refine, or reject that exact design based on evidence — but you MUST deliver a measurable reduction in prompt/token size and latency risk.

## Systems under audit

### 1. Capture (natural-language → proposed operational updates)
Flow: `submitCapture` → `createCaptureSession` (files the capture) → `runCaptureAnalysis` (`capture-analyze` template → title/confidence/questions) → clarification loop (`answerClarifications`) → `runCaptureProposal` (`capture-propose` → zod-validated actions) → operator reviews → `approveCaptureActions` executes. Features layered on top (all must keep working): mandatory **update_types** (retry-once when a selected category is missing), **Regenerate** / **Extract more** buttons, **unified model picker**, clarification questions.

Key fact: **both** `capture-analyze` and `capture-propose` currently receive the output of `getCaptureContext`/`getCaptureProposeContext`, which is built on **`getProjectWorkspace`** — the full project dump. See bloat numbers below.

### 2. Message Drafter (write a follow-up message to a person on a project)
`draftMessage` (features/ai-actions.ts) → `buildDrafterVariables` → `prepareTemplate` → `CONTEXT_BUILDERS["message-drafter"]` → **`getMessageDraftContext`** (lib/ai/context.ts), which fetches a heavy per-person/per-project package. `getDraftPrompt` (the "copy to ChatGPT" feature) surfaces the exact prompt via `formatPromptForChat`.

### Other AI surfaces (context only — audit them for consistency, but the two above are the priority)
`weekly-summary`, `week-in-review` (calls `getProjectWorkspace` **per project** — worst multi-project token hog), `morning-brief`, `inbox-triage`, `inbox-triage-batch`, `decision-analyzer`/`meeting-summary`/`phase-summary`/`project-summary`/`proposal-writer` (seeded but have NO `runTemplate` callers today — do not wire them, just note the shared layer should serve them later).

## Known bloat (start here; verify with your own measurements)
- `getProjectWorkspace` (features/queries.ts:190) fetches per project: **up to 200 entries** (full `body_md`), **up to 200 messages** (full `body_md`; `PROJECT_MESSAGE_LIMIT = 200`), **up to 100 messages per conversation** (`CONVERSATION_MESSAGE_LIMIT = 100`), ALL tasks/issues/finance rows (no limits), plus people + app_users catalogs. Used by capture context AND week-in-review × every project.
- `getMessageDraftContext` (lib/ai/context.ts): 120 tasks, 80 issues, 80 entries, 40 finance items, 40-message history, full `scope_*`/`proposal_*` fields for every phase.
- Capture context (`lib/capture/context.ts`) slices AFTER the full fetch (recent_entries ≤40 with body ≤400, decisions ≤20) — so the DB I/O is maximal even when the model only sees part.
- Template `max_tokens` today: `capture-analyze` 1536, `capture-propose` 4096, `message-drafter` 2048. The proposer/drafter INPUT (the workspace dump) is the overflow risk, not the output cap.
- Providers: groq + gemini; template default model `llama-3.3-70b-versatile`.

## Files involved
- **Capture engine/flow**: `lib/capture/engine.ts` (runCaptureAnalysis, runCaptureProposal, regenerate/extract-more, retry-on-missing), `lib/capture/context.ts` (getCaptureContext / getCaptureProposeContext), `lib/capture/schemas.ts`, `lib/capture/types.ts`, `lib/capture/actions-schema.ts`, `lib/capture/update-types.ts`, `lib/capture/execute.ts`, `features/capture-actions.ts`, `components/capture/capture-flow.tsx`.
- **AI runtime**: `lib/ai/executor.ts` (runTemplate / prepareTemplate / formatPromptForChat / CONTEXT_BUILDERS), `lib/ai/index.ts` (provider dispatch, resolveModel), `lib/ai/context.ts` (getMessageDraftContext + weekly/week-review/morning/inbox builders), `lib/ai/template-store.ts` (versioned templates).
- **Message drafter**: `features/ai-actions.ts` (draftMessage, getDraftPrompt, buildDrafterVariables).
- **Data**: `features/queries.ts` (getProjectWorkspace, getPhaseWorkspace, getTodayData, getInboxData), `lib/supabase/server.ts`.
- **Templates (DB-driven, seeded by migrations)**: `supabase/migrations/0011_ai_templates.sql`, `0012_ai_seed.sql`, `0014_capture_framework.sql`, `0015_capture_templates_v2.sql`, `0016_capture_update_types.sql`. Templates live in `ai_templates` + `ai_template_versions`; every edit is a NEW version row + repoint `ai_templates.current_version`.

## Constraints (non-negotiable)
- **Never break the approval gate**: capture writes NOTHING to the operating system until the operator approves. Preserve `capture_sessions`/`capture_actions` semantics, the clarification loop, mandatory update_types, and Regenerate/Extract-more (these all reuse the stored proposal context — if you introduce an audit/handoff stage, Regenerate/Extract-more/retry must reuse the stored audit, not re-fetch).
- **Templates are data, versioned, append-only**: prompt changes = new `ai_template_versions` row + `current_version` bump (mirror the migration pattern in 0015/0016). Never `UPDATE` an existing version's prompt in a migration.
- **New columns/tables require a migration** (e.g. a `capture_sessions.audit jsonb` column if you persist an audit stage). Apply via `supabase db push --linked`.
- Keep the **unified model picker** (`components/model-picker.tsx`, `getModelPickerOptions`) and per-run `modelId` overrides working — any new stage should accept the same `modelId`.
- Keep `message-drafter`'s copy-prompt feature (`getDraftPrompt`) functional. If you make drafting two-stage, the copy path must still yield one coherent paste-able prompt (or a clearly two-step prompt the user can run in one go).
- Do NOT touch credentials, RLS policies, or commit debug instrumentation.
- Do NOT re-verify: repo builds green today (`bun run typecheck`/`lint`/`build` pass), migrations 0001–0016 are applied to the linked DB, templates listed above are active.

## Suggested approach
1. **Measure first**: instrument (temporarily, non-committed) or reason from query limits to state the worst-case and typical input-token estimate per call for `capture-analyze`, `capture-propose`, `message-drafter`, `week-in-review`. Record the numbers.
2. **Retrieval**: build a shared bounded snapshot layer (slim queries + a `truncate()` helper) and swap the heavy builders onto it. Recommended starting caps: entries ≤40 (body ≤300), messages ≤40 (body ≤200), open tasks ≤40 (no `description_md`), open issues ≤20, finance ≤20 + totals, decisions ≤15, milestones ≤10, activity ≤20, people catalog id+name. Justify your caps.
3. **Audit/handoff stage (recommended)**: for capture, add a `capture-handoff` stage between analyze and propose that emits a compact, zod-validated audit that KEEPS real ids (needed by `task.complete`/`issue.resolve`/`decision.supersede`/`finance.mark_paid`), `people`, `client`; make `capture-propose` consume the audit (not the workspace). For the message drafter, add a digest stage so the drafter drafts from a compact situation digest; keep a graceful fallback if the digest fails validation.
4. Decide whether week-in-review/weekly-summary get the same slim layer in this pass (they should if time permits — they're the biggest multi-project offenders).
5. Keep every surfaced UI shape stable (`CaptureSessionState`, draft results) or update consumers accordingly.

## Verification
- `bun run typecheck` and `bun run lint` clean (pre-existing warnings allowed, zero errors).
- `bun run build` succeeds.
- Any migration: `supabase db push --linked`, then confirm the new/changed templates (`select slug, current_version from public.ai_templates`) and any new columns.
- Manually exercise (or reason through, with logged evidence): capture high-confidence path, clarification path, regenerate, extract-more, mandatory update-types retry, and `draftMessage` + `getDraftPrompt`.
- Report before/after token-size estimates for the audited calls.

## Definition of done
1. Measured before/after for the priority calls (capture-analyze, capture-propose, message-drafter) showing a meaningful input-token reduction.
2. Implemented retrieval + (if adopted) audit/handoff changes with migrations pushed and templates versioned correctly.
3. All flows still work (approval gate, clarification, regenerate/extract-more, update-types retry, model picker, copy-prompt).
4. `bun run typecheck`, `bun run lint`, `bun run build` pass; no debug instrumentation left; no credentials touched.
5. Report back a concise summary: what you measured, what you changed, the before/after numbers, and what you deliberately left out and why.
