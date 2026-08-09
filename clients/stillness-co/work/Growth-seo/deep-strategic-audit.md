# Stillness Co. — Deep Strategic Audit & Foundation Strategy
**Purpose of this document:** This is the strategic layer underneath the Growth Foundation execution plan. It's built from a direct review of the live site (stillnesscuratedretreats.com), its sub-pages, the local competitive landscape, and the brand's footprint across Instagram, Facebook, and Eventbrite — not just the 29 Jul audit score. It exists to answer one question honestly: **if this foundation is built well, is the upside actually 100× larger — or does something structural cap it before we even start?**

Two things up front:

1. **This is not a bigger to-do list.** It's a prioritization layer. Some of what's below belongs inside the existing six-day Growth Foundation sprint at no extra cost. Some of it is bigger than that sprint and needs an honest conversation with Komal before anyone touches it. Each finding below is tagged accordingly — see §0.
2. **No promises about rankings or traffic.** What follows is about removing structural drag and building assets that compound — not guaranteeing outcomes neither of us controls.

---

## 0. How to read this — Priority Tiers

| Tier | Meaning | Cost to the Growth Foundation sprint |
|---|---|---|
| **P0 — Foundation-breaking** | Actively works against everything else we do. Fix before or alongside anything else. | Mostly small, fast fixes — fold into existing workstreams |
| **P1 — Structural** | Shapes whether the site *can* build authority, not just whether it looks clean | Fits inside existing workstream scope with minor time reallocation |
| **P2 — Compounding** | Doesn't fix anything broken — builds assets that make every future dollar of work worth more | Partially in-scope now (schema, IA groundwork); most of the depth is Growth Engine work |
| **P3 — Opportunity** | Real, found opportunity outside the original brief entirely | Out of scope for the Foundation — decision item for Komal |

---

## 1. P0 — Foundation-Breaking Findings

### 1.1 A second, near-duplicate live website: wearestillness.com

While reviewing the site's footprint, **wearestillness.com** turned up as a fully live, separately indexed WordPress site — same builder (Elementor), same developer credit ("Solicate"), and page-for-page overlapping structure (`/about`, `/corporate`, `/sacred-offerings`, `/shop`, `/blogs`, `/reserve`). Its `/about` page is close to word-for-word the same founder story as stillnesscuratedretreats.com/about, but it's a **separately hosted, separately indexed copy** — different canonical tag (self-referencing, not pointing to the primary domain), its own uploaded images, its own footer copyright ("Stillness Wellness Co."), and its own contact email (`hello@stillness.com` — a *third* email address, alongside `info@stillnesscuratedretreats.com` and `info@wearestillness.com`). Its footer social icons are dead placeholder links (`#`), and it still greets US visitors with a USD currency prompt.

**Why this is P0, not a nice-to-have:** duplicate, competing domains split whatever authority the primary domain earns, confuse Google about which entity is canonical, and risk diluting exactly the ranking gains the Growth Foundation is trying to build. No amount of on-page or schema work on stillnesscuratedretreats.com fully protects against a second live domain making near-identical claims.

**What we need from Komal before/at Day 1 kickoff:** Does the studio still control wearestillness.com? Was it meant to be retired when the site was rebuilt onto stillnesscuratedretreats.com? This determines the fix:
- If controlled: 301-redirect the whole domain to the matching pages on stillnesscuratedretreats.com (highest-value fix — passes any link equity wearestillness.com may have accumulated since 2024/2025 straight to the live site).
- If not controlled or access is unclear: noindex isn't available to us, so this becomes a domain-recovery conversation, not an SEO task — flagged as a decision item, not something the Growth Foundation sprint can resolve alone.

This is arguably the single highest-leverage item in this entire review. Everything else compounds better once this is resolved.

### 1.2 The primary booking page doesn't describe the business

