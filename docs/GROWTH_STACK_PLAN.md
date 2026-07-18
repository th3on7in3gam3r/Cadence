# Bible Funland Growth Stack — Master Plan

**Last updated:** 2026-07-07  
**Purpose:** Single reference for integrating AI-CMO, Kerygma Social, CitePilot, and Aegis Loop. Check boxes as work ships.

**Narrative:** *Find it (Aegis) → Get cited (CitePilot) → Strategize & create (AI-CMO) → Publish on autopilot (Kerygma Social).*

---

## How to use this doc

- `[x]` = done (or done in repo; may still need production config)
- `[ ]` = not started
- `[~]` = in progress / partial
- Each item notes **which repo** owns the work
- **Cadence-only add-ons** (team collab, white-label, calendar handoff, competitor watch, Chrome extension): see [ROADMAP.md](./ROADMAP.md)

| Repo | Product | Path on disk |
|------|---------|--------------|
| `ai-cmo` | AI-CMO | `/Users/yahweh/Desktop/ai-cmo` |
| `native-landing` | Kerygma Social | `POST-WICK — FULL PRODUCT BUILD/native-landing` |
| `GrowthEngineAI` | CitePilot | `/Users/yahweh/Desktop/GrowthEngineAI` |
| `Aegis Loop` | Aegis Loop | `/Users/yahweh/Desktop/Aegis Loop` |
| `Pulpit` | Studio hub (optional) | `/Users/yahweh/Desktop/Pulpit/pulpit` |

---

## Architecture snapshot (truth table)

| Product | Auth | Database | Billing | Status |
|---------|------|----------|---------|--------|
| AI-CMO | Supabase Auth | Supabase Postgres | Stripe (scaffolded) | Cloud mode optional; local token fallback |
| Kerygma Social | Clerk | Neon + Drizzle | Stripe | Production app |
| CitePilot | Neon Auth | Neon (+ SQLite local) | Stripe | Production app |
| Aegis Loop | GitHub OAuth | JSON files on disk | Stripe (Team) | Render deploy |

**Important:** These are **not** one shared Supabase project today. Unified login is a deliberate Phase 3+ decision.

---

## Phase 0 — Foundation (per product)

### AI-CMO (`ai-cmo`)

