# Growth Foundation — Planning Handoff Brief

Self-contained prompt used to plan the Stillness Co. **Growth Foundation** phase
(app phase 3, client "Phase 1" of organic growth). Run this through an LLM with
full access to the current site, GSC, GA4, and the audit baseline.

---

## Context

Stillness Co. is a Toronto-based wellness studio whose flagship offering is
**floating sound bath sessions** — Canada's first dedicated floating sound bath
experience, launched June 2026. They run roughly 9 sessions/month with 10–15
people each (~80 tickets/month). The business is early-stage: strong product,
weak digital foundation. The website was fully redesigned (11 pages) on
WordPress/WooCommerce with ticketing and landing pages completed.

A strategic audit was completed on 09 Aug 2026 (see `deep-strategic-audit.md`).
Baseline site health: **55.6/100** (29 Jul).

## Scope — "The Growth Foundation"

A two-week sprint (09–15 Aug 2026) to fix the technical and local-search
foundation so organic growth can compound. Deliverables:

1. **Search Console** verified + sitemap submitted.
2. **GA4** property connected + key events.
3. **Google Business Profile** claimed/complete + 10 photos.
4. **De-index** 20+ legacy/staging pages; rebuild sitemap.
5. **On-page** — 301 redirects, titles/meta/H1, internal links, alt text.
6. **Schema** — LocalBusiness + Event (with `eventStatus`) + Organization/Person.
7. **robots.txt** + IndexNow.
8. **OG image** on the canonical domain + `/llms.txt`.
9. **Re-audit** + 90-day content/roadmap + summary report (due 15 Aug).

## Known issues to resolve (from the audit)

- **P0** — live near-duplicate domain `wearestillness.com` (client decision);
  `/reserve` content mismatch (stretch only); footer `/offerings` 404 →
  `/sacred-offerings`; corporate logos/testimonials unverifiable (client
  decision); coordinate stamp 43°N/79°W → 49°N/123°W.
- **P1** — duplicate blog post → 301; event page cannibalization → hub page
  (carry to Growth Engine); conflicting double nav on `/reserve`; NAP/entity
  fragmentation (3 name variants/emails, 2 domains).
- **P2** — content pillars (floating sound bath / breathwork / corporate
  wellness / family) → 90-day roadmap; founder E-E-A-T → Organization/Person.
- **P3** — PR/backlink outreach `headplusheart.com` → flag to Komal.

## Constraints

- Sprint window **09–15 Aug 2026**; hard target **15 Aug 2026**.
- Client decisions needed on **Day 1**: `wearestillness.com` (redirect vs
  domain recovery) and corporate logos/testimonials (keep vs remove).
- Access is via `work.yeswanth@gmail.com` (GSC + GA4 + WordPress + Hostinger);
  old `solicate.team@gmail.com` suspended (appeal pending).
- GSC recently connected and **unverified**; GA4 is brand-new/empty.

## Required output

1. A **day-by-day execution plan** (09–15 Aug) with concrete actions,
   acceptance criteria, and who does what.
2. The **P0/P1 fixes** triaged into the sprint; P2 folded into the 90-day
   roadmap; P3 flagged to the client.
3. A **90-day content/SEO roadmap** built on the four content pillars.
4. A **client-facing execution note** (no jargon) with the 3 asks the client
   must action.
