-- 0041: Stillness Co — human-readable content rewrite + real statuses.
--
-- 0040 folded issues into tasks (and dropped the issues table). This migration
-- finishes the Stillness content cleanup so the app reads as plain English:
--
--   1. Phases renamed to clean names: 1 · Platform / 2 · Events & LPs /
--      3 · Growth Foundation / 4 · Growth Engine / 5 · Growth Scale.
--   2. Foundation phase timeline corrected (started 18 Jul, target 15 Aug 2026)
--      + scope rewritten for the 09–15 Aug execution sprint.
--   3. People / relationship / project summaries rewritten (no parsing codes).
--   4. Task titles + descriptions rewritten; real statuses, completed_at and
--      due_at applied (per the client WhatsApp + execution plan).
--   5. Floating-sound-bath service page moved to Phase 5 Growth Scale.
--   6. Six new tasks added: …3025 Night LP · …3026 GA4 · …3027 GBP/Instagram ·
--      …3028 Growth Engine kickoff · …3029 Foundation close-out ·
--      …3030 cancelled-event display.
--   7. Issue-carrier tasks …4001/…4002/…4003 folded into their owning tasks and
--      deleted; …4004–…4007 cleaned and kept done.
--   8. Entry titles/bodies cleaned; …2015 remapped to app phase numbering;
--      …2037 (event states) added.
--   9. Transaction …607 note remapped to app phase numbering.
--  10. Ends with a sweep asserting no parsing codes remain.
--
-- Idempotent: UPDATEs safe to re-run; INSERTs use ON CONFLICT DO NOTHING.
-- record_history triggers write auth.uid() (NULL under migrations) — disabled
-- around the phase/task/transaction UPDATEs and re-enabled after.

-- ─── 0. Guards ──────────────────────────────────────────────────────────────

do $guard$
begin
  if not exists (select 1 from public.projects where id = '1ce4a5c0-0000-4000-8000-000000000021') then
    raise exception 'Stillness project not found — run migration 0005 first.';
  end if;
end $guard$;

-- ─── 1. Phases ──────────────────────────────────────────────────────────────

alter table public.phases disable trigger record_history_phases;

update public.phases
set name = '1 · Platform'
where id = '1ce4a5c0-0000-4000-8000-000000000501';

update public.phases
set name = '2 · Events & LPs'
where id = '1ce4a5c0-0000-4000-8000-000000000502';

update public.phases
set name = '3 · Growth Foundation',
    started_on = '2026-07-18',
    target_date = '2026-08-15',
    description = $str$Organic growth foundation: business discovery + technical SEO rebuild. Approved 17 Jul ("Let's do it"); scope sent 18 Jul; technical audit delivered 29 Jul 2026 (55.6/100); deep strategic audit 09 Aug 2026. Execution sprint 09–15 Aug 2026: access re-verify + baseline, index cleanup (de-noindex 20+ pages, sitemap, robots.txt, IndexNow), URL 301 + titles/meta/H1 + internal links + alt text, LocalBusiness + Event schema (with eventStatus), OG image + llms.txt, GA4 tracking, GBP + Instagram review, close-out (re-audit + 90-day roadmap + summary report).$str$,
    scope_deliverables = $str$Access re-verification + crawl baseline · index cleanup (de-noindex 20+ pages, rebuild sitemap, robots.txt, IndexNow) · URL 301 + titles/meta/H1 + internal links + alt text · LocalBusiness + Event schema (eventStatus) + Organization/Person · OG image on canonical domain + /llms.txt · GA4 tag + key events · GBP completion + 10 photos + Instagram review link · close-out: re-audit + 90-day roadmap + summary report$str$,
    scope_requirements = $str$Client access verified under work.yeswanth@gmail.com: Google Search Console, GA4, GBP, Meta, Hostinger, social handles + brand assets. Client decisions needed at kickoff: wearestillness.com, corporate logos/testimonials, 10 GBP photos.$str$,
    scope_acceptance = $str$Phase closes when the foundation items ship; re-audit + 90-day roadmap + summary report delivered 15 Aug 2026; invoice STILLNESS-007 cleared.$str$
where id = '1ce4a5c0-0000-4000-8000-000000000503';

