# Site Health Baseline — Stillness Co (captured 09 Aug 2026)

Baseline for sprint close-out re-audit (15 Aug 2026). Reference score from the
29 Jul audit: **55.6/100**. Live re-capture below uses the same signals so the
15 Aug re-audit is comparable. Task …3031 #2.

## Live checks (09 Aug 2026)

| Signal | Result | Notes |
| --- | --- | --- |
| Homepage load | HTTP 200, ~1.1 s | Loads over canonical `https://stillnesscuratedretreats.com/` |
| `robots.txt` | 200 | Yoast block + WooCommerce disallows; sitemap declared |
| `sitemap_index.xml` | 200 | Yoast, 9 sub-sitemaps |
| Sub-sitemaps | 103 URLs total | post 11 · page 54 · product 23 · metform-form 8 · elementor-hf 2 · product_cat 2 · jkit-footer 1 · category 1 · author 1 |
| Title | `Holistic Wellness Retreats & Experiences in Vancouver \| Stillness \| STILLNESS` | Double brand (`Stillness` + `STILLNESS`) — on-page fix …3005 |
| H1 | `Curated Wellness Experiences` | — |
| Meta description | present | — |
| Canonical | correct → `/` | — |
| `robots` meta | index, follow | — |
| JSON-LD | 1 block present | `WebSite` / `WebPage` / `BreadcrumbList` / `Organization` only — no `LocalBusiness` / `Event` (…3006) |
| OG image | **`hotpink-starling-811825.hostingersite.com`** | Staging/Hostinger subdomain, not canonical — asset fix …3007 |
| Indexation (`site:` query) | **homepage + `/shop/` + blog pages indexed** | Better than the ~0 recorded 29 Jul; verify count in GSC after property verification |

## Baseline finding (mapped to sprint)

1. **OG image on non-canonical domain** — every share pulls a staging-domain URL
   (…3007, confirmed live).
2. **No LocalBusiness/Event schema** on homepage (…3006).
3. **Double brand in title** (`Stillness | STILLNESS`) (…3005).
4. **Indexation is live** but needs GSC verification + sitemap submit to lock
   counts (…3004 / Day 1 GSC).
5. 9-sitemap / 103-URL footprint with Yoast + WooCommerce — index cleanup scope
   (…3004) targets the legacy/staging pages behind it.

## Methodology (so 15 Aug is comparable)

- Reference score carried from 29 Jul audit (55.6/100, exact tool unavailable
  for re-run: PSI quota exhausted, audit runtime not installed).
- Signals above are direct HTTP + rendered-HTML captures on 09 Aug and are the
  comparison set for the 15 Aug close-out re-audit (…3029).

Status: **…3031 #2 baseline captured** — live indexation + schema + OG findings
locked. Remaining kickoff: #1 access confirm (user login pass), #3 client asks
(send to Komal/Sakshi).
