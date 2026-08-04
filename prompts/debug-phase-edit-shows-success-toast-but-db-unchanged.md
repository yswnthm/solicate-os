# Handoff Prompt — Phase edit shows a green "updated" toast but the DB row never changes

## Your role
You are a senior debugging agent. Investigate and FIX a Next.js 15 + Supabase server-action bug in this repo (`solicate-os`, branch `main`, commit `20e7326`). You have full read/write access to the repo, `bun` as the package manager, and a running Supabase project. Do not re-verify items already confirmed as working (listed below). Focus on the unresolved question. Capture evidence, find the root cause, apply a fix, and verify it.

## TL;DR
Editing a phase (project page → phase row → Edit → change name → Save changes) shows a green **"Phase updated."** toast and closes the modal, but the phase row in the database **never changes** — even after a hard reload, and even in the Supabase Table Editor. It reproduces on **both** Vercel production and local `bun run dev` against the same production DB, so it is a real code bug, not a deploy/env issue. The read path is proven healthy (a name changed directly via the Supabase SQL editor appears in the app after reload).

## Latest empirical finding (important — start here)
`features/update-actions.ts` → `updatePhase` was instrumented with two `console.log("[DEBUG updatePhase] …")` lines (one after the internal `SELECT`, one after the `UPDATE`). After a **fresh** `bun run dev` restart, the user retried the edit. The dev log shows:
- `GET /projects/2f9e3d70-0000-4000-8000-000000000021 200` (page load)
- `POST /projects/2f9e3d70-0000-4000-8000-000000000021 200` (the save — server actions POST to the current route URL)
- two follow-up `GET` calls (post-save `router.refresh()`)

…but **NO `[DEBUG updatePhase]` output**. Two unresolved interpretations:

1. **`updatePhase` is not actually being invoked** when Save is clicked (a client-side problem, or a different action is being called).
2. **`console.log` from this dev server's server actions is not captured** in the log file (tooling artifact), which would make the instrumentation blind.

A verification marker was added to `features/queries.ts` → `getProjectWorkspace` (`console.log("[DEBUG getProjectWorkspace] projectId:", projectId)`) — a server component that runs on every project-page load. **Reloading the project page will discriminate the two interpretations**: if this line prints, server-side logging works and `updatePhase` genuinely did not run; if it does not print, logging is suppressed and you need an alternative observability method (see Diagnostic Step 6).

## Reproduction
1. `bun run dev` (env from `.env.local`; connects to the production Supabase project).
2. Log in with a valid internal user (Supabase Auth).
3. Open a project, e.g. `/projects/2f9e3d70-0000-4000-8000-000000000021` (CYCFDesign — has 4 phases with ids `…000001000` … `…000001003`).
4. Click **Edit** on a phase row, change the **name**, click **Save changes**.
5. Observed: green "Phase updated." toast; modal closes.
6. Hard reload (Cmd+Shift+R) → the phase still shows the OLD name.
7. Supabase dashboard → Table Editor → `phases` → that row: name and `updated_at` are unchanged.
8. The project page's Activity feed shows **no** "Updated phase: …" event (migration 0009's `phases_log_updated` trigger only fires if the UPDATE lands and a watched field actually differs).

## Verified as WORKING — do not re-litigate these
- **Deployed build is current**: the live Vercel login page contains `ToastProvider` (`$L2`) and `<div class="toast-viewport">`, which only exist in commit `20e7326`. `main` == `origin/main` == `20e7326`.
- **Migration 0009 IS applied to the live DB.** Verified via PostgREST column-existence probes against `krfqsroptgwnmqoqvjle.supabase.co`: `select=updated_by_id` returns HTTP 200 (exists) on `phases`, `tasks`, `entries`, `projects`; `messages.updated_at` and `messages.updated_by_id` return 200. (`/rest/v1/` OpenAPI introspection returns 401 "Secret API key required" with the `sb_publishable_*` key — use column probes instead.)
- **Same database everywhere**: `.env.local` `NEXT_PUBLIC_SUPABASE_URL` == Vercel env `NEXT_PUBLIC_SUPABASE_URL` == `https://krfqsroptgwnmqoqvjle.supabase.co`. `supabase/.temp/pooler-url` targets the same project.
- **Read path**: a name change made in the Supabase SQL editor (superuser, bypasses RLS) reflected in the app after hard reload.
- **RLS cannot be the silent no-op cause**: every table has a single `for all … using (public.is_active_internal_user()) with check (public.is_active_internal_user())` policy (`0001_initial_schema.sql` for core tables; `0007_project_phases.sql:31` for `phases`). `is_active_internal_user()` = `exists(app_users where id = auth.uid() and is_active)`. Because the user can SEE the row, the same `using`/`with check` expression must also pass for UPDATE → a RLS block would return an error, not a silent 0-row no-op.
- **No caching on the project page**: `export const dynamic = "force-dynamic"` at the top of `app/(app)/projects/[projectId]/page.tsx`; `getProjectWorkspace` is NOT wrapped in `unstable_cache`. A hard reload must show live DB state.
- **List-page cache tags match**: `unstable_cache` tags (`clients`/`projects`/`people`/`inbox`) equal the `revalidateTag` calls in the actions.
- **Green toast semantics**: `components/editing/entity-edit-modal.tsx` `handleSubmit` (lines 114-158) only calls `toast.success(...)` when `result.ok === true`; `runMutation` in `update-actions.ts` returns `{ok:true}` when the wrapped mutation returns `undefined` (i.e. no thrown error and no `{ok:false}`) — so a silent 0-row UPDATE looks exactly like success.
- **Local dev reproduces the bug** → not Vercel-only.