update public.phases
set name = '4 · Growth Engine'
where id = '1ce4a5c0-0000-4000-8000-000000000504';

update public.phases
set name = '5 · Growth Scale',
    scope_deliverables = $str$Service pages — floating sound bath / sound healing / breathwork (separate piece of work promised in the client audit) · custom landing pages · aggressive high-ticket retreat promotion (e.g. Hawaii) · advanced optimization + growth initiatives$str$
where id = '1ce4a5c0-0000-4000-8000-000000000505';

alter table public.phases enable trigger record_history_phases;

-- ─── 2. People / relationship / project ─────────────────────────────────────

update public.people
set summary = $str$Wellness & mindfulness brand, Greater Vancouver, BC. Core offering: experiential somatic anchoring — active, immersive sessions (floating sound baths, breathwork, sound journeys, journaling, vocal yoga) that move people from mental overload into nervous-system regulation. No fixed location: ~9 group sessions/mo (10–15 people) at partner venues; floating sound baths = flagship, Canada's first (Jun 2026), highest-margin offering; monthly sessions = primary entry point. Positioning shifting accessible → premium (2026). Site: stillnesscuratedretreats.com. Duplicate live domain wearestillness.com detected (deep strategic audit, 09 Aug 2026) — resolution decision pending with Komal. Primary decision-maker: Komal; ops & comms + referral partner: Sakshi.$str$
where id = '1ce4a5c0-0000-4000-8000-000000000001';

update public.relationships
set summary = $str$Stillness Co entered via Sakshi (referral partner / graphic designer). Contract signed 10 Feb 2026. ₹10,000 commission on the ₹25,000 redesign paid & cleared — recorded in the finance ledger (STILLNESS-SAKSHI-001).$str$,
    terms_note = $str$Commission = 40% of the ₹25k redesign. Further per-phase splits decided by Solicate per work; partnership record at partnerships/Sakshi/Sakshi.md.$str$
where client_id = '1ce4a5c0-0000-4000-8000-000000000001'
  and person_id = '1ce4a5c0-0000-4000-8000-000000000012';

update public.projects
set summary = $str$Stillness Co — wellness & mindfulness brand, Greater Vancouver BC. Experiential somatic anchoring; no fixed venue, ~9 sessions/mo. Floating sound baths = flagship + highest margin (Canada's first, Jun 2026). One standing engagement, 5 phases: 1 Platform (₹25k, done) · 2 Events & LPs (done) · 3 Growth Foundation (active, ₹15k; sprint 09–15 Aug) · 4 Growth Engine (₹8–10k/mo, planned) · 5 Growth Scale (₹18k/mo, planned). Goal: own search demand, cut ad dependence. DM: Komal (owner); Sakshi referral/ops (₹10k cleared).$str$,
    direction = $str$1) Finish the Phase 3 Growth Foundation sprint (09–15 Aug): access re-verify, index cleanup, URL/title/H1 fixes, LocalBusiness + Event schema (eventStatus), OG/llms.txt, GA4, GBP + Instagram, close-out re-audit + 90-day roadmap + summary report. 2) Move into the Phase 4 Growth Engine: publish high-intent content across 4 pillars (floating sound bath, breathwork, corporate wellness, family), on-page refinement, ranking monitoring; carry-forwards: event hub page, /reserve funnel differentiation, keyword validation. 3) Scale via Phase 5 when high-ticket retreat promotion is live: service pages (floating sound bath / sound healing / breathwork), custom landing pages. Bundled LP policy (₹3–3.2k grouped, invoiced together) governs future landing pages.$str$
where id = '1ce4a5c0-0000-4000-8000-000000000021';

update public.project_participants
set terms_note = $str$₹10k redesign share received & cleared — recorded in the finance ledger (STILLNESS-SAKSHI-001) and at the relationship level. Per-phase splits decided by Solicate per work (Preksha ₹3k/₹1k); partnership record: partnerships/Sakshi/Sakshi.md; no GST/invoicing on file.$str$
where project_id = '1ce4a5c0-0000-4000-8000-000000000021'
  and person_id = '1ce4a5c0-0000-4000-8000-000000000012';

-- ─── 3. Tasks ───────────────────────────────────────────────────────────────

alter table public.tasks disable trigger record_history_tasks;