`/reserve` — linked from nearly every high-intent CTA on the site (About page's five "See Upcoming Dates" buttons, all three Corporate package "Inquire Now" buttons, the Curated Calm membership's "Enroll Now") — currently describes **"immersion chambers," "lockers," "hallways," and "changing rooms."** That's spa/float-tank template language. It doesn't match the actual experience described everywhere else on the site: outdoor, on-the-water floating sessions at rotating private locations in Surrey/White Rock/Langley, or indoor studio sessions.

**Why this matters more than a typo:** this is the page carrying the site's highest-value conversions — including the $3,333/year membership and the $150–170/person corporate packages. A visitor who read the founder's honest, specific, non-mystical brand voice on the About page lands on generic wellness-spa boilerplate at the exact moment they're ready to commit. That's a conversion leak, not a cosmetic issue.

**Recommendation:** rewrite `/reserve` to match the real experience and route by offer type (see §6 — right now, three very different offers — event tickets, corporate inquiries, and membership enrollment — all funnel into one undifferentiated page).

### 1.3 A sitewide broken link, in the footer, on every page

The footer "Sacred Offerings" link (present on every page we reviewed) points to `/offerings`, which returns a 404. The main navigation correctly points to `/sacred-offerings`. Same mistake appears again on the Curated Calm page ("Other Rituals" → `/offerings`). Because it's in the footer, it's a **sitewide** broken internal link — the kind of thing that quietly leaks crawl budget and link equity into a dead end on every single page. Trivial to fix (correct the footer link target), disproportionately worth fixing given how many pages it touches.

### 1.4 Corporate page: client logos and testimonials that don't trace to anything

The `/corporate` page displays four client logos ("TECHSTREAM," "FlowState," "VANTAGE," "LUMINA") and two named testimonials — a "VP of Product, TechStream" and "People Operations, FlowState" — that don't correspond to any client, contact, or account referenced anywhere in this engagement's context, and read like unedited template placeholder content that a website theme ships with by default.

**We're not assuming bad intent here — this is very likely leftover template content that never got swapped for real clients.** But it needs a direct answer before this page gets more traffic (which is a direct goal of this phase): if these are real past clients, we should confirm names/logos are cleared for use and add genuine proof (a short case study, a real logo, a LinkedIn-verifiable name). If they're template filler, they should come down. Once corporate outreach or paid traffic increases visibility on this page, unverifiable client claims stop being a low-stakes design detail and start being a credibility risk.

Same page also states specific statistics — "40% Reduction in stress biomarkers after one float," "50% Improvement in creative problem solving," "2× Better sleep quality" — with no citation. Either source them to something real and cite it, or soften them to honest, non-numeric claims. Specific, uncited numbers in a wellness/health context are the kind of thing that erodes trust the moment a skeptical visitor (or a corporate procurement team, exactly the audience this page targets) tries to verify them.

### 1.5 A geographic detail that's simply wrong

Both `/sacred-offerings` and `/curated-calm` display a coordinate stamp — **"43° N / 79° W" — "Canada's First Sanctuary."** Those coordinates are Toronto/Niagara, not Vancouver (Vancouver is roughly 49°N / 123°W). It's a small decorative branding element, but it's factually incorrect for a business whose entire positioning is "we're a Vancouver company" — and, notably, 43°N/79°W sits right around where a same-named competitor actually operates (see §5.3). Easy fix, worth doing precisely because it's so easy and so visible to anyone who checks.

---

## 2. P1 — Structural Findings (Information Architecture, Content, Indexing)

### 2.1 Every dated event page competes with itself for the same keyword

The Events page structure creates one live URL per dated session — e.g., `/product/floating-sound-breath-journey-aug8/`, `/product/floating-sound-breath-journey-aug-17/`, `/product/floating-sound-breath-journey-aug-22/` — each with nearly identical title and description ("Realign the nervous system, release deep structural tension..."), differentiated only by date. That's **keyword cannibalization**: instead of one strong, evergreen page consolidating authority for "floating sound bath Vancouver" (or "floating sound bath Surrey"), that authority gets split across dozens of thin, near-duplicate, date-stamped pages — many of which go stale (sold out, past) and stay live and indexable indefinitely.

