-- 0043: Stillness Co — planned subtask content for the Growth Foundation sprint.
--
-- The phase-3 subtasks were thin one-liners. This migration rewrites them into
-- concrete, planned checklist items grounded in deep-strategic-audit.md (09 Aug)
-- and the execution plan. It also:
--
--   1. Moves the coordinate-stamp fix from task …3006 (schema) into …3005
--      (on-page), where it belongs — it already lives in …3005's description.
--   2. Splits robots.txt and IndexNow (…3004) into separate checklist items.
--   3. Adds missing planned steps: /nervous-sytem-reset/ 301, /reserve nav QA,
--      JSON-LD validation, GA4 datastream verification, GBP claim + profile.
--   4. Renumbers positions so each task reads as a coherent execution order.
--
-- Idempotent: UPDATEs safe to re-run; INSERTs use ON CONFLICT DO NOTHING.
-- task_subtasks only has a set_updated_meta trigger (no record_history), so no
-- trigger juggling is required.

-- ─── 0. Guards ──────────────────────────────────────────────────────────────

do $guard$
begin
  if not exists (select 1 from public.projects where id = '1ce4a5c0-0000-4000-8000-000000000021') then
    raise exception 'Stillness project not found — run migration 0005 first.';
  end if;
end $guard$;

-- ─── 1. Task …3004 — Index cleanup ──────────────────────────────────────────

update public.task_subtasks set
  title = $str$De-noindex 20+ legacy/staging/WooCommerce-utility pages (staging, -old, account, product-archive)$str$,
  position = 1
where id = 'd3294769-3971-4131-a344-0d5eeadc20b6';

update public.task_subtasks set
  title = $str$Rebuild XML sitemap (canonical URLs only) + submit to GSC; confirm site: query returns live pages$str$,
  position = 2
where id = '4fb0487d-0949-457d-9f28-b1e35d138950';

update public.task_subtasks set
  title = $str$robots.txt — allow canonical crawl, block staging/utility paths$str$,
  position = 3
where id = '0c784d00-19e2-4af1-9a33-04e94e7717b0';

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007001',
       '1ce4a5c0-0000-4000-8000-000000003004',
       $str$Enable IndexNow + submit key to Bing$str$, false, 4,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

-- ─── 2. Task …3005 — On-page fixes ───────────────────────────────────────────

update public.task_subtasks set
  title = $str$301 the duplicate blog post ("Why Mindfulness & Breathwork Are Essential for Emotional Regulation" — the -2 URL) into the canonical$str$,
  position = 1
where id = '920bfc50-b012-4938-8c34-3aa803ea315d';

update public.task_subtasks set
  title = $str$Fix sitewide footer link /offerings → /sacred-offerings (incl. Curated Calm "Other Rituals")$str$,
  position = 2
where id = 'cda4162b-2835-40fa-a161-a9a858e08df8';

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007002',
       '1ce4a5c0-0000-4000-8000-000000003005',
       $str$301 /nervous-sytem-reset/ URL typo → correct slug$str$, false, 3,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007003',
       '1ce4a5c0-0000-4000-8000-000000003005',
       $str$Fix coordinate stamp 43N/79W → 49N/123W on /sacred-offerings + /curated-calm$str$, false, 4,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

update public.task_subtasks set
  title = $str$Titles + meta descriptions pass — remove duplicate brand-name titles$str$,
  position = 5
where id = '029d12b0-8f54-4c11-b850-1f03a4dd4ae2';

update public.task_subtasks set
  title = $str$H1 consistency pass$str$,
  position = 6
where id = '9c256e86-1425-4b54-87c8-656e9019ab50';

update public.task_subtasks set
  title = $str$Internal links pass (anticipating the 4 content pillars)$str$,
  position = 7
where id = 'f16ab9ed-ab6c-4d3d-a9da-c998b6871793';

update public.task_subtasks set
  title = $str$Alt text pass$str$,
  position = 8
where id = '47f1d15f-44d8-4960-bf50-86276c70f394';

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007004',
       '1ce4a5c0-0000-4000-8000-000000003005',
       $str$QA the conflicting double header nav on /reserve$str$, false, 9,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