## The core contradiction
The full code path is logically sound:
`EditPhaseButton(phase)` → `EditPhaseModal` → `onSave(values) => updatePhase(phase.id, values)` → `requireActiveUser()` → `phaseSchema.safeParse(values)` (succeeds) → `SELECT status, completed_at FROM phases WHERE id = <id> (.maybeSingle())` → build `updates` → `UPDATE phases SET … WHERE id = <id>` → no error → `refresh()`.

The rendered phase row and the UPDATE use the **same `phase.id`** from `getProjectWorkspace`'s `phases` select (`id, name, description, position, status, started_on, target_date, completed_at, project_id`). If the page shows the phase, that `id` must match a row — so the `SELECT` must find it and the `UPDATE` must match it. Yet the row never changes AND no activity event fires. Therefore one of these must be true, and your job is to find which:
- (A) `updatePhase` is not executed at all (client never calls it, or a different/stale action runs).
- (B) `updatePhase` runs but the `id` it receives does not match any `phases` row (a wrong/undefined `id` would make both the SELECT and UPDATE match 0 rows with no error → green toast).
- (C) The UPDATE runs but is somehow reverted or its effect is not visible (no mechanism found; triggers only set `updated_at`/`updated_by_id` and log activity — none revert).
- (D) Server-action `console.log` is suppressed, making the current instrumentation invisible (would make (A)/(B) unverified, not disproven).

## Files involved
- `features/update-actions.ts` — `updatePhase` (≈lines 126-147; currently has the `[DEBUG updatePhase]` logs), `runMutation`, `refresh`, `EditResult`.
- `components/editing/entity-edit-modals.tsx` — `EditPhaseModal` (onSave at line 210; `record` built from `phase` at 199-207).
- `components/editing/entity-edit-modal.tsx` — `handleSubmit` (114-158), Save button `disabled={isSaving || !isDirty}` (line 169), `<form id="edit-form" onSubmit={handleSubmit} noValidate>` (line 187). NOTE: if `isDirty` never becomes true, the Save button is disabled and clicking does nothing.
- `components/editing/edit-buttons.tsx` — `EditPhaseButton` (76-92).
- `features/queries.ts` — `getProjectWorkspace` (phases select ≈220-224; now has the `[DEBUG getProjectWorkspace]` verification log).
- `lib/supabase/server.ts` — `createSupabaseServerClient` (React-`cache()`d per request; `@supabase/ssr` cookie client; env: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), `getAccessToken`, `createSupabaseServerClientWithToken`.
- `lib/auth.ts` — `requireActiveUser` (`getUser`; `redirect("/login")` if no/ inactive user).
- `lib/validation.ts` — `phaseSchema` (line 87): `project_id` uuid, `name`, `description`, `position` (coerce number ≥1), `status` enum, `started_on`/`target_date` optDate, `.superRefine(datesConsistent)`.
- `app/(app)/projects/[projectId]/page.tsx` — `force-dynamic`; phase rows (132-156).
- `supabase/migrations/` — `0001` (RLS + `is_active_internal_user()`), `0007` (`phases` table + policy), `0009` (`updated_by_id` columns, `set_updated_meta` BEFORE-UPDATE trigger, `phases_log_created`/`phases_log_updated` AFTER-UPDATE activity triggers).

