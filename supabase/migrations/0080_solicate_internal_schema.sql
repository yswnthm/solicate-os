-- 0080: solicate internal schema — profile, phases, services, team
--
-- Creates a dedicated `solicate` schema to model the agency itself as a
-- first-class entity, completely separate from client data. Tables can FK
-- into public.people (for partners) and public.app_users (for internal team)
-- and public.transactions (for financials) where necessary.
--
-- Tables:
--   solicate.profile   — singleton agency identity row
--   solicate.phases    — growth eras of the agency
--   solicate.services  — what solicate offers (service lines)
--   solicate.team      — current team + partner network
--
-- Idempotent: uses ON CONFLICT DO UPDATE throughout.

BEGIN;

-- ─── 0. Create schema ───────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS solicate;

-- ─── 1. solicate.profile ────────────────────────────────────────────────────
-- Singleton row. Always query: SELECT * FROM solicate.profile LIMIT 1.

CREATE TABLE IF NOT EXISTS solicate.profile (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL DEFAULT 'Solicate',
  tagline           text,
  founded_on        date,
  target_market     text,
  north_star        text,
  brand_voice       text,     -- intentionally empty; fill when ready; AI agents read this for content drafting
  website_url       text,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

INSERT INTO solicate.profile (
  id, name, tagline, founded_on, target_market, north_star, brand_voice, website_url
) VALUES (
  '839f3512-6097-6d96-9248-01fc2afebeda',
  'Solicate',
  'organic growth and digital presence for small businesses in atlantic canada and beyond',
  '2026-01-02',
  $str$small and growing businesses — individual practitioners, healthcare providers, local service brands, and ecommerce operators — who need real digital traction without an in-house team. primarily atlantic canada (ns, pei, nb) with remote reach globally.$str$,
  $str$become the most trusted growth partner for independent and small businesses in atlantic canada. known for deep strategy, honest execution, and measurable outcomes. not an agency that disappears after launch.$str$,
  '',  -- brand voice: empty for now. fill before agent-assisted content drafting.
  'https://solicate.in'
) ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  tagline       = EXCLUDED.tagline,
  target_market = EXCLUDED.target_market,
  north_star    = EXCLUDED.north_star,
  website_url   = EXCLUDED.website_url,
  updated_at    = now();

-- ─── 2. solicate.phases ─────────────────────────────────────────────────────
-- Growth eras of the agency. Ordered by position.

CREATE TABLE IF NOT EXISTS solicate.phases (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position           int NOT NULL,
  name               text NOT NULL,
  status             text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  started_on         date,
  target_date        date,
  description        text,
  success_definition text,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

INSERT INTO solicate.phases (
  id, position, name, status, started_on, target_date, description, success_definition
) VALUES
(
  '5a647c24-d9c1-1fe2-de56-8d677bfe0805',
  1,
  'phase 1 — foundation',
  'active',
  '2026-01-01',
  '2026-12-31',
  $str$founder-led agency. first paying clients secured and being served. service lines being validated through real work (organic growth, ecomm catalog, web presence). positioning forming through client outcomes. partner network beginning with sakshi. no formal hires yet. revenue is real but not yet predictable.$str$,
  $str$5+ paying clients served. at least 2 of the 3 service lines have proven, repeatable delivery. monthly revenue is consistent. at least one client has renewed or expanded scope. solicate has a clear niche and can articulate who it is for.$str$
),
(
  'df2a47e0-6792-f0b7-75f5-0d943475c4ff',
  2,
  'phase 2 — first 10 clients',
  'planned',
  null,
  null,
  $str$stable base of 10 active or recently-completed clients. 2-3 service lines proven with documented case results. referral pipeline working (clients refer clients). partner network expanded. systems and SOPs exist so delivery is not all in one person's head. revenue is predictable month-to-month.$str$,
  $str$10 clients served (active or completed within 12 months). referral rate: at least 30% of new leads come from existing clients or partners. at least one documented case study per service line. monthly revenue target met consistently for 3+ months.$str$
),
(
  '65a65ed2-7b3b-cc12-ffba-4632b862be80',
  3,
  'phase 3 — team building',
  'planned',
  null,
  null,
  $str$first non-founder hire or dedicated contractor. solicate operates with a team, not just a founder and ad-hoc partners. retainer-first revenue model. documented onboarding and delivery playbooks. solicate brand is visible publicly — case studies, social presence, or thought leadership.$str$,
  $str$at least 1 dedicated team member (employee or long-term contractor). 60%+ of revenue is from retainers or recurring work. delivery playbooks exist for all active service lines. solicate has a public presence that generates inbound leads.$str$
)
ON CONFLICT (id) DO UPDATE SET
  position           = EXCLUDED.position,
  name               = EXCLUDED.name,
  status             = EXCLUDED.status,
  started_on         = EXCLUDED.started_on,
  target_date        = EXCLUDED.target_date,
  description        = EXCLUDED.description,
  success_definition = EXCLUDED.success_definition,
  updated_at         = now();

-- ─── 3. solicate.services ───────────────────────────────────────────────────
-- What solicate offers. Each row = one service line.

CREATE TABLE IF NOT EXISTS solicate.services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  slug             text NOT NULL UNIQUE,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'experimental', 'planned', 'deprecated')),
  description      text,
  pricing_from     numeric(12,2),
  pricing_currency char(3) DEFAULT 'INR',
  model            text CHECK (model IN ('retainer', 'project', 'phase_based', 'hybrid')),
  notes            text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

