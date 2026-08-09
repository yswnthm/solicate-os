-- 0046: task_subtasks.notes — detailed how-to guidance per checklist item.
--
-- Subtasks currently carry only title + done + position. This migration adds a
-- notes column so each step can hold detailed instructions (sources, URLs,
-- exact steps, acceptance criteria). UI renders notes expandable — visible only
-- when the subtask row is clicked. Backfills notes for every Stillness
-- Growth Foundation subtask, grounded in deep-strategic-audit.md + the
-- execution plan.
--
-- Idempotent: column add is IF NOT EXISTS; notes updates are safe to re-run.

alter table public.task_subtasks
  add column if not exists notes text;

-- ─── Kickoff …3031 ──────────────────────────────────────────────────────────

update public.task_subtasks set notes = $str$Check each platform with the work.yeswanth@gmail.com login: (1) Google Search Console — property present and verifiable; (2) GA4 — Admin > account/property access; (3) WordPress — wp-admin login works on stillnesscuratedretreats.com; (4) Hostinger — hosting panel access; (5) Meta Business Suite + Google Business Profile owner access. Note which ones fail. Old solicate.team@gmail.com is suspended (appeal pending) — everything must run through the work account.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007010';

update public.task_subtasks set notes = $str$Re-run the same site-health check used on 29 Jul (55.6/100) against stillnesscuratedretreats.com so the 15 Aug close-out re-audit has a comparable number. Save the full report + score as the baseline. Also record the site: query result (currently ~0 results — the "site not indexed" finding).$str$
where id = '1ce4a5c0-0000-4000-8000-000000007011';

update public.task_subtasks set notes = $str$Send Komal/Sakshi the 3 asks from the execution plan chase list: (1) wearestillness.com — keep vs retire/redirect (gates entity/NAP work); (2) corporate logos + testimonials on /corporate (TechStream, FlowState, Vantage, Lumina) — real and cleared for use, or remove?; (3) 10 GBP photos from the studio/floating sessions. Also flag WP password rotation (previously shared in plaintext). Fallbacks if unanswered: no domain action + remove unverifiable logos.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007012';

-- ─── Task …3004 — Index cleanup ─────────────────────────────────────────────

update public.task_subtasks set notes = $str$Find the pages first: site:staging.* URLs, anything containing -old, /my-account, /cart, /checkout, product-category archives, tag/search pages, and WooCommerce utility endpoints. For each, set noindex via Yoast/Rank Math (Settings > index) or a robots meta tag. Keep the 11 canonical pages + event/product pages indexable. Verify after: pages return 404, redirect, or carry a noindex meta — re-run site: to confirm they drop out of the index.$str$
where id = 'd3294769-3971-4131-a344-0d5eeadc20b6';

update public.task_subtasks set notes = $str$Regenerate the XML sitemap in Yoast/Rank Math after de-noindexing (excluded pages drop out automatically). Submit sitemap_index.xml in GSC > Sitemaps and watch the status. Confirm the sitemap lists only canonical-domain URLs. Then re-run the site: query — it should return live canonical pages now (the audit found ~0 results).$str$
where id = '4fb0487d-0949-457d-9f28-b1e35d138950';

update public.task_subtasks set notes = $str$In the site root or Yoast: allow crawl of canonical paths, disallow staging dirs, /my-account, /cart, /checkout, and utility query strings. Keep the sitemap reference in robots.txt. Test with GSC URL Inspection > test live URL and a robots.txt tester.$str$
where id = '0c784d00-19e2-4af1-9a33-04e94e7717b0';

update public.task_subtasks set notes = $str$Install an IndexNow plugin (or Bing Webmaster > IndexNow) and generate the API key. Add the key file to the site root. Submit the key in Bing Webmaster Tools and verify with a test URL. IndexNow pings Bing/SE when URLs change — speeds reindexing of the de-noindexed set.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007001';

-- ─── Task …3005 — On-page fixes ──────────────────────────────────────────────

update public.task_subtasks set notes = $str$Find both URLs (one ends -2). Pick the stronger as canonical (usually the one with the most internal links). 301 the other via a redirect plugin or .htaccess. Update internal links to point at the canonical. Confirm in GSC URL Inspection that the redirect resolves.$str$
where id = '920bfc50-b012-4938-8c34-3aa803ea315d';

update public.task_subtasks set notes = $str$The footer "Sacred Offerings" link 404s to /offerings on every page. Edit the footer (Elementor Theme Builder / WP footer) so the target is /sacred-offerings. Also fix the Curated Calm "Other Rituals" link that points to /offerings. If /offerings already has inbound links, add a 301 from /offerings → /sacred-offerings.$str$
where id = 'cda4162b-2835-40fa-a161-a9a858e08df8';

update public.task_subtasks set notes = $str$The slug has a typo ("sytem"). Create the corrected slug page and 301 /nervous-sytem-reset/ → the correct URL. Fix the source links pointing at the typo. Check GSC for the typo URL as a 404 and confirm the redirect resolves.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007002';