-- Status flips + clean descriptions (completed_at set per the done-constraint).

update public.tasks set
  title = 'Deliver branded WooCommerce order email',
  description_md = $str$Custom-branded order email (₹3k add-on, decision 15 Jun 2026). Template existed; delivered and accepted 21 Jul.$str$,
  status = 'done', priority = 'normal',
  completed_at = '2026-07-21T12:00:00+05:30'::timestamptz
where id = '1ce4a5c0-0000-4000-8000-000000003001';

update public.tasks set
  title = 'Import 2 previous events from Eventbrite',
  description_md = $str$Imported the 2 previous events from Eventbrite (eventbrite.ca/o/78867564303) onto the site.$str$,
  status = 'done', priority = 'normal',
  completed_at = '2026-07-21T12:00:00+05:30'::timestamptz
where id = '1ce4a5c0-0000-4000-8000-000000003002';

update public.tasks set
  title = 'Complete remaining Hawaii LP sections',
  description_md = $str$Hawaii Retreat landing page — remaining ticket-related sections. Built and delivered 21 Jul; awaiting Komal feedback on the bespoke creative.$str$,
  status = 'done', priority = 'high',
  completed_at = '2026-07-21T12:00:00+05:30'::timestamptz
where id = '1ce4a5c0-0000-4000-8000-000000003003';

update public.tasks set
  title = 'Index cleanup — de-noindex legacy/staging pages + rebuild sitemap',
  description_md = $str$20+ legacy/staging/WooCommerce utility pages are currently indexable, splitting link equity and confusing Google. De-noindex them, rebuild the XML sitemap, fix robots.txt, and set up IndexNow. Covers the "site not indexed" finding (site: returned 0 results). Due 12 Aug.$str$,
  status = 'todo', priority = 'high',
  due_at = '2026-08-12'
where id = '1ce4a5c0-0000-4000-8000-000000003004';

update public.tasks set
  title = 'On-page fixes — URL 301, titles/meta/H1, internal links, alt text',
  description_md = $str$Fix the /nervous-sytem-reset/ URL typo (301 to the correct slug), rewrite duplicate title tags (brand-name repetition), tighten meta descriptions + H1s, and run an internal-linking + alt-text pass. Also fix the sitewide footer "Sacred Offerings" link (currently a 404 → /sacred-offerings), correct the coordinate stamp (43°N/79°W → 49°N/123°W), 301 the duplicated blog post, and QA the conflicting double header nav on /reserve. Due 12 Aug.$str$,
  status = 'todo', priority = 'high',
  due_at = '2026-08-12'
where id = '1ce4a5c0-0000-4000-8000-000000003005';

update public.tasks set
  title = 'Schema — LocalBusiness + Event (with eventStatus) + Organization/Person',
  description_md = $str$Add LocalBusiness schema (Vancouver, BC geo disambiguation, consistent NAP, sameAs → GBP) and Event schema with eventStatus values populated (scheduled / sold out / done / cancelled) — the technical seed of the cancelled-events display feature. Add Organization + Person schema for founder-led E-E-A-T (Komal as named, credentialed practitioner). Structure event markup so dated sessions stay machine-readable without each one competing to rank (supports the future event hub page). Due 13 Aug.$str$,
  status = 'todo', priority = 'normal',
  due_at = '2026-08-13'
where id = '1ce4a5c0-0000-4000-8000-000000003006';

update public.tasks set
  title = 'OG image on canonical domain + /llms.txt',
  description_md = $str$Fix the OG/social preview image to reference the canonical domain (kills the Hostinger subdomain leak) and create /llms.txt. AI tools already cite the brand. Due 13 Aug.$str$,
  status = 'todo', priority = 'normal',
  due_at = '2026-08-13'
where id = '1ce4a5c0-0000-4000-8000-000000003007';

update public.tasks set
  title = 'Access re-verification — GSC, GA4, GBP, WordPress, Hostinger',
  description_md = $str$Google account solicate.team@gmail.com suspended 5 Aug (appeal pending); access re-granted 6 Aug under work.yeswanth@gmail.com for GSC, GA4, WordPress, Hostinger. Full re-verification of every account plus Meta/GBP happens on Day 1 of the 09–15 Aug sprint (tracked via the close-out task). Done 6 Aug.$str$,
  status = 'done', priority = 'high',
  completed_at = '2026-08-06T12:00:00+05:30'::timestamptz