INSERT INTO solicate.services (
  id, name, slug, status, description, pricing_from, pricing_currency, model, notes
) VALUES
(
  '17576752-89a1-4b9a-b3ad-9583ca535f90',
  'Organic Growth & Positioning',
  'organic_growth',
  'active',
  $str$30-day market discovery, positioning thesis, SEO, content engine, and organic lead acquisition for independent practitioners and growing businesses.$str$,
  15000,
  'INR',
  'phase_based',
  $str$Month 1 = Discovery & positioning thesis. Month 2+ = Distribution & organic lead flywheel. Compliance-aware for regulated domains.$str$
),
(
  '7501a450-ee94-dea5-d2d2-235617ea7bb6',
  'Web Architecture & Design',
  'web_architecture',
  'active',
  $str$High-performance digital presence: custom Next.js/WordPress websites, conversion-focused landing pages, visual branding, and local SEO foundation.$str$,
  20000,
  'INR',
  'project',
  $str$End-to-end design, development, SEO baseline, and handoff. Add-ons include ongoing maintenance retainers and lead funnel integration.$str$
),
(
  'c9f56b15-1439-7789-25a4-05bce04aa7aa',
  'Digital Operations & Infrastructure',
  'digital_operations',
  'active',
  $str$Custom CRM setup, database architecture, automated operational workflows, and analytics tracking to streamline agency and client workflows.$str$,
  10000,
  'INR',
  'phase_based',
  $str$System integrations, data pipelines, automated reporting, and client management tooling.$str$
)
ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  status           = EXCLUDED.status,
  description      = EXCLUDED.description,
  pricing_from     = EXCLUDED.pricing_from,
  pricing_currency = EXCLUDED.pricing_currency,
  model            = EXCLUDED.model,
  notes            = EXCLUDED.notes,
  updated_at       = now();

-- ─── 4. solicate.team ───────────────────────────────────────────────────────
-- Current team and partner network.
-- person_id → public.people (for external partners like Sakshi)
-- user_id   → public.app_users (for internal team like Yeswanth)

CREATE TABLE IF NOT EXISTS solicate.team (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   uuid REFERENCES public.people(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  name        text NOT NULL,
  role        text NOT NULL,
  role_type   text NOT NULL CHECK (role_type IN ('founder', 'employee', 'partner', 'contractor', 'advisor')),
  skills      text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'advisor')),
  joined_on   date,
  notes       text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO solicate.team (
  id, person_id, user_id, name, role, role_type, skills, status, joined_on, notes
) VALUES
(
  'bfd9ec61-a872-38d3-e52a-08528c7bc624',
  null,
  '662c2444-d9c6-4075-904e-5f6333426d55',  -- yswnth app_user
  'Yeswanth',
  'Founder & Growth Lead',
  'founder',
  'strategy, organic growth, web development, next.js, supabase, client management, content direction',
  'active',
  '2026-01-01',
  'founder and primary operator. handles strategy, client delivery, tech infrastructure, and sales.'
),
(
  '9cb86f33-92c3-4aac-cc8c-68288c4a3204',
  '1ce4a5c0-0000-4000-8000-000000000012',  -- Sakshi person record
  null,
  'Sakshi',
  'Partner — Graphic Design & Client Relay',
  'partner',
  'graphic design, branding, client communication, visual content, stillness co ops',
  'active',
  '2026-02-08',
  $str$referral partner and design collaborator. primary relay for stillness co client. partner commission: split per phase decided by solicate based on work done. ₹10,000 redesign share cleared for stillness phase 1.$str$
)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  role       = EXCLUDED.role,
  role_type  = EXCLUDED.role_type,
  skills     = EXCLUDED.skills,
  status     = EXCLUDED.status,
  joined_on  = EXCLUDED.joined_on,
  notes      = EXCLUDED.notes,
  updated_at = now();

COMMIT;
