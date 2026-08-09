# Growth Foundation — Execution Plan (Internal)

Sprint **09–15 Aug 2026** · Target **15 Aug 2026** · Fee CAD 245 (invoice
STILLNESS-007, clears txn `…607` on completion). Delivery: plan + docs + applied
on-page/technical work. This file is the operating plan; the client-facing note
is `Growth-seo/phase-1-execution-note.md`. The DB sprint board lives in
`tasks.md` and mirrors app tasks 3004–3009 / 3026–3030.

## Audit → Sprint mapping

| Priority | Finding | Sprint action | Tracked as |
| --- | --- | --- | --- |
| P0 | `wearestillness.com` live near-duplicate | **Day-1 client decision** (redirect vs domain recovery) | chase |
| P0 | `/reserve` content mismatch | Stretch goal only (Day 6 buffer) | — |
| P0 | Footer `/offerings` 404 | Fix → `/sacred-offerings` | …3005 QA |
| P0 | Corporate logos/testimonials unverifiable | **Day-1 client decision** (keep vs remove) | chase |
| P0 | Coordinate stamp 43°N/79°W | Fix → 49°N/123°W | …3006 |
| P1 | Duplicate blog post | 301 redirect | …3005 |
| P1 | Event page cannibalization → hub page | **Carry to Growth Engine** (…3028) | — |
| P1 | Double nav on `/reserve` | QA pass | …3005 |
| P1 | NAP/entity fragmentation (3 names, 2 domains) | Canonicalize name/email/domain | …3005 + …3006 |
| P2 | Content pillars (4) | 90-day roadmap | …3029 |
| P2 | Founder E-E-A-T | Organization/Person schema | …3006 |
| P3 | PR outreach `headplusheart.com` | Flag to Komal (BD) | chase |

## Sprint — day by day

**Day 1 — Fri 09 Aug: Access + client decisions**
- [ ] Re-verify all access on `work.yeswanth@gmail.com` (GSC, GA4, WordPress, Hostinger) + Meta/GBP (…3008 already `done` 06 Aug — confirm live).
- [ ] Send client asks (see chase list) — responses needed today.
- [ ] Capture audit baseline (55.6/100).

**Day 1–3 — Technical index**
- [ ] GSC property verify + submit sitemap.
- [ ] De-noindex 20+ legacy/staging pages; rebuild sitemap (…3004, high, due 12 Aug).
- [ ] robots.txt + IndexNow.

**Day 1–3 — On-page**
- [ ] URL 301s (dup blog, `/offerings` → `/sacred-offerings`), titles/meta/H1, internal links, alt text (…3005, high, due 12 Aug).

**Day 2–4 — Schema**
- [ ] LocalBusiness + Event (with `eventStatus`) + Organization/Person + coordinate fix (…3006, due 13 Aug).

**Day 3–4 — Assets**
- [ ] OG image on canonical domain + `/llms.txt` (…3007, due 13 Aug).

**Day 4–5 — Analytics + Local**
- [ ] GA4 tag + key events (…3026, high, due 14 Aug).
- [ ] GBP completion + 10 photos + Instagram review link (…3027, due 14 Aug).

**Day 6 — Buffer**
- [ ] Stretch: `/reserve` content rewrite (only if asked).
- [ ] Growth Engine kickoff planning (…3028).

**Day 7 — Sat 15 Aug: Close-out**
- [ ] Re-audit, 90-day roadmap, summary report (…3029, high, due 15 Aug).
- [ ] Invoice STILLNESS-007 cleared (txn `…607`).

## Chase list (Day-1 client asks)

1. **`wearestillness.com`** — keep the domain in the future, or do we pursue recovery/redirects? (decision gates everything entity/NAP)
2. **Corporate logos + testimonials** (TechStream, FlowState, Vantage, Lumina) — can these be verified, or should we remove?
3. **10 GBP photos** — client uploads, or we pull from the studio/events.
4. **WP password rotation** — old password shared in plaintext chat; needs rotation.
5. **PR flag** — `headplusheart.com` outreach (Komal / business development).

## Security flag

WP admin password was shared in plaintext chat — **rotate now**, never store.

## Risks

- `solicate.team@gmail.com` suspended — appeal pending; access runs through `work.yeswanth@gmail.com`.
- GA4 brand-new/empty — no history to compare; set baseline now.
- GSC unverified — verify Day 1 or nothing can be measured.
- Day-1 client decisions can slip → have fallbacks (default: no domain action, remove unverifiable logos).

## Carry-forwards → Growth Engine (phase 4)

Event hub page · `/reserve` funnel · keyword validation · content pillars (90-day).

## Definition of done

- Re-audit score improved over 55.6/100.
- All sprint tasks `done` by 15 Aug (…3004–3009, …3026–3029).
- Summary report + 90-day roadmap delivered.
- Invoice STILLNESS-007 cleared.