**Recommendation:** build one evergreen hub page — "Floating Sound Bath — Greater Vancouver" — that owns the head term, explains the format, showcases the "76+ Events Hosted" proof point, and links out to the current live Eventbrite/product listings as *instances* of that offering, rather than each instance trying to rank on its own. This is exactly where Event schema with `eventStatus` (see §2.3) does double duty — it lets each dated instance carry structured, machine-readable status without needing to individually out-rank its siblings in organic search.

### 2.2 A duplicated blog post, live under two URLs

"Why Mindfulness & Breathwork Are Essential for Emotional Regulation" is published twice, at two different URLs — one ending `-2`, one without. Same title, same content pattern. This is textbook duplicate content and an easy, fast fix (301 the weaker one into the stronger one, or differentiate and re-target if the intent was actually two different angles).

Separately: three of the seven blog posts open with the near-identical phrase "In today's fast/busy-moving world..." — a formulaic pattern that reads as templated rather than distinct, and does nothing to leverage the founder's genuinely strong, specific voice that's on full display on the About page. The blog is currently the site's weakest content relative to its brand voice, which is the opposite of what should be true — the blog is the part of the site built specifically to earn search visibility.

### 2.3 Event schema should carry `eventStatus` now — it's the technical seed of the cancelled-events feature

The client's new request (display upcoming/sold out/done/cancelled states) was correctly scoped out of this phase as a front-end feature. But **Schema.org's Event type has a built-in `eventStatus` property** (`EventScheduled`, `EventCancelled`, `EventPostponed`, `EventRescheduled`) that is squarely inside the Growth Foundation's existing Workstream D (Event schema). Building the schema now with status values populated correctly means: (a) the Foundation's committed schema work is more complete and standards-correct from day one, and (b) whenever the front-end display feature gets built in Phase 2, the underlying data structure is already there — that phase becomes a display/UI task instead of a data-modeling task. No added scope now; meaningfully less scope later. Worth flagging to Komal as a small, direct example of "this phase sets up the next one."

### 2.4 Conflicting header navigation on `/reserve`

`/reserve` renders two different navigation rows with different labels ("Corporate / Sacred Offerings / Shop / Blog / About / **Book**" and, below it, "**Philosophy** / Sacred Offerings / Shop / Blog / About / **Book Session**") — inconsistent with the single, clean nav on every other page. Combined with the original brief's note that a "site header conflict" was already fixed once, this looks like a remnant of that same underlying theme/template conflict resurfacing on one page. Worth a specific check on this page during the technical pass, not just a general nav review.

### 2.5 Brand identity fragmentation (NAP/entity consistency)

Across the pages reviewed, the business appears under at least three name variants ("Stillness," "Stillness Co.," "Stillness curated retreats," "Stillness Wellness Co."), three email addresses (`info@stillnesscuratedretreats.com` displayed / `info@wearestillness.com` actual mailto / `hello@stillness.com` on the secondary domain), and effectively two domains. For local SEO, Google leans heavily on **NAP (name/address/phone) and entity consistency** across the website, GBP, and citations. Right now, that consistency doesn't exist. Resolving §1.1 (the duplicate domain) and standardizing on one legal/display name across every footer, meta tag, and schema block is foundational — not cosmetic — for how confidently Google (and Google's Knowledge Graph) can associate reviews, citations, and links with a single entity.

---

## 3. P2 — Compounding Assets (Build Once, Benefit Repeatedly)

### 3.1 The real growth architecture: floating sessions are the front door, not the whole house

The site's actual monetization isn't evenly distributed. The floating sound bath ($40–70/ticket) is the visible, shareable, search-friendly flagship — but the **Sacred Offerings memberships** (Curated Calm at $3,333 CAD/year, The Stillness Habit at $333–488) and **corporate packages** ($150–170/person, up to a 12-session commitment) carry dramatically higher lifetime value per customer. Right now there's no visible content path connecting the two — someone searching "sound bath Vancouver" has no obvious next step toward the membership tier once they've attended a session.