where id = '1ce4a5c0-0000-4000-8000-000000003008';

update public.tasks set
  phase_id = '1ce4a5c0-0000-4000-8000-000000000505',
  title = 'Floating sound bath service page',
  description_md = $str$Evergreen "Floating Sound Bath — Greater Vancouver" service page for the flagship, highest-margin offering (zero-competition keyword, no owned page). Moved to Phase 5 Growth Scale — the client-facing audit promises service pages (floating sound bath / sound healing / breathwork) as a separate piece of work; the deep strategic audit also recommends the event hub page structure for the Growth Engine.$str$,
  status = 'todo', priority = 'high'
where id = '1ce4a5c0-0000-4000-8000-000000003009';

update public.tasks set
  title = 'Waitlist per-event dropdown',
  description_md = $str$Closed without building — the client found a workaround, so the per-event waitlist dropdown was never shipped. See the waitlist decision entry dated 25 Jul 2026.$str$,
  status = 'done', priority = 'low',
  completed_at = '2026-07-25T12:00:00+05:30'::timestamptz
where id = '1ce4a5c0-0000-4000-8000-000000003010';

update public.tasks set
  title = 'Create WhatsApp group (Komal + Sakshi)',
  description_md = $str$Group created 22 Jul.$str$,
  status = 'done', priority = 'low',
  completed_at = '2026-07-22T12:00:00+05:30'::timestamptz
where id = '1ce4a5c0-0000-4000-8000-000000003011';

update public.tasks set
  title = 'Testimonial from Komal (text + Google review)',
  description_md = $str$Text review received 22 Jul; Google review applied for and still pending post. In progress.$str$,
  status = 'in_progress', priority = 'normal'
where id = '1ce4a5c0-0000-4000-8000-000000003012';

update public.tasks set
  title = 'Resolve header conflict + purge LiteSpeed cache',
  description_md = $str$Three systems were fighting (UAE #5093, Theme Builder #5084, Astra native); the V4.1 header is self-contained HTML+CSS+JS of unknown source and LiteSpeed Cache masked changes. Resolved via CSS suppression + cache purge 5 Aug. Note: conflicting header navigation resurfaced on /reserve — flagged for the on-page QA pass.$str$,
  status = 'done', priority = 'normal',
  completed_at = '2026-08-05T12:00:00+05:30'::timestamptz
where id = '1ce4a5c0-0000-4000-8000-000000003013';

-- Completed Phase 1/2 tasks — description cleanup only.

update public.tasks set
  description_md = $str$Full 11-page WordPress/Elementor redesign launched Mar 2026.$str$
where id = '1ce4a5c0-0000-4000-8000-000000003014';

update public.tasks set
  title = 'WooCommerce ticketing + FooEvents delivered',
  description_md = $str$WooCommerce-native event ticketing (events-as-products) + FooEvents + MetForm waitlist (form 6697), part of the ticketing milestone (07 Jun).$str$
where id = '1ce4a5c0-0000-4000-8000-000000003015';

update public.tasks set
  title = 'MetForm waitlist form 6697',
  description_md = $str$Waitlist form 6697, part of the ticketing milestone (07 Jun).$str$
where id = '1ce4a5c0-0000-4000-8000-000000003016';

update public.tasks set
  description_md = $str$₹3k add-on (decision 15 Jun 2026); shipped.$str$
where id = '1ce4a5c0-0000-4000-8000-000000003017';

update public.tasks set
  description_md = $str$₹3k add-on (decision 15 Jun 2026); template exists (email-template.html).$str$
where id = '1ce4a5c0-0000-4000-8000-000000003018';

update public.tasks set
  description_md = $str$₹500 (shop fix bundled).$str$
where id = '1ce4a5c0-0000-4000-8000-000000003019';

update public.tasks set
  description_md = $str$Bundled with the FAQ fix.$str$
where id = '1ce4a5c0-0000-4000-8000-000000003020';

update public.tasks set
  description_md = $str$Completed July 2026 (exact date not in the export).$str$
where id = '1ce4a5c0-0000-4000-8000-000000003021';

update public.tasks set
  title = 'Event-date sorting (Option 2)',
  description_md = $str$Custom-code event-date sorting with past events auto-hidden. Shipped 21 Jul.$str$
where id = '1ce4a5c0-0000-4000-8000-000000003022';

update public.tasks set
  title = 'Events grid 5-vs-6 fix',
  description_md = $str$Fixed the events grid showing 6 columns instead of 5.$str$
where id = '1ce4a5c0-0000-4000-8000-000000003023';

update public.tasks set
  title = 'Events handoff guide PDF sent',
  description_md = $str$Update-Events-guide.pdf sent 21 Jul.$str$
where id = '1ce4a5c0-0000-4000-8000-000000003024';

-- ─── 4. New tasks ───────────────────────────────────────────────────────────

insert into public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, due_at, created_by_id
) select
  x.id::uuid, '1ce4a5c0-0000-4000-8000-000000000021', x.phase::uuid, x.title, x.description_md,
  x.status::public.task_status, x.priority::public.task_priority, x.due_at::date,
  (select id from public.app_users where is_active = true order by created_at limit 1)