-- ─── 3. Task …3006 — Schema ──────────────────────────────────────────────────

update public.task_subtasks set
  title = $str$LocalBusiness schema — NAP-consistent, "Vancouver, BC" disambiguation, sameAs → GBP$str$,
  position = 1
where id = '4da6f1ec-d616-4d28-942e-99550148c11a';

update public.task_subtasks set
  title = $str$Event schema with eventStatus populated (scheduled / sold out / cancelled) on dated event pages$str$,
  position = 2
where id = '55de43ef-b1a7-402b-ae94-b7eea8d77f44';

update public.task_subtasks set
  title = $str$Organization + Person schema for founder E-E-A-T (Komal, named/credentialed)$str$,
  position = 3
where id = 'ddfad06e-45d4-4da7-b73f-3818c1742f49';

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007005',
       '1ce4a5c0-0000-4000-8000-000000003006',
       $str$Validate all JSON-LD in Google Rich Results Test$str$, false, 4,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

-- Coordinate-stamp fix moved to …3005 (on-page), where it belongs.

delete from public.task_subtasks
where id = '443cf8bb-60d4-47d6-86e2-0e6fdecaf462';

-- ─── 4. Task …3007 — OG image + /llms.txt ───────────────────────────────────

update public.task_subtasks set
  title = $str$Repoint OG/social preview image to canonical domain (kill Hostinger subdomain leak), 1200x630$str$,
  position = 1
where id = '6659a90b-f615-4fcd-a983-e2c98eb1a1f3';

update public.task_subtasks set
  title = $str$Create /llms.txt with brand, offerings, contact$str$,
  position = 2
where id = '4aa3a8b0-b83a-4429-97b1-0531d499ddb1';

-- ─── 5. Task …3026 — GA4 tracking ────────────────────────────────────────────

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007006',
       '1ce4a5c0-0000-4000-8000-000000003026',
       $str$Verify GA4 datastream under work.yeswanth@gmail.com (property is new/empty — set baseline)$str$, false, 1,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

update public.task_subtasks set
  title = $str$Install GA4 tag on WordPress (Site Kit or GTM)$str$,
  position = 2
where id = 'fa371a05-46d3-43a6-b57f-8277719b560f';

update public.task_subtasks set
  title = $str$Define + verify key events: ticket purchase, checkout started, waitlist signup, contact/subscribe$str$,
  position = 3
where id = '2d0d245b-f8d4-4426-ba3a-debdbca7b1e2';

-- ─── 6. Task …3027 — GBP + photos + review link ──────────────────────────────

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007007',
       '1ce4a5c0-0000-4000-8000-000000003027',
       $str$Confirm GBP claim/ownership under the right account$str$, false, 1,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

insert into public.task_subtasks (id, task_id, title, done, position, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007008',
       '1ce4a5c0-0000-4000-8000-000000003027',
       $str$Complete profile — description, categories, hours, services, offer link$str$, false, 2,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

update public.task_subtasks set
  title = $str$Upload 10 photos (from Komal)$str$,
  position = 3
where id = 'e11960f5-c878-4220-a9d0-cc6588e7dd1a';

update public.task_subtasks set
  title = $str$Hand over Google review link + Instagram data path$str$,
  position = 4
where id = 'edec72ec-bdb0-411c-b06b-80bbbd1e16d7';

-- ─── 7. Task …3029 — Close-out ───────────────────────────────────────────────

update public.task_subtasks set
  title = $str$Re-audit site health vs 55.6/100 baseline$str$,
  position = 1
where id = '6bc59b37-cc82-4008-8a7d-3830b49d6148';

update public.task_subtasks set
  title = $str$90-day content roadmap across 4 pillars (floating sound bath, breathwork, corporate wellness, family)$str$,
  position = 2
where id = 'dfcb62bd-7132-43d2-b363-bdda9fcbc15a';

update public.task_subtasks set
  title = $str$Summary report to Komal + clear invoice STILLNESS-007$str$,
  position = 3
where id = '6b5d33b7-2f82-4e91-95ce-3d5497ddcaaf';