**Recommendation for the content strategy (Growth Engine, but worth architecting now):** treat the floating sound bath as top-of-funnel discovery content (it's the most search-friendly, most shareable, most media-friendly offering — lean into it for SEO and PR), and build a deliberate content bridge — post-session email sequence, blog content, on-site cross-links — from that top-of-funnel entry point toward the membership and corporate pages. This is full-funnel growth architecture, not just ranking work, and it's exactly the kind of foundation that makes every future piece of content worth more.

### 3.2 Founder-led E-E-A-T is a genuine asset, and it's underused outside the About page

Komal's founder story — certified facilitator, personal narrative, specific and non-mystical voice, "since Summer 2024," first-person account of building the business out of her own experience — is strong, differentiated content that search engines increasingly reward (Google's guidance on content quality explicitly weighs Experience and Expertise). It currently lives almost entirely on `/about`. None of the blog content carries her voice; it reads generic by comparison. Structuring future content (and even Person/Organization schema — see Workstream D) around her as a named, credentialed practitioner — not just "Stillness the brand" — is a compounding trust asset that a faceless competitor can't easily copy.

### 3.3 Topical content pillars (replacing the current scattershot blog)

Based on the site's actual offerings and the competitive gaps found in §5, four pillars make sense as the backbone of a content plan:

| Pillar | Anchors search intent for | Feeds |
|---|---|---|
| Floating Sound Bath / Outdoor Sound Healing | "floating sound bath Vancouver/Surrey," format-specific informational queries | Flagship discovery, PR, differentiation vs. pool-based competitors |
| Breathwork & Nervous System Regulation | "breathwork Vancouver," anxiety/stress-relief informational queries | Existing blog strength, evergreen search demand |
| Corporate Wellness & Workplace Burnout | "corporate wellness Vancouver," HR/People-Ops-facing queries | Corporate page, B2B lead gen |
| Family & Children's Emotional Tools | Long-tail parenting/emotional-regulation queries | Shop products (card decks), differentiated from every sound-bath competitor found in this review — none of them have a family/kids angle |

This structure is a recommendation for how the 90-day roadmap and future content should be organized — it doesn't require rebuilding anything in the six-day sprint, but the internal linking work in Workstream C should anticipate it (link toward pillar-shaped groupings, not just fix what exists).

---

## 4. Keyword & Search-Intent Map

Directional, based on patterns observed across search results, competitor positioning, and the site's own offerings — not pulled from a paid keyword-volume tool. Treat as a prioritization starting point; validating actual volume/difficulty is a fast, worthwhile Growth Engine task.

| Intent stage | Example terms | Notes |
|---|---|---|
| **Transactional / bottom-funnel** | "floating sound bath Vancouver," "sound bath Surrey BC," "book sound healing Vancouver," "corporate wellness Vancouver" | Highest commercial value; needs the hub-page fix in §2.1 to have anywhere strong to rank |
| **Mid-funnel informational** | "what is a floating sound bath," "benefits of breathwork," "how does sound healing work," "nervous system regulation techniques" | Blog's natural territory — currently underserved by generic content (§2.2) |
| **Top-funnel / broad** | "burnout recovery," "stress relief Vancouver," "workplace burnout statistics" | Best fit for the Corporate pillar; also useful for earning backlinks/PR |
| **Local/geo-modifiers** | Add "Surrey," "White Rock," "Langley," "Greater Vancouver" alongside "Vancouver" | Sessions genuinely happen across all these areas — the site currently over-indexes on "Vancouver" alone |
| **Geo-disambiguation** | "Vancouver, BC," "Vancouver, Canada" explicitly, not just "Vancouver" | See §5.1 — "Vancouver" alone collides heavily with Vancouver, Washington, USA in search results |
| **Branded (use with caution)** | "Stillness Vancouver," "Stillness sound bath" | See §5.3 — "Stillness" is a heavily reused name in this niche; don't over-rely on brand-only queries carrying the SEO plan |