from (values
  (
    '1ce4a5c0-0000-4000-8000-000000003025', '1ce4a5c0-0000-4000-8000-000000000502',
    'Night Decompression landing page', 'todo', 'normal', null,
    $str$Phase 2 item — landing page for the Night Decompression event (proposed 22 Jul; ~₹3,000–3,200 bundled per the LP policy). Awaiting Komal approval.$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000003026', '1ce4a5c0-0000-4000-8000-000000000503',
    'GA4 tracking setup — tag + key events', 'todo', 'high', '2026-08-14',
    $str$Verify the GA4 datastream under work.yeswanth@gmail.com, install the GA4 tag on WordPress, and define key events (ticket purchase, checkout started, waitlist signup, contact/subscribe). Property is currently brand-new and empty. Due 14 Aug.$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000003027', '1ce4a5c0-0000-4000-8000-000000000503',
    'GBP completion + 10 photos + Instagram review link', 'todo', 'normal', '2026-08-14',
    $str$Confirm Google Business Profile claim/ownership under the right account, complete the profile (description, categories, hours, services, offer link), add 10 photos (from Komal), and hand over the Google review link + Instagram data path. Due 14 Aug.$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000003028', '1ce4a5c0-0000-4000-8000-000000000504',
    'Growth Engine kickoff planning', 'todo', 'normal', null,
    $str$Plan the Phase 4 Growth Engine start (after the Foundation completes 15 Aug): content pillars publishing, on-page refinement, ranking monitoring, keyword validation, event hub page + /reserve funnel carry-forwards.$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000003029', '1ce4a5c0-0000-4000-8000-000000000503',
    'Foundation close-out — re-audit, 90-day roadmap, summary report', 'todo', 'high', '2026-08-15',
    $str$Re-audit the site vs the 55.6/100 baseline, produce the 90-day content roadmap (4 pillars: floating sound bath, breathwork, corporate wellness, family), and deliver the summary report to Komal. Clears invoice STILLNESS-007 when the foundation completes. Due 15 Aug.$str$
  ),
  (
    '1ce4a5c0-0000-4000-8000-000000003030', '1ce4a5c0-0000-4000-8000-000000000502',
    'Cancelled-event display', 'todo', 'normal', null,
    $str$Phase 2 item — display events by state (upcoming / sold out / done / cancelled), requested by Komal 07–08 Aug. Estimate ~₹400–600. The Foundation's Event schema work already populates eventStatus values, so this becomes a display/UI task later.$str$
  )
) as x(id, phase, title, status, priority, due_at, description_md)
on conflict (id) do nothing;

-- ─── 5. Issue-carrier tasks (folded into owners, then deleted) ──────────────
-- …4001 header conflict → …3013 · …4002 site not indexed → …3004 ·
-- …4003 on-page & technical gaps → …3005/…3006/…3007 (content already folded
-- into those descriptions above).

delete from public.tasks
where id in (
  '1ce4a5c0-0000-4000-8000-000000004001',
  '1ce4a5c0-0000-4000-8000-000000004002',
  '1ce4a5c0-0000-4000-8000-000000004003'
);