- [x] Supabase cloud auth (Google + email magic link)
- [x] Workspace sync API (`/api/workspace/current`)
- [x] Sign-in gate at `/app` when Supabase configured
- [x] Sign-out redirects to homepage (`/`)
- [x] Returning users skip onboarding when cloud workspace has brand
- [x] Landing page “Sign in to your workspace” when cloud enabled
- [x] Env fallbacks for `NEXT_PUBLIC_SUPABASE_*` keys
- [~] Supabase production keys in `.env.local` (`VITE_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Run `supabase/schema-v2-billing-teams.sql` in Supabase SQL Editor
- [ ] Run `supabase/schema-v3-studio-identity.sql` in Supabase SQL Editor (Phase 3 hub)
- [x] Billing routes + plan limits scaffold (`server/routes/billing.ts`, `server/lib/plans.ts`)
- [ ] Stripe live keys + webhook (`STRIPE_*` in `.env.local`)
- [x] Team / multi-brand API scaffold (`server/routes/teams.ts`)
- [x] Settings UI (General, Brand kit, Integrations, Billing, Team, Agency)
- [x] Deep crawl gating by plan (Free vs Pro vs Team)
- [x] SEO Agent quick vs deep crawl UI
- [ ] Production deploy with `APP_URL` + Supabase redirect URLs

### Kerygma Social (`native-landing`)

- [x] Clerk auth (`/sign-in`, `/sign-up`)
- [x] Neon Postgres + Drizzle
- [x] Stripe billing
- [x] Social publishing (Meta, LinkedIn, X, Pinterest)
- [ ] Phase 1 SEO: auth page metadata + `robots.ts` parameter rules (see separate SEO task list)
- [ ] Sister-product links (CitePilot, Aegis, AI-CMO) on marketing pages
- [ ] Pricing H1 keyword optimization (`src/app/pricing/page.tsx`)

### CitePilot (`GrowthEngineAI`)

- [x] Neon Auth + Neon Postgres
- [x] GEO audits + citation tracking
- [x] Stripe billing
- [ ] Public read API for partner apps (domain → citation summary)
- [ ] API keys / OAuth for third-party integrations (AI-CMO, Kerygma)
- [ ] Document API in `llms.txt` or OpenAPI spec

### Aegis Loop (`Aegis Loop/code`)

- [x] GitHub OAuth dashboard login
- [x] Code / Cloud / Attack / Protect modules
- [x] Stripe Team billing
- [ ] Custom domain live (`aegisloop.dev`)
- [ ] Public URL probe API (headers + security summary for a given URL)
- [ ] Rate-limited partner endpoint for marketing apps (no full scan quota burn)

---

## Phase 1 — Cross-link & discover (no shared login)

**Goal:** Users discover the stack; each product keeps its own account.

### Marketing / footer blocks

- [x] AI-CMO homepage: “Part of the growth stack” section with links
- [x] Kerygma homepage: sister-product strip (CitePilot, Aegis, AI-CMO)
- [x] CitePilot homepage: link to Kerygma + AI-CMO for content execution
- [x] Aegis Loop: CitePilot block already exists — add Kerygma / AI-CMO where relevant
- [x] Consistent studio branding (Bible Funland Studios link)

### Deep links (URL contract)

| From | To | URL pattern |
|------|-----|-------------|
| Any | CitePilot audit | `https://getcitepilot.com/audit?domain={domain}` |
| Any | Kerygma sign-up | `https://kerygmasocial.com/sign-up?url={encodedUrl}&redirect_url=/onboarding` |
| Any | Aegis Loop | `https://aegis-loop.com/` |
| Any | AI-CMO app | `{VITE_APP_URL}/app` — see `docs/DEEP_LINKS.md` |

- [x] Document deep-link contract (`docs/DEEP_LINKS.md`)
- [x] Add “Open in CitePilot” link from AI-CMO SEO Agent
- [x] Add “Generate posts” link from CitePilot → Kerygma (post-audit CTA)

---

## Phase 2 — API integrations (federated apps)

**Goal:** AI-CMO shows data from CitePilot & Aegis without merging codebases.

### CitePilot → AI-CMO

- [x] CitePilot: `GET /api/v1/citations?domain=` (partner read API)
- [x] AI-CMO: Settings → Integrations → CitePilot API key
- [x] AI-CMO: SEO Agent panel — citation score + trend
- [x] AI-CMO: Dashboard widget — “AI visibility this week”
- [x] Error/empty states when CitePilot not connected

### Aegis Loop → AI-CMO (marketer-safe)

- [x] Aegis: lightweight `GET /api/v1/url-check?url=` (headers, HTTPS, disclosure)
- [x] AI-CMO: security summary in SEO Agent + dashboard (via growth stack proxy)
- [x] AI-CMO: SEO Agent — “Security headers” row with link to full Aegis report
- [x] Clear copy: marketers see summary; devs use Aegis dashboard for fixes

### Kerygma ↔ AI-CMO (content handoff)

- [x] Define overlap: AI-CMO = strategy/SEO/long-form; Kerygma = social autopilot (`docs/KERYGMA_HANDOFF.md`)
- [x] Export campaign bundle from AI-CMO → import or link to Kerygma queue (spec only)
- [x] Shared brand URL as join key across products
- [ ] Agency white-label report exports both SEO + social metrics (future)

---

## Phase 3 — Unified identity (decision required)

**Goal:** One email, multiple products. Pick **one** path — do not build all three.

**Decision (2026-07-07):** **Option D — Hub first** (Pulpit-style product map + identity table in AI-CMO). Sister products keep their own auth (Clerk / Neon / GitHub) for now; users link accounts by email or GitHub username in Settings → Studio. Full SSO migration (Options A–C) deferred until Phase 4 billing bundles prove value.

### Decision checklist

- [x] **Decision recorded:** Auth provider for marketing suite → **Hub-first (Option D)**; SSO provider TBD when bundling ships  
  - Option A: **Clerk** (Kerygma already on it)  
  - Option B: **Supabase Auth** (AI-CMO already on it)  
  - Option C: **Neon Auth** (CitePilot already on it)  
  - Option D: **Hub only** (Pulpit-style product map, no SSO) ← **shipped first**

### If Clerk wins

- [ ] Migrate AI-CMO from Supabase Auth → Clerk
- [ ] Migrate CitePilot from Neon Auth → Clerk (or keep Neon DB, swap auth)
- [ ] Clerk Organizations for agency multi-brand
- [ ] Aegis stays GitHub OAuth; link by email in hub table

### If Supabase wins

- [ ] Migrate Kerygma Clerk → Supabase Auth
- [ ] Migrate CitePilot Neon Auth → Supabase Auth
- [ ] Single Supabase project or org-per-product with shared `auth.users`

### Hub identity table (works with any option)

- [x] Table: `studio_accounts` (`supabase/schema-v3-studio-identity.sql`)
- [x] API: `GET/PATCH /api/studio/identity`
- [x] “Connected products” UI — Settings → **Studio** tab
- [x] Product switcher in app header (“Stack” dropdown)
- [ ] Product switcher shared as npm package / copy to Kerygma & CitePilot (future)

**Aegis note:** Keep GitHub login for Aegis. Link hub row via primary email or explicit “Connect GitHub” in settings.

---

## Phase 4 — Unified billing

**Goal:** One Stripe customer; bundle plans across products.

- [x] Stripe Products: Growth (CMO + CitePilot), Social (Kerygma), DevSec (Aegis Team), Studio Bundle (`server/lib/bundles.ts`)
- [x] Metadata on checkout: `supabaseUserId`, `bundleId`, linked studio IDs (`server/routes/billing.ts`)
- [x] Webhook router: AI-CMO Stripe webhook + HMAC fan-out to sister apps (`server/lib/billingFanout.ts`)
- [x] AI-CMO: bundle checkout + portal + Settings → Billing UI
- [x] Kerygma: partner endpoint `/api/partner/studio-billing`
- [x] CitePilot: partner endpoint `/api/partner/studio-billing`
- [x] Aegis: partner endpoint `/api/partner/studio-billing`
- [x] Customer portal shows all active subscriptions (Stripe list + portal button)
- [ ] Stripe live price IDs in production `.env.local` (see `docs/STRIPE_BUNDLES.md`)
- [x] Kerygma pricing page: bundle CTA → AI CMO checkout (`StudioBundleCta`)
- [x] CitePilot pricing page: Growth / Studio bundle CTA (`StudioBundleCta`)

---

## Phase 5 — Studio hub (optional, Pulpit model)

**Goal:** One landing place listing all connected products (like Pulpit hub diagram).

- [x] Studio hub at `{VITE_APP_URL}/studio` (`src/pages/StudioHubPage.tsx`)
- [x] In-app studio dashboard at `/app/studio` (`src/pages/StudioDashboard.tsx`)
- [x] Public catalog API `GET /api/studio/catalog`
- [x] Product cards: Vesper, Kerygma, CitePilot, Aegis, AI-CMO, RhemaNote, Pulpit
- [x] Onboarding: “What do you need?” persona router → recommended product + bundle
- [x] Connect flow links → AI CMO Settings → Studio + Billing
- [x] Persona section on AI-CMO landing (`PersonaSection.tsx`)
- [x] Studio nav tab in app header + Stack dropdown links
- [x] Pulpit: growth-stack section on landing + dashboard strip
- [ ] Extend Pulpit dashboard with API-key connections for growth products (future)
- [ ] Shared admin for platform ops (future)

---

## Persona bundles (GTM reference)

| Persona | Primary product | Add-ons |
|---------|-----------------|---------|
| Church / local business | Kerygma Social | CitePilot audit, AI-CMO strategy |
| Marketing agency | AI-CMO + CitePilot | Kerygma per client, white-label PDFs |
| SaaS / dev shop | Aegis Loop | CitePilot (AI buyer visibility) |
| Content-first founder | AI-CMO | Kerygma for distribution |

- [x] Landing pages per persona (sections on `/` and `/studio`, not separate sites)
- [x] Pricing page reflects bundles (Phase 4 + landing `#pricing`)

---

## AI-CMO — session log (completed in repo)

Track recent AI-CMO work so this plan stays accurate:

- [x] Onboarding: welcome step + brand setup; `heardFrom` field
- [x] App header: two-row nav; Home as first tab
- [x] Settings: removed duplicate War Room button + AI team panel
- [x] Settings: workspace context strip (brand, cloud account, storage)
- [x] Cloud hydration skips onboarding for returning users with saved brand
- [x] `SelectField` / `TextField` UI components
- [x] Lint + tests passing (13 tests at last check)

---

## Environment checklist (AI-CMO production)

Copy to `.env.local` / hosting provider:

```bash
# Required for cloud mode
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Required for hosted AI
GEMINI_API_KEY=

# Optional local dev token (when cloud off)
CMO_API_TOKEN=
VITE_CMO_API_TOKEN=

# Production URL (OAuth redirects)
APP_URL=https://your-cmo-domain.com/

# Billing (when ready)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_TEAM_MONTHLY=
```

- [ ] All required vars set in production
- [ ] Supabase Auth redirect URLs include production `APP_URL/app`
- [ ] Google OAuth enabled in Supabase (if using Google sign-in)

---

## Open decisions (fill in as you decide)

| # | Question | Decision | Date |
|---|----------|----------|------|
| 1 | Primary auth for marketing suite | **Hub-first (Option D)**; full SSO TBD | 2026-07-07 |
| 2 | Cadence production domain | **growth.biblefunland.com** | 2026-07-08 |
| 3 | Cadence vs Kerygma SKU | **Separate SKU** (Cadence = strategy/SEO; Kerygma = social) | 2026-07-08 |
| 4 | CitePilot public API versioning | _TBD_ | |
| 5 | Studio hub: extend Pulpit vs new site | _TBD_ | |

---

## Suggested 90-day order

1. **Weeks 1–2:** Phase 0 gaps (Supabase schema, service role key, AI-CMO deploy)
2. **Weeks 3–4:** Phase 1 cross-links on all four homepages
3. **Weeks 5–8:** Phase 2 CitePilot API in AI-CMO SEO Agent
4. **Weeks 9–10:** Phase 2 Aegis URL check in AI-CMO
5. **Weeks 11–12:** Phase 3 decision + spike (Clerk vs Supabase vs hub-only)
6. **Ongoing:** Phase 4 billing bundles after Phase 2 proves value

---

## Revision history

| Date | Change |
|------|--------|
| 2026-07-07 | Initial plan: architecture truth table, Phases 0–5, AI-CMO session log |
| 2026-07-07 | Phase 1 complete: cross-links, growth stack sections, deep links (`docs/DEEP_LINKS.md`) |
| 2026-07-07 | Phase 2 complete: CitePilot `/api/v1/citations`, Aegis `/api/v1/url-check`, AI-CMO live panels |
| 2026-07-07 | Phase 3 hub: `studio_accounts`, `/api/studio/identity`, Settings Studio tab, header product switcher |
| 2026-07-07 | Phase 4: studio bundles, Stripe fan-out, partner webhooks — `docs/STRIPE_BUNDLES.md` |
| 2026-07-08 | Rebrand: **Cadence** at `growth.biblefunland.com` (display name; internal `ai_cmo` IDs unchanged) |
