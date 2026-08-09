-- 0047: Stillness phase 3 — SEO tooling setup task + AI checkpoints.
--
-- Feedback: the plan jumped straight into action steps without first deciding
-- the SEO tooling (which plugin — Yoast / Rank Math / Site Kit / manual), and
-- had no decision gates. This migration:
--
--   1. Inserts task …3032 "SEO tooling setup — plugin selection & configuration"
--      as the first workstream (position 1), right after kickoff …3031. Its
--      subtasks audit the current plugins and end in a CHECKPOINT decision gate
--      where the AI is re-consulted before anything is configured.
--   2. Renumbers the rest of the phase (+1) to make room.
--   3. Adds CHECKPOINT subtasks to …3005 (on-page) and …3006 (schema) — gates
--      where the AI drafts the work for review before editing the site.
--   4. Points the most plugin-dependent notes (…3004) at the tooling task and
--      mentions the checkpoint convention in the phase description.
--
-- Convention: a subtask titled "CHECKPOINT — …" is a decision gate. Stop there,
-- ask the AI the question in the notes, get the answer, then continue.

-- ─── 1. Renumber to make room for tooling (kickoff stays 0) ─────────────────
-- record_history triggers write auth.uid() (NULL under migrations) — disable
-- around the bulk UPDATEs.

alter table public.tasks disable trigger record_history_tasks;

update public.tasks set position = 2 where id = '1ce4a5c0-0000-4000-8000-000000003008';
update public.tasks set position = 3 where id = '1ce4a5c0-0000-4000-8000-000000003004';
update public.tasks set position = 4 where id = '1ce4a5c0-0000-4000-8000-000000003005';
update public.tasks set position = 5 where id = '1ce4a5c0-0000-4000-8000-000000003006';
update public.tasks set position = 6 where id = '1ce4a5c0-0000-4000-8000-000000003007';
update public.tasks set position = 7 where id = '1ce4a5c0-0000-4000-8000-000000003026';
update public.tasks set position = 8 where id = '1ce4a5c0-0000-4000-8000-000000003027';
update public.tasks set position = 9 where id = '1ce4a5c0-0000-4000-8000-000000003029';

alter table public.tasks enable trigger record_history_tasks;

-- ─── 2. Tooling setup task (…3032) ──────────────────────────────────────────

insert into public.tasks (
  id, project_id, phase_id, title, description_md, status, priority, position, created_by_id
) values (
  '1ce4a5c0-0000-4000-8000-000000003032',
  '1ce4a5c0-0000-4000-8000-000000000021',
  '1ce4a5c0-0000-4000-8000-000000000503',
  'SEO tooling setup — plugin selection & configuration',
  $str$Decide and set up the SEO tooling before any technical work: audit the installed WordPress plugins, then checkpoint with the AI on which SEO plugin to use (Yoast / Rank Math / Google Site Kit / manual) given Elementor, WooCommerce + FooEvents, LiteSpeed Cache and MetForm are installed. Configure sitemap, robots, per-page titles/meta and social/OG fields in the chosen plugin. Gates …3004–…3007, which assume the tooling is in place.$str$,
  'todo', 'high', 1,
  (select id from public.app_users where is_active = true order by created_at limit 1)
) on conflict (id) do nothing;