## Diagnostic plan (in order)
1. **Verify server-side logging works.** Reload the project page while tailing the dev log. If `[DEBUG getProjectWorkspace] projectId: …` appears → logging works → `updatePhase` genuinely is not running → go to 2. If it does NOT appear → logging is suppressed → go to 6.
2. **Identify which action the Save actually triggers.** Open the browser Network tab, click Save, and inspect the POST request headers/body (header `Next-Action: <action-id>`). Confirm whether the action id corresponds to `updatePhase`. Also add a `console.log` at the VERY TOP of `updatePhase` (before `requireActiveUser()`) so the first line of the action prints regardless of auth/parse outcomes.
3. **Log the received `id`.** Confirm `id` arrives as the expected UUID string and that `.eq("id", id)` matches a real `phases` row (compare against Table Editor). Watch whether the SELECT's `existing` is the row or `null`. If `existing` is `null` while the page clearly renders the phase, something is rewriting the id between render and action.
4. **Check the client submit path.** Confirm `isDirty` flips to true when typing (Save button at line 169 is disabled while `!isDirty`), and that `handleSubmit` reaches `onSave(values)` → `updatePhase(phase.id, values)`. Note whether the user sees a red "Save failed…" toast locally (which would mean the action threw before returning `ok`), or green (action returned `ok:true`).
5. **Reproduce the exact PostgREST calls with a real authenticated session.** Either (a) sign up a temporary test user via `POST {url}/auth/v1/signup` with `apikey: <publishable key>` (if signups are enabled; `handle_new_user` auto-creates an active `app_users` row) and use that session token against `/rest/v1/phases?select=…` and `PATCH /rest/v1/phases?id=eq.<uuid>`; or (b) have the user copy the `access_token` from the browser (`document.cookie` or DevTools → Application). Run the SELECT and the UPDATE exactly as `updatePhase` does and observe: does the UPDATE return 0 rows? Does `phases_log_updated` fire (activity_events insert)? Does the row change?
6. **If server logging is suppressed**, change the instrumentation surface: temporarily make `updatePhase` return `{ ok: false, error: "DIAG: " + JSON.stringify({ id, existing, updateResult: { status, data, count, error } }) }` so the diagnostic renders in the RED toast, or write diagnostics into a throwaway `entries`/debug row. Never leave this in place.

## Hypotheses, ranked
- **H1 (top): `updatePhase` is invoked with a wrong/undefined `id`** → SELECT and UPDATE both match 0 rows → `{ok:true}` green toast, nothing changes, no activity event. Fits every symptom. Test: Diagnostic steps 1-3, 5.
- **H2: The save never reaches `updatePhase` at all** (client bug: `isDirty` stuck false / Save disabled; a stale action proxy after HMR; a different action firing). Fits the missing DEBUG logs if logging works. Test: steps 2 and 4.
- **H3: Server-action `console.log` is not captured** → instrumentation is blind; everything above becomes unverified. Test: step 1.
- **H4: Auth/session inside the action differs from the page** (e.g. `requireActiveUser` sees no session and redirects, which `runMutation` rethrows as a redirect — would surface as a redirect + red toast, NOT green; low likelihood but verify `existing`/`existingError` and the action's response).
- **H5: A DB trigger reverts or blocks the change silently** — none found in `0001`-`0009`; triggers only set `updated_at`/`updated_by_id` (BEFORE UPDATE) and insert activity rows (AFTER UPDATE). Low likelihood.

## Useful facts & constraints
- Server actions POST to the current route URL, so a `POST /projects/<id> 200` is expected for ANY action on that page (create task/phase/issue, resolve issue, add participant, update phase, …). It does not by itself prove `updatePhase` ran.
- `runMutation` returns `{ok:true}` when the wrapped fn returns `undefined` — a 0-row no-op UPDATE looks like success.
- `updatePhase` destructures `{ data: existing }` from `.maybeSingle()` and IGNORES the error field. If the SELECT errored (e.g. bad column), `existing` would be `null` and the code would proceed — a later UPDATE error would surface as a red toast, a 0-row no-op would not.
- `phases_log_updated` (0009:128-148) fires AFTER UPDATE only when `name`/`description`/`status`/`position`/`started_on`/`target_date` differ from the old row. Its absence proves the UPDATE did not land (or all watched fields were identical).
- The publishable key (`sb_publishable_*`, new format) cannot introspect schema via `/rest/v1/` (OpenAPI) — use column-existence probes (`select=<column>`; HTTP 400 "Could not find the column" = missing). All 0009 columns already probe as existing.
- Sample phases on CYCFDesign project `2f9e3d70-0000-4000-8000-000000000021`: ids `2f9e3d70-0000-4000-8000-000000001000` … `…001003`.
- Do NOT touch credentials. Do NOT commit debug instrumentation. Run `bun run typecheck` and `bun run build` before finishing.

## Definition of done
1. Root cause identified, with captured evidence (dev-log lines, action response payload, or a PostgREST repro).
2. Fix applied; local repro confirms the edit persists (hard reload shows the new value; an "Updated phase: …" activity event appears; Table Editor row changes).
3. All debug instrumentation removed; `bun run typecheck` and `bun run build` pass.
4. Report back a one-paragraph root-cause summary + the fix.