---

## 5. Competitive Landscape

### 5.1 A real, non-obvious risk: "Vancouver" is ambiguous in search

A significant share of "sound bath Vancouver" search results returned belong to **Vancouver, Washington** (a distinct US city near Portland, OR), which has its own active sound bath/float scene on Yelp and Eventbrite. Every piece of content, schema, and GBP data needs to explicitly disambiguate — "Vancouver, BC," "Vancouver, Canada," or "Greater Vancouver, British Columbia" — rather than assuming "Vancouver" alone is unambiguous. This is a small phrasing discipline with outsized effect on whether the right audience finds the site.

### 5.2 Direct and format competitors identified

| Competitor | Format | Notes |
|---|---|---|
| Faye Mallett / "The Bowls" | Studio, infrared-heated room, Polyvagal-Theory-informed | Positions on clinical/scientific framing — a content angle worth matching or differentiating from |
| Ritual Urban Retreat | Studio, monthly sound healing + tea/journaling | Direct studio competitor |
| TurF (Kitsilano) | Monthly Yin Yoga + Sound Bath | Combines modalities, similar to Stillness's "pairs with" framing |
| Kolm Kontrast | Sauna/ice bath facility with sound-enhanced sessions | Rides the broader cold-plunge/sauna wellness trend |
| ARC Restaurant "Sunset Float" (downtown Vancouver) | Rooftop **pool** floating sound bath, dining add-on | Direct "floating sound bath" format competitor — but indoor/pool, not outdoor/open-water |
| The Parkside Hotel, Victoria — "Drift" | Hotel **pool** floating sound meditation, $65/75 min | Near-identical pricing and format to Stillness's floating sessions — useful pricing benchmark |
| headplusheart.com | Independent roundup: "Vancouver Sound Baths: Best Experiences & Teachers" | **Not a competitor — a PR/outreach target.** Already ranks and curates exactly this niche; getting Stillness included would be a genuine backlink + qualified-referral win |