-- Clean descriptions on the resolved carrier tasks that remain.

update public.tasks set
  title = 'Single-event page issues (7)',
  description_md = $str$All 7 single-event page issues raised during ticketing delivery were fixed (07 Jun).$str$
where id = '1ce4a5c0-0000-4000-8000-000000004004';

update public.tasks set
  title = 'Events catalog + single-page client feedback (6)',
  description_md = $str$All 6 feedback items on the events catalog + single-event page addressed (12 Jun).$str$
where id = '1ce4a5c0-0000-4000-8000-000000004005';

update public.tasks set
  title = 'Events grid 5-vs-6',
  description_md = $str$Events page showed 5 columns instead of 6. Grid now shows 6; verified with the client (13 Jul).$str$
where id = '1ce4a5c0-0000-4000-8000-000000004006';

update public.tasks set
  title = 'Publish-date sorting',
  description_md = $str$Manual publish-date editing conflicted with real event dates. Option 2 custom code shipped; past events auto-hide (21 Jul).$str$
where id = '1ce4a5c0-0000-4000-8000-000000004007';

alter table public.tasks enable trigger record_history_tasks;

-- ─── 6. Entries ─────────────────────────────────────────────────────────────

update public.entries set
  body_md = $str$Contract signed 08 Feb 2026 (README); contract doc dated 10 Feb 2026. Solicate ₹15k / Sakshi ₹10k (60/40).$str$
where id = '1ce4a5c0-0000-4000-8000-000000002001';

update public.entries set
  body_md = $str$Launched March 2026 (exact day not recorded).$str$
where id = '1ce4a5c0-0000-4000-8000-000000002002';

update public.entries set
  title = 'Organic growth pricing — Foundation / Engine / Scale',
  decision_outcome = $str$One-time Growth Foundation ₹15k (≈245 CAD) fixed; monthly Growth Engine ₹8–10k/mo (130–160 CAD); Growth Scale ₹18k/mo (300 CAD). Engine starts only after the Foundation completes; joint invoices via Sakshi. The client scope doc calls these Phase 1/2/3 — app phase names are the source of truth.$str$
where id = '1ce4a5c0-0000-4000-8000-000000002015';

update public.entries set
  decision_outcome = $str$Closed — the client found a workaround, so the per-event waitlist dropdown was never built.$str$
where id = '1ce4a5c0-0000-4000-8000-000000002017';

update public.entries set
  decision_outcome = $str$Group created 22 Jul 2026.$str$
where id = '1ce4a5c0-0000-4000-8000-000000002019';

update public.entries set
  body_md = $str$**Why:** live header showing conflicting content.