insert into public.task_subtasks (id, task_id, title, done, position, notes, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007020',
       '1ce4a5c0-0000-4000-8000-000000003032',
       $str$Audit current WordPress plugins — SEO vs utility$str$, false, 1,
       $str$Log into wp-admin → Plugins and list what's installed and active: Elementor (page builder), WooCommerce + FooEvents (ticketing), LiteSpeed Cache (caching — it masked changes before, remember to purge), MetForm (waitlist form 6697), and any existing SEO plugin (Yoast / Rank Math / All in One SEO / Site Kit). Note versions and whether LiteSpeed cache is on. This list is what the plugin decision in the next step is based on.$str$,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

insert into public.task_subtasks (id, task_id, title, done, position, notes, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007021',
       '1ce4a5c0-0000-4000-8000-000000003032',
       $str$CHECKPOINT — confirm plugin choice with the AI before configuring$str$, false, 2,
       $str$STOP. This is a decision gate — do not skip. Paste the plugin list from the audit step into the AI and ask: "Given these installed plugins on a WordPress/Elementor/WooCommerce site (Elementor, WooCommerce + FooEvents, LiteSpeed Cache, MetForm, no SEO plugin yet), which SEO plugin should I use — Yoast SEO, Rank Math, or just Google Site Kit + manual meta — and why? What conflicts should I watch for, especially with LiteSpeed Cache? Which handles sitemap, robots.txt, per-page titles/meta, and OG/social fields best here?" Wait for the recommendation and confirm before configuring. Record the decision in the task notes.$str$,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

insert into public.task_subtasks (id, task_id, title, done, position, notes, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007022',
       '1ce4a5c0-0000-4000-8000-000000003032',
       $str$Install + configure the chosen SEO plugin (sitemap, robots, titles/meta, social/OG)$str$, false, 3,
       $str$Install the plugin agreed in the checkpoint. Enable: XML sitemap, per-page title/meta fields, social (OG/Twitter) fields, and robots control. Purge LiteSpeed cache after every change — it hid changes before. If the decision was manual/no plugin, use native WP/Elementor fields instead and say so in the notes.$str$,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

-- ─── 3. CHECKPOINT gates in the dependent tasks ──────────────────────────────

-- …3005 (on-page): AI drafts the matrix before editing the site.

insert into public.task_subtasks (id, task_id, title, done, position, notes, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007023',
       '1ce4a5c0-0000-4000-8000-000000003005',
       $str$CHECKPOINT — have the AI draft the title/meta/H1 matrix + redirect map before editing$str$, false, 10,
       $str$STOP. Gather the current list of page URLs + titles (screencap or export from the audit), paste into the AI, and ask: "Draft the title tag, meta description and H1 for each page on stillnesscuratedretreats.com — one keyword focus per page, no brand-name repetition, under 155 chars for descriptions — plus a redirect map for /offerings → /sacred-offerings, the duplicate blog post, and the /nervous-sytem-reset/ typo." Review the output with the AI before touching WordPress. Then apply page by page in the plugin chosen in …3032.$str$,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

-- …3006 (schema): AI drafts the JSON-LD for review.

insert into public.task_subtasks (id, task_id, title, done, position, notes, created_by_id)
select '1ce4a5c0-0000-4000-8000-000000007024',
       '1ce4a5c0-0000-4000-8000-000000003006',
       $str$CHECKPOINT — have the AI draft the JSON-LD (LocalBusiness + Event + Organization/Person) for review$str$, false, 4,
       $str$STOP. Ask the AI to generate the full JSON-LD: "Draft Schema.org JSON-LD for stillnesscuratedretreats.com — LocalBusiness (Vancouver, BC, geo 49.2827 -123.1207, sameAs → GBP + Instagram), Event with eventStatus for each live dated session, and Organization + Person for founder Komal (credentials as on the About page)." Review each block with the AI, then install in the chosen tool (plugin schema field, header snippet, or custom) and validate. Re-number: this checkpoint sits before the validation subtask.$str$,
       (select id from public.app_users where is_active = true order by created_at limit 1)
on conflict (id) do nothing;

update public.task_subtasks set position = 5
where id = '1ce4a5c0-0000-4000-8000-000000007005'; -- …3006 validate JSON-LD

-- ─── 4. Point the plugin-dependent notes (…3004) at the tooling task ─────────

update public.task_subtasks set notes = $str$After the SEO plugin is confirmed in …3032, find the pages first: site:staging.* URLs, anything containing -old, /my-account, /cart, /checkout, product-category archives, tag/search pages, and WooCommerce utility endpoints. For each, set noindex in the configured plugin (or a robots meta tag). Keep the 11 canonical pages + event/product pages indexable. Verify after: pages return 404, redirect, or carry a noindex meta — re-run site: to confirm they drop out of the index.$str$
where id = 'd3294769-3971-4131-a344-0d5eeadc20b6';

update public.task_subtasks set notes = $str$Regenerate the XML sitemap in the plugin configured in …3032 after de-noindexing (excluded pages drop out automatically). Submit sitemap_index.xml in GSC > Sitemaps and watch the status. Confirm the sitemap lists only canonical-domain URLs. Then re-run the site: query — it should return live canonical pages now (the audit found ~0 results).$str$
where id = '4fb0487d-0949-457d-9f28-b1e35d138950';

-- ─── 5. Phase description — note the tooling task + checkpoint convention ────

alter table public.phases disable trigger record_history_phases;

update public.phases
set description = description || E'\n\nTooling: task …3032 (SEO plugin decision — checkpoint) runs before the technical work. Convention: subtasks titled "CHECKPOINT — …" are decision gates — stop and ask the AI the question in the notes, confirm, then continue.'
where id = '1ce4a5c0-0000-4000-8000-000000000503';

alter table public.phases enable trigger record_history_phases;