**The differentiation this surfaces:** every "floating sound bath" competitor found operates in an indoor hotel/spa pool. Stillness's outdoor, open-water format (Surrey/White Rock/Langley) appears to be genuinely distinct — not just marketing language. That's a defensible, factual positioning angle worth stating explicitly and often in content and schema ("Greater Vancouver's outdoor floating sound bath" vs. competitors' pool-based indoor version), rather than leaving it implicit.

### 5.3 Brand-name collision: "Stillness" is heavily oversaturated in this exact niche

Beyond generic "stillness" retreat/spiritual content (Eckhart Tolle's *Stillness Speaks*, assorted retreat centers), there is a **directly name-colliding competitor in the same country and the same modality**: **The Stillness Sound Bath Studio** (thestillness.ca), an established, well-reviewed sound bath studio in Toronto with its own YouTube channel, Eventbrite presence, and Google-indexed reviews. There's also a UK-based "Stillness In Sound" collective and a "The Sound & Stillness Co." Given this, branded search terms ("Stillness sound bath," "Stillness Vancouver") will likely always carry some dilution risk from these other entities.

**Strategic implication:** the SEO plan shouldn't lean on brand-only search volume as a primary growth lever — the non-branded, hyper-local, format-specific terms in §4 (and the founder's name, "Komal," as a named-practitioner asset) are more winnable and more ownable than the word "Stillness" by itself ever will be.

---

## 6. Conversion Path Audit

Every major CTA on the site was traced to its destination. The pattern is consistent: **high-value, consultation-style offers all route to one generic page, while the one page that's actually working well (event ticketing via Eventbrite) is well-integrated.**

| Source | CTA | Destination | Issue |
|---|---|---|---|
| About page (×5 modality sections) | "See Upcoming Dates" | `/reserve` | Generic templated copy, mismatched to the actual experience (§1.2) |
| Corporate page (×3 packages) | "Inquire Now" | `/reserve` | Same — a B2B inquiry shouldn't route through a consumer float-therapy booking template |
| Corporate page | "See Packages" | `javascript:void(0)` | Dead link — does nothing |
| Curated Calm ($3,333/yr membership) | "Enroll Now" | `/reserve` | Highest-value offer on the site funnels into the least-matched page |
| Curated Calm | "Book Discovery Call" | `/contact` | `/contact` only mentions corporate inquiries in its copy — doesn't acknowledge membership discovery calls |
| Reserve page (all bookings) | "Continue to Eventbrite" | eventbrite.ca | **This part works well** — ticketed events are cleanly handed off to Eventbrite |

**Recommendation:** differentiate the funnel by offer type rather than routing everything through one page — event tickets stay on the Eventbrite path (it works), but corporate inquiries and membership enrollment need their own clear, correctly-worded landing/contact experience. This is a conversion-rate fix, not an SEO fix, but it sits directly on top of the traffic this phase is working to earn — sending more visitors to a mismatched funnel doesn't help the business even if rankings improve.

---

## 7. Trust Signal Summary

**Genuine strengths to protect and amplify:**
- Specific, credible social proof already on the homepage (three distinct, non-generic testimonials; "400+ guests," "76+ events hosted," "since Summer 2024")
- A founder story with real specificity and a consistent, honest voice — rare in this niche, where much of the competitive content leans mystical/vague
- An actual, factual differentiator (outdoor/open-water floating format) that most competitors can't claim

**Risks to resolve before they scale with traffic:**
- Unverified corporate logos/testimonials (§1.4)
- Uncited specific health statistics (§1.4)
- Brand/domain/email fragmentation (§2.5)
- No schema-marked review/rating data yet, despite having genuine testimonial content to work with

---

## 8. How This Maps Back to the Six-Day Sprint

| Finding | Tier | Action for the Growth Foundation (09–15 Aug) |
|---|---|---|
| wearestillness.com duplicate domain | P0 | Raise with Komal Day 1 as a decision item — resolution likely exceeds sprint scope, but the *decision* needs to happen now |
| /reserve content mismatch | P0 | Flag as a stretch goal for the Day 6 buffer if time allows; otherwise a clearly scoped Growth Engine item — don't let it silently absorb sprint time |
| Footer /offerings 404 | P0 | Small fix — fold into Workstream C (on-page fixes) at no added cost |
| Corporate logos/testimonials | P0 | Can't be resolved by the strategist alone — needs Komal to confirm real vs. placeholder; raise as a Day 1 decision item |
| Coordinate/geography error | P0 | Trivial fix — fold into Workstream C |
| Event page cannibalization / hub page | P1 | Flag in the 90-day roadmap; building the hub page itself is Growth Engine scope, but Workstream D's Event schema should be built with this structure in mind |
| Duplicate blog post | P1 | Fold into Workstream C (on-page) — quick 301/consolidation |
| eventStatus in Event schema | P1 | Already inside Workstream D — just needs the status values populated correctly, no added scope |
| Conflicting /reserve navigation | P1 | Fold into Workstream C's technical QA pass |
| Content pillar structure | P2 | Roadmap-level guidance for the 90-day plan; not sprint work |
| Full internal-linking rebuild toward pillars | P2 | Growth Engine |
| PR outreach to headplusheart.com | P3 | Outside SEO scope entirely — a business-development opportunity worth flagging to Komal directly, timing is flexible |

---

## 9. What "100× the Foundation" Actually Means Here

Not a promise of 100× traffic — a promise that the site stops working against itself. Concretely: one canonical domain instead of two competing ones; one strong hub page earning authority instead of forty thin pages splitting it; funnels that match the offer being sold; trust signals that hold up under scrutiny; and a content structure built around the one asset (Komal's founder-led, outdoor-floating, non-mystical positioning) that nothing else in this competitive set can copy. That's the foundation "100× more potential" actually rests on — and it's why several of the findings above matter more than any single ranking factor in the original audit.