**Findings:** 3 systems fighting (UAE #5093, Theme Builder #5084, Astra native); Astra native always underneath; V4.1 header is self-contained HTML+CSS+JS with unknown source; LiteSpeed Cache masks all changes.

**Decided:** CSS suppression kept, PHP snippet unreliable.

**Status:** resolved 05 Aug 2026 — CSS suppression + full LiteSpeed purge. Note: conflicting header navigation resurfaced on /reserve — flagged for the on-page QA pass.$str$
where id = '1ce4a5c0-0000-4000-8000-000000002022';

update public.entries set
  body_md = $str$Hawaii Retreat LP Proposal (work/proposals/hawaii-retreat.md) · Organic Growth scope — Foundation / Engine / Scale (work/proposals/organic-growth.md; PDF sent 18 Jul 2026).$str$
where id = '1ce4a5c0-0000-4000-8000-000000002024';

update public.entries set
  body_md = $str$Full technical SEO audit (55.6/100) + browsable HTML export, delivered 29 Jul 2026.$str$
where id = '1ce4a5c0-0000-4000-8000-000000002026';

update public.entries set
  body_md = $str$Events build docs, header debug log, and custom checkout docs (09 numbered files).$str$
where id = '1ce4a5c0-0000-4000-8000-000000002028';

update public.entries set
  title = 'work/tasks.md task board',
  body_md = $str$Previously an unfilled template note; populated 09 Aug 2026 with the Growth Foundation sprint board.$str$
where id = '1ce4a5c0-0000-4000-8000-000000002032';

update public.entries set
  body_md = $str$partnerships/Sakshi/Sakshi.md — First Win Feb 9 2026; 40% / ₹10k; splits vary per phase.$str$
where id = '1ce4a5c0-0000-4000-8000-000000002033';

update public.entries set
  body_md = $str$~₹3,000–3,200 bundled price discussed 22 Jul; to be confirmed if it moves forward.$str$
where id = '1ce4a5c0-0000-4000-8000-000000002034';

update public.entries set
  body_md = $str$Paid ads $20–300 CAD/mo, irregular, run by an external marketing team (agency name unknown).$str$
where id = '1ce4a5c0-0000-4000-8000-000000002035';

-- New entry: event states including cancelled (client request 07–08 Aug).

insert into public.entries (
  id, project_id, phase_id, type, title, body_md, occurred_at, triage_state, created_by_id
) values (
  '1ce4a5c0-0000-4000-8000-000000002037',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000502',
  'capture',
  'Event states incl. cancelled — display feature requested',
  $str$Komal requested (07–08 Aug 2026) that events display their current state — upcoming / sold out / done / cancelled — instead of just hiding past events. Confirmed as a separate Phase 2 item (estimate ~₹400–600, tracked as the "Cancelled-event display" task). The Growth Foundation's Event schema work already populates Schema.org eventStatus values, so the front-end display feature becomes a display/UI task later.$str$,
  '2026-08-07T12:00:00+05:30'::timestamptz,
  'filed',
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;

-- ─── 7. Finance ─────────────────────────────────────────────────────────────

alter table public.transactions disable trigger record_history_transactions;

update public.transactions
set notes = $str$Phase 3 — Organic Growth Foundation (client scope doc "Phase 1"; 245 CAD ≈ ₹15,000). Approved 17 Jul; scope sent 18 Jul; technical audit delivered 29 Jul 2026 (55.6/100); foundation sprint 09–15 Aug 2026. Payment pending — mark completed when the foundation completes.$str$
where id = '1ce4a5c0-0000-4000-8000-000000000607';

alter table public.transactions enable trigger record_history_transactions;

-- ─── 8. Verification sweep ──────────────────────────────────────────────────
-- Assert no parsing codes remain in Stillness content. Fails the migration if
-- any are found.

do $sweep$
declare
  v_bad int;
begin
  select count(*) into v_bad
  from (
    select id from public.tasks
     where project_id = '1ce4a5c0-0000-4000-8000-000000000021'
       and (description_md ~ 'WS-[0-9]|Source:|seo-audit\.md|_chat\.txt'
         or title ~ 'WS-[0-9]|Source:|seo-audit\.md|_chat\.txt')
    union all
    select id from public.entries
     where project_id = '1ce4a5c0-0000-4000-8000-000000000021'
       and (body_md ~ 'WS-[0-9]|Source:|\[R[0-9]|seo-audit\.md|_chat\.txt'
         or title ~ 'WS-[0-9]|Source:|\[R[0-9]|seo-audit\.md|_chat\.txt')
    union all
    select id from public.phases
     where project_id = '1ce4a5c0-0000-4000-8000-000000000021'
       and (description ~ 'WS-[0-9]|Source:|seo-audit\.md|_chat\.txt'
         or scope_deliverables ~ 'WS-[0-9]|Source:|seo-audit\.md|_chat\.txt')
    union all
    select id from public.people
     where id = '1ce4a5c0-0000-4000-8000-000000000001'
       and summary ~ 'WS-[0-9]|Source:|seo-audit\.md|_chat\.txt'
  ) x;

  if v_bad > 0 then
    raise exception 'Stillness content still contains % parsing-code match(es) — review migration 0041.', v_bad;
  end if;
end;
$sweep$;

-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT position, name, status, started_on, target_date
--   FROM phases WHERE project_id = '1ce4a5c0-0000-4000-8000-000000000021' ORDER BY position;
-- SELECT reference_number, status, notes FROM transactions WHERE id = '1ce4a5c0-0000-4000-8000-000000000607';
-- SELECT title, status, priority, due_at, completed_at, phase_id
--   FROM tasks WHERE project_id = '1ce4a5c0-0000-4000-8000-000000000021'
--   ORDER BY phase_id, title;