update public.task_subtasks set notes = $str$Edit the decorative coordinate element on /sacred-offerings and /curated-calm. 43N/79W is Toronto — wrong for a Vancouver business (and near a same-named competitor). Vancouver is ~49N/123W. Keep the "Canada's First Sanctuary" copy, fix only the coordinates. Search the theme/Elementor for "43" to catch both occurrences.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007003';

update public.task_subtasks set notes = $str$List all page titles. The audit found brand-name repetition (e.g., brand name repeated). Rewrite each to a unique keyword-led pattern: "Primary Keyword — Stillness Co." — one page, one focus. Write matching meta descriptions under ~155 chars with a CTA. Update in Yoast/Rank Math per page.$str$
where id = '029d12b0-8f54-4c11-b850-1f03a4dd4ae2';

update public.task_subtasks set notes = $str$Ensure exactly one H1 per page, matching the page's keyword focus, and differing from the title tag. The audit flags H1s as generic/mismatched. Fix in Elementor heading widgets.$str$
where id = '9c256e86-1425-4b54-87c8-656e9019ab50';

update public.task_subtasks set notes = $str$Add contextual links between related pages (e.g., About → /sacred-offerings, blog → events/products). Structure links toward the 4 pillar groupings — floating sound bath, breathwork, corporate wellness, family — so future content connects cleanly. Minimum 2–3 internal links on each key page; no orphans (every page reachable from nav or footer).$str$
where id = 'f16ab9ed-ab6c-4d3d-a9da-c998b6871793';

update public.task_subtasks set notes = $str$Add descriptive alt text (not keyword-stuffed) to every image, especially event/offering photos. Include "floating sound bath" on the flagship imagery. Elementor images have alt fields. Feeds image search, accessibility, and E-E-A-T.$str$
where id = '47f1d15f-44d8-4960-bf50-86276c70f394';

update public.task_subtasks set notes = $str$On /reserve two nav rows render (one: Corporate / Sacred Offerings / Shop / Blog / About / Book; another: Philosophy / … / Book Session). Remove the duplicate row so /reserve matches the single clean nav used everywhere else. Likely a remnant of the earlier header conflict — check Theme Builder + the page template.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007004';

-- ─── Task …3006 — Schema ────────────────────────────────────────────────────

update public.task_subtasks set notes = $str$Add JSON-LD LocalBusiness (or HealthAndBeautyBusiness/Spa) sitewide. Set: name = one canonical display name (finalize the single name first — entity consistency), address = Greater Vancouver, BC (write "Vancouver, BC" / "Vancouver, Canada" explicitly to disambiguate from Vancouver, WA), geo = 49.2827, -123.1207, url = canonical domain, sameAs = GBP URL + Instagram. NAP must match the finalized footer/GBP values. Validate in Rich Results Test.$str$
where id = '4da6f1ec-d616-4d28-942e-99550148c11a';

update public.task_subtasks set notes = $str$On each dated event/product page add Event JSON-LD: name, startDate, location, offers/price, and eventStatus — EventScheduled (upcoming), EventSoldOut (sold out), EventCancelled/EventPostponed (cancelled/postponed), EventRescheduled. This is the data seed for the Phase-2 cancelled-events display feature — keep it accurate to live event states. Dates must be real session dates (e.g., the aug-8 / aug-17 / aug-22 listings).$str$
where id = '55de43ef-b1a7-402b-ae94-b7eea8d77f44';

update public.task_subtasks set notes = $str$Add Organization schema (Stillness Co., logo, url, sameAs) + Person schema for Komal as founder: name, jobTitle, worksFor, and credentials (certified facilitator) if already public. Links the brand to a named, credentialed practitioner — a Google E-E-A-T signal. Do not invent credentials; use only what the About page states. Keep the name consistent with the GBP owner.$str$
where id = 'ddfad06e-45d4-4da7-b73f-3818c1742f49';

update public.task_subtasks set notes = $str$Paste each page URL (or the JSON-LD) into https://search.google.com/test/rich-results. Fix errors/warnings: missing fields, wrong types, eventStatus enum values. Re-test after fixes. Once indexed, also check GSC > Enhancements for schema validity.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007005';

-- ─── Task …3007 — OG image + /llms.txt ───────────────────────────────────────

update public.task_subtasks set notes = $str$Find the og:image meta tag — the audit found it referencing the Hostinger subdomain (a leak). Re-point og:image to a 1200x630 image hosted on stillnesscuratedretreats.com. Upload the image to WP media, copy the canonical URL, set it in the Yoast/Rank Math social tab. Test with Facebook Sharing Debugger / LinkedIn Post Inspector. Also confirm og:url points at the canonical domain.$str$
where id = '6659a90b-f615-4fcd-a983-e2c98eb1a1f3';

update public.task_subtasks set notes = $str$Create /llms.txt (plain Markdown) at the site root describing: who the business is, key offerings (floating sound bath, breathwork, corporate wellness, family), the flagship positioning ("Greater Vancouver's outdoor floating sound bath"), main URLs, and contact. AI tools already cite the brand; this file gives them clean structured facts. Validate the format after publishing.$str$
where id = '4aa3a8b0-b83a-4429-97b1-0531d499ddb1';

-- ─── Task …3026 — GA4 ───────────────────────────────────────────────────────

update public.task_subtasks set notes = $str$In GA4 Admin, confirm the property + web datastream exist under work.yeswanth@gmail.com. The property is brand-new and empty — note that as the baseline (no history to compare against). Grab the Measurement ID (G-XXXXXXX) and web stream URL for the tag install. Create the property/datastream first if it doesn't exist.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007006';

update public.task_subtasks set notes = $str$Install the GA4 tag via Google Site Kit (simplest — connects WP to the GA4 account) or Google Tag Manager. Use the Measurement ID from the datastream step. Verify the tag fires: GA4 > Realtime should show your test visit; check DebugView/preview mode.$str$
where id = 'fa371a05-46d3-43a6-b57f-8277719b560f';

update public.task_subtasks set notes = $str$Define key events in GA4: (1) ticket purchase — fires on the Eventbrite redirect/thank-you or WooCommerce order; (2) checkout started — on the checkout page; (3) waitlist signup — MetForm form 6697 submission; (4) contact/subscribe — contact form + newsletter. Mark each as a key event (previously "conversions"). Verify each fires in DebugView with a real test action.$str$
where id = '2d0d245b-f8d4-4426-ba3a-debdbca7b1e2';

-- ─── Task …3027 — GBP ───────────────────────────────────────────────────────

update public.task_subtasks set notes = $str$Sign in to Google Business Profile under work.yeswanth@gmail.com. Confirm the Stillness listing (stillnesscuratedretreats.com) is claimed and that this account owns/manages it. If unclaimed, claim and complete verification. Check owner vs manager level.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007007';

update public.task_subtasks set notes = $str$Fill every section: business description (founder voice, floating sound bath, Vancouver), primary + secondary categories (e.g., Sound Bath / Wellness Studio), hours, services list, and set the offer/booking link to the canonical site (stillnesscuratedretreats.com). Keep name/address/phone consistent with the site footer (NAP). Publish.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007008';

update public.task_subtasks set notes = $str$Get 10 photos from Komal (client ask #3) — studio, floating sessions, event shots. Upload to the GBP listing: exterior/interior, offers/services, at-work shots. Real photos only, with captions. Photos lift local-pack visibility and trust.$str$
where id = 'e11960f5-c878-4220-a9d0-cc6588e7dd1a';

update public.task_subtasks set notes = $str$Generate the short Google review link (via the "Get more reviews" card in GBP) and send it to Komal. Set up the Instagram review path: point the Instagram profile/bio to the review link so attendees can review easily. Confirm the link works and document where it lives for the client.$str$
where id = 'edec72ec-bdb0-411c-b06b-80bbbd1e16d7';

-- ─── Task …3029 — Close-out ─────────────────────────────────────────────────

update public.task_subtasks set notes = $str$Re-run the same site-health check from Day 1 (baseline 55.6/100). Compare scores per category — goal: improved overall score. Pull GSC data (if verified) for indexing changes. Record the new score for the summary report.$str$
where id = '6bc59b37-cc82-4008-8a7d-3830b49d6148';

update public.task_subtasks set notes = $str$Build the 90-day plan on the 4 pillars: floating sound bath / outdoor sound healing, breathwork & nervous system regulation, corporate wellness & workplace burnout, family & children's emotional tools. For each: target keywords (audit §4 keyword map), content types (hub pages, blog posts), cadence, and internal links. Include carry-forwards: event hub page, /reserve funnel differentiation, keyword validation.$str$
where id = 'dfcb62bd-7132-43d2-b363-bdda9fcbc15a';

update public.task_subtasks set notes = $str$Write the client summary: what shipped (index, on-page, schema, analytics, local), before/after audit score, what still needs the client's 3 decisions, and the 90-day roadmap handoff. Deliver to Komal. Confirm invoice STILLNESS-007 (CAD 245) clears — the task only completes when payment is settled.$str$
where id = '6b5d33b7-2f82-4e91-95ce-3d5497ddcaaf';

update public.task_subtasks set notes = $str$Checklist before closing the phase: (1) re-audit > 55.6/100; (2) every phase-3 task (…3031, …3004–…3007, …3026, …3027) done; (3) summary report + 90-day roadmap delivered; (4) invoice STILLNESS-007 cleared. When all true, mark the phase completed.$str$
where id = '1ce4a5c0-0000-4000-8000-000000007013';
