# Conventions — Rainey Laguna stack

> **Read this file first, every session.** It is the single highest-leverage
> artifact in the meta-repo. Its job is to keep the four products and their
> meta-repo coherent across AI sessions, where pattern drift is the dominant
> risk.
>
> If you are an AI agent starting a session: paste the section relevant to
> your task into your working context before writing any code. Do not infer
> conventions from the existing files alone — the existing files were
> written across many sessions and may quietly contradict each other. This
> document is what they are converging toward.
>
> If you are Stuart: when you make a non-trivial decision in a session,
> open a PR to this file before opening one to a product repo. Doc-first
> beats code-first when the bottleneck is coherence, not implementation.
>
> **Last refreshed:** 2026-05-06 · **Owner:** Stuart Rainey

---

## 0 · How to use this file

This document is canonical for the **whole stack**. Every product repo also
has a thin `CONVENTIONS.md` of its own that *links here first* and only
adds product-specific rules below the link.

Sections are independently citeable. When asking an agent to do work, paste
in the sections that govern it. Typical pairings:

| Task | Sections to load |
|---|---|
| Add a new feature to any Next.js app | §1, §3, §4, §5, §7, §11, §13 |
| Touch the database | §1, §6, §7, §8, §11 |
| Add or modify an API route | §1, §6, §10, §11, §12, §13 |
| Write tests | §13 (and the relevant test catalog in `TESTS.md`) |
| Write any user-facing copy | §1, §15 |
| Webhook work | §6, §7, §10, §11, §13 |
| Cross-repo contract change | §1, §6, §14 |
| Spin up a new service / repo | the entire file |

If a section disagrees with the code: the code wins **for the next 24
hours**, then this file wins (the divergence becomes a bug). Open a PR to
reconcile within that window.

---

## 1 · The stack — what exists, what it owns

Five repositories under `datacendia/` on GitHub.

| Repo | URL | Local path | Role |
|---|---|---|---|
| `rainey-stack` | github.com/datacendia/rainey-stack | `c:\Users\Stu\rainey-stack` | Meta-repo. Docs only. Source of truth for cross-cutting decisions. |
| `raineylaguna-next` | github.com/datacendia/raineylaguna-next | `c:\Users\Stu\raineylaguna-next` | Marketing site for the **web vertical** at `raineylaguna.com`. Houses the Live Audit, Proto-60, contact form, and 8 service detail pages. |
| `raineylagunastudios` | github.com/datacendia/raineylagunastudios | `c:\Users\Stu\raineylagunastudios` | Marketing site for the **parent brand** at `raineylagunastudios.com`. Houses the Hydroprint Lab, Reverse Commissioning, Manifesto changelog, Lima Almanac. |
| `vigiaV2` | github.com/datacendia/vigiaV2 | `c:\Users\Stu\vigia` | The **Sereno** SaaS product (formerly Vigía). Web app + cron + customer dashboard at `sereno.raineylaguna.com`. Source of weekly competitive briefs over WhatsApp. |
| `raineylaguna-crm` | github.com/datacendia/raineylaguna-crm | (no local clone today) | Internal CRM. Lead pipeline, AI-drafted outreach, Monday digest. Lives at `crm.raineylaguna.com`. |

Archived (do not touch):

- `datacendia/raineylaguna` — old static HTML site, replaced by `raineylaguna-next`.
- `datacendia/vigia` — predecessor of `vigiaV2`.

When a repo's GitHub name disagrees with its local folder name (`vigiaV2` → `c:\Users\Stu\vigia`), prefer **the GitHub name in writing** and the local path **in commands**. The `vigia*` legacy will get cleaned up in a single rename pass; until then, do not introduce *more* names.

> **Gotcha — `vigia/` has two git remotes.** Inside `c:\Users\Stu\vigia` the
> remote `origin` points to the **archived** `datacendia/vigia.git`, and the
> remote `v2` points to the **canonical** `datacendia/vigiaV2.git`. Local
> `master` tracks `v2/master`. **Always push with `git push v2 …`** when
> working in this folder. Pushing to `origin` pollutes the archived repo
> with new commits and silently bypasses the canonical history. Verify with
> `git remote -v` and `git branch -vv` before any push that doesn't go
> through the upstream tracking branch. (This will be cleaned up by
> renaming `v2` → `origin` and dropping the archived remote in a focused
> chore PR; until then, the two-remote layout is the rule.)

---

## 2 · Domains and DNS

| Domain | Purpose | Status |
|---|---|---|
| `raineylaguna.com` | Marketing — web vertical | Live target |
| `raineylagunastudios.com` | Marketing — parent brand | Live target |
| `crm.raineylaguna.com` | Internal CRM | Subdomain |
| `sereno.raineylaguna.com` | Sereno customer dashboard | Subdomain |
| `*.preview.raineylaguna.com` | Proto-60 preview slugs | Wildcard subdomain (middleware exists, DNS pending) |
| `vigia.com`, `vigia.pe` | **Unavailable** — already registered by third parties | Forced rename to "Sereno" |
| `serenowatch.com` (or final pick) | Future home for Sereno spinout | Pending registration; see `RENAME-PLAN.md` |

**DNS-of-record provider:** Cloudflare. All zones. Free tier. Orange-cloud (proxied) on every public hostname unless we have a documented reason to pass through.

**Where Cloudflare is not used yet but should be:** see TODO in §16.

---

## 3 · Canon — products, prices, names

These are immutable facts an agent must not invent or alter without an explicit user request and a corresponding PR to this file *first*.

### 3.1 Service catalogue (8 services on `raineylaguna.com`)

Defined in `raineylaguna-next/src/data/services.ts`. The slug list and order are stable. **Do not rename slugs.** Display names can change with copy edits.

| # | Slug | Display name (es-PE) | Price | Surface |
|---|---|---|---|---|
| 01 | `audit` | Auditoría | S/ 180 (one-off) | `raineylaguna.com/servicios/audit/` |
| 02 | `websites` | Websites | from S/ 1,500 (project) | `raineylaguna.com/servicios/websites/` |
| 03 | `marca` | Marca | from S/ 2,500 (project) | `raineylaguna.com/servicios/marca/` |
| 04 | `care` | Care | from S/ 300/mes | `raineylaguna.com/servicios/care/` |
| 05 | `sereno` | Sereno (formerly Vigía) | S/ 600/mes (single Phase-1 plan) | `raineylaguna.com/servicios/sereno/` |
| 06 | `garua` | Garúa | S/ 350/mes | `raineylaguna.com/servicios/garua/` |
| 07 | `espejo` | Espejo | S/ 900/trimestre | `raineylaguna.com/servicios/espejo/` |
| 08 | `socio` | Socio (BETA · Cohorte 1) | S/ 1,500 setup + S/ 800/mes | `raineylaguna.com/servicios/socio/` |

The slug `vigia` is **forbidden** in new code. PR #2 in `raineylaguna-next` migrated it to `sereno`. If you find `vigia` as a *route slug*, *brand string*, or *new component name* in the marketing-site codebase, it is a regression.

The service order in §3.1 is canonical for grids and sitemaps.

### 3.2 Triangulation framing (homepage copy)

The triangulation block on the homepage of `raineylaguna.com` says:

> **Sereno** mira a tu competencia. **Espejo** te mira a ti. **Socio** escucha a tu cliente.

Three angles on the same business. This framing is canon. Do not invent a fourth angle without user approval; do not reorder the three.

### 3.3 Brand hierarchy

```
Rainey Laguna Studios   ──  parent brand  ──  raineylagunastudios.com
       │
       └── Rainey Laguna  ──  web vertical  ──  raineylaguna.com
                  │
                  ├── audit, websites, marca, care   (project / one-off services)
                  ├── garúa, espejo                   (recurring local services)
                  └── Sereno, Socio                   (productized SaaS)
                              │
                              └── Sereno may spin out to its own domain at scale.
                                  Spinout threshold: 2 of 3 conditions —
                                  rev > all-bespoke combined, > 50 customers, expanded outside Lima.
```

### 3.4 Sectors served

Hospitalidad · Fitness boutique · Educación independiente · Bienestar · Retail boutique · Servicios profesionales.

Plus the six "Who we serve" verticals on Studios: Hospitalidad, Cultura independiente, Retail de autor, Productores artesanales, Servicios profesionales, Creadores independientes.

### 3.5 Voice numbers

| Field | Value |
|---|---|
| WhatsApp business number | `+51 912 418 482` (E.164: `+51912418482`) |
| `wa.me` link | `https://wa.me/51912418482` |
| Studio email | `hola@raineylaguna.com` |
| Operator alert phone | `OPERATOR_WHATSAPP` env var, set per-service |
| Owner | Stuart John Andrew Rainey (Glasgow → Lima) |
| Studio location | San Isidro, Lima, Peru |

### 3.6 Pricing units

Always display Peruvian sol with the prefix `S/` and a non-breaking space before the digits in HTML (`S/ 600`). Never `S/.`, never `PEN`, never `Sol`, never `$`.

For monthly: `S/ 600/mes` (no spaces around the slash). For one-off: `S/ 180` (no period). For "from": `desde S/ 1,500` (lowercase "desde", thousands comma, no decimals).

In English mirrors (when they exist): `S/ 600/mo`, `from S/ 1,500`, with the same `S/` prefix.

---

## 4 · Tech stack — versions and packages

### 4.1 Next.js apps

All three Next.js apps standardize on:

| Package | Version line | Why |
|---|---|---|
| `next` | `16.x` (latest minor) | App Router, Turbopack stable, React 19. Already across all repos. |
| `react`, `react-dom` | `19.x` | Required by Next 16. |
| `typescript` | `5.x` | `strict: true` non-negotiable. |
| `tailwindcss` | `3.4.x` (NOT v4 yet — wait until ecosystem catches up) | Custom `hairline` utility lives in `tailwind.config.ts` per repo. |
| `eslint` | `10.x` (Next 16 line) | Run on PR. Fail on warnings in CI. |

Do not bump major versions of `next`, `react`, or `tailwindcss` in a feature PR. Major bumps are their own PR with the title `chore(deps): upgrade <pkg> v<old>→v<new>` and a `BIBLE.md` / `CONVENTIONS.md` note.

### 4.2 Database

| Where | Engine | Driver | Migration story |
|---|---|---|---|
| Sereno (`vigiaV2`) | Postgres on Railway | `pg` | `SCHEMA_SQL` in `src/lib/db.ts`, idempotent bootstrap (`CREATE TABLE IF NOT EXISTS`, additive `ALTER TABLE … IF NOT EXISTS`). **Never `DROP COLUMN`.** Breaking changes get a one-shot script in `scripts/migrations/<date>-<slug>.ts`. |
| CRM | Postgres on Railway | `pg` | Explicit numbered migrations in `database/migrations/<date>-<slug>.sql`. Run via `npm run migrate`. |
| `raineylaguna-next` | None today; reads CRM via internal API; reads Sereno via `NEXT_PUBLIC_SERENO_API` | n/a | If a feature needs persistence (Proto-60 store today), it stays in *one* of the two databases above, accessed via an API. The marketing site does **not** own a DB. |

### 4.3 AI

| Provider | Where | Auth |
|---|---|---|
| Anthropic Claude (`claude-3-5-sonnet-20241022`) | Sereno brief generation, CRM AI-drafted outreach, Proto-60 generator | `ANTHROPIC_API_KEY` (server-only). Same key shared across services. |
| OpenAI | **Not used.** Avoid unless explicitly justified. | — |
| Gemini | **Not used.** Quarterly review possible. | — |

When a feature needs AI, default to Anthropic. `prompt_version` columns must be set on every persisted prompt artifact (CRM `crm_outreach_drafts.prompt_version` is the reference). Locked-in prompt versions go in a `*-prompt.ts` file; bump the version string before mutating the prompt.

### 4.4 Payments

See `PAYMENTS.md` for full reasoning. **Stripe is forbidden in Peru.** Reasons: SUNAT compliance, sol-denominated MRR, local card success rates, Plin/Yape coverage. Use:

| Channel | Where |
|---|---|
| **Culqi** (`culqi.com`) | Card subscriptions for Sereno. Webhook-driven. |
| **Yape** | Enabled on Culqi checkout. |
| **Plin** | Manual reconciliation today. |
| **PayPal** | Optional fallback for international. |
| **Bank transfer** | Fallback for high-touch enterprise. |

### 4.5 Comms

| Channel | Provider | Var prefix |
|---|---|---|
| Outbound WhatsApp | Twilio (BSP) | `TWILIO_*` |
| Transactional email | Resend | `RESEND_*` |
| Operator alerts | Twilio WhatsApp to `OPERATOR_WHATSAPP` | — |

Twilio's WhatsApp template SID (`TWILIO_TEMPLATE_SID`) is required for messages outside the 24-hour conversation window. The send route enforces this; do not bypass.

### 4.6 Hosting & infrastructure

| Layer | Provider | Notes |
|---|---|---|
| Compute (all 4 apps + Sereno cron) | Railway | One project per service. Hobby plan + usage. |
| DNS / CDN / WAF | Cloudflare | Free tier, orange-cloud all public hostnames. |
| Email forwarding | Cloudflare Email Routing | `hola@raineylaguna.com` → Stuart's Gmail. |
| Object storage | (not yet) | When needed for PoF artifacts or counter-move banners that exceed `next/og`, default to Cloudflare R2. |

---

## 5 · File & directory conventions

### 5.1 Next.js App Router layout

Every Next.js app uses this skeleton:

```
src/
├─ app/
│  ├─ (marketing)/        ── Public, server-rendered, ISR or static
│  ├─ app/                ── Customer dashboard (auth-gated)            ← Sereno only
│  ├─ admin/              ── Operator console (basic-auth or session)   ← Sereno, CRM
│  ├─ api/                ── Server routes (webhooks, internal APIs)
│  └─ layout.tsx, page.tsx, sitemap.ts, robots.ts
├─ components/            ── Shared UI. PascalCase filenames.
├─ data/                  ── Static data files (e.g. services.ts). Source of truth, not derived.
├─ lib/                   ── Domain logic. lowercase, kebab-case filenames.
└─ middleware.ts          ── Route gating
```

Rules:

- **One concern per file** in `lib/`. `briefs.ts`, `events.ts`, `subscriptions.ts` are good. `helpers.ts`, `utils.ts` are forbidden.
- **Server Components by default.** Mark `"use client"` only when a hook (`useState`, `useEffect`, etc.) is unavoidable. Push interactive subtrees into their own component file rather than client-marking the whole page.
- `force-dynamic` is set on admin pages; ISR (`revalidate = N`) on marketing surfaces that have data freshness requirements.

### 5.2 Static / hand-coded HTML (Studios)

`raineylagunastudios` is intentionally a static-HTML repo — no build step. Conventions there:

- One `index.html` per route folder. Each is **self-contained** (full DOCTYPE, head, footer, scripts).
- Shared partials live in `scripts/partials/*.html` and are wrapped into pages by `scripts/wrap-page.mjs`. Run `npm run wrap` before commit.
- All CDN imports must include SRI hashes. (TODO §16.)
- Bilingual: every Spanish element with a translation has `data-en="…"` on it. The locale toggle JS swaps `textContent` based on `?lang=` query.

### 5.3 Naming

| Thing | Convention | Examples |
|---|---|---|
| Component file | `PascalCase.tsx` | `ServicePage.tsx`, `Hero.tsx` |
| Lib file | `kebab-case.ts` | `lima-weather.ts`, `priority-score.ts` |
| Route segment | `kebab-case/` | `app/servicios/sereno/` |
| Dynamic segment | `[param]/` | `app/p/[slug]/` |
| Database table | `snake_case` | `crm_leads`, `socio_messages` |
| Database column | `snake_case` | `created_at`, `prompt_version` |
| Env var | `UPPER_SNAKE_CASE` | `ANTHROPIC_API_KEY` |
| Public env var | prefix `NEXT_PUBLIC_` | `NEXT_PUBLIC_VIGIA_API` (legacy; new ones use `NEXT_PUBLIC_SERENO_API`) |
| Event type (Sereno) | `noun.verb` lowercase dotted | `brief.draft`, `pipeline.weekly.started` |
| Slug (services, customers, briefs) | `kebab-case` | `sereno`, `bella-notte` |
| Git branch | `<type>/<scope>-<short>` | `feat/sereno-counter-move`, `fix/crm-lead-intake` |

### 5.4 Forbidden file types

- `helpers.ts`, `utils.ts`, `index.ts` re-export barrels (force named imports of the actual module)
- `*.bak`, `*-old.*`, `*-copy.*`
- `TODO.md` / `NOTES.md` outside this meta-repo (use `BUGS.md` or `ROADMAP.md`)

---

## 6 · Cross-repo contracts

Where two repos talk to each other, the contract lives in the **owning** repo's docs and is imported (or re-stated, since we don't share types yet) in the consuming repo.

### 6.1 Lead intake (`raineylaguna-next` → `raineylaguna-crm`)

- **Endpoint:** `POST {CRM_PUBLIC_API}/api/leads/public`
- **Auth:** `X-Lead-Intake-Secret: ${CRM_LEAD_INTAKE_SECRET}` (must match on both ends; constant-time compare on CRM side).
- **Body:** `{ name, email, phone, district, niche, notes, source }` (all strings, all optional except `name`).
- **Response:** `{ ok: true, id: string }` on success.
- **Behaviour:** dedupes by `(email, phone)`. Existing match appends to the `notes` blob. New match inserts a row at `pipeline_stage='Lead'`.
- **Failure mode:** the marketing site's `/api/lead` route falls back to log-only mode if `CRM_PUBLIC_API` is unset or returns non-2xx. **Always** returns `{ ok: true }` to the visitor regardless. Never leak CRM errors to the public form.

### 6.2 Brief read (Sereno → `raineylaguna-next`)

- **Endpoint:** `GET {NEXT_PUBLIC_SERENO_API}/api/brief?slug=<customer>&week=<YYYY-MM-DD>` (legacy `NEXT_PUBLIC_VIGIA_API` aliased).
- **Auth:** none (public, redacted briefs only). Customer-private briefs require auth via the Sereno session cookie.
- **Response shape:** the `BoletinOutput` from `vigiaV2/scripts/boletin/types.ts`. Validate on consume.
- **Caching:** `Cache-Control: s-maxage=30, stale-while-revalidate=120`. (TODO §16 — currently uncached.)

### 6.3 Audit telemetry (`raineylaguna-next` → Sereno)

- **Endpoint:** `POST {NEXT_PUBLIC_SERENO_API}/api/audit-completed`
- **Body:** see `vigia/BIBLE.md` Part XI bis.
- **Behaviour:** silent telemetry, never blocks UX.

### 6.4 Public signals feed (Sereno → marketing surfaces)

- **Endpoint:** `GET {NEXT_PUBLIC_SERENO_API}/api/public-signals` (the route is **planned** but not yet implemented as of 2026-05-06; do not consume in production).
- **Will return:** anonymized last-24h signals.

When introducing a new cross-repo call, **document it here in the same PR**. An undocumented contract is a contract that will silently break.

---

## 7 · Decisions locked in (do not re-litigate)

These come from `vigia/BIBLE.md` §X, `rainey-stack/PAYMENTS.md`, and product-team decisions captured this week. An agent must not "improve" them without an explicit user request and a PR to this file.

| Decision | Rationale | Reopen-when |
|---|---|---|
| Postgres + JSON-file dual-backend in Sereno | Zero-friction local dev + bulletproof production durability. | When local dev pain outweighs the toggle complexity. |
| Anthropic Claude (not OpenAI / Gemini) | Spanish quality, Lima business idiom, comparable cost. | Quarterly review. |
| Twilio (not Meta direct) for WhatsApp | 24h provisioning vs 2-4 weeks; $0.005 vs $0.04/msg in Peru. | At ~5,000 messages/month. |
| Operator review before Sereno send | Hallucinations are existential pre-PMF; one bad brief kills a customer. | At customer #30. |
| Separate Railway service for Sereno cron | Web service must respond fast; orchestrator takes 3–8 min. | Never (operational, not architectural). |
| Brief row is the system of record (not the WhatsApp message) | Customer can delete WhatsApp; PG is permanent. | Never. |
| Event log + dimensional tables (not pure event sourcing) | Event-sourcing requires replay; we want fast reads. | If audit/compliance demands force full event sourcing. |
| **Stripe forbidden in Peru** | SUNAT, sol-MRR, card success, Plin/Yape coverage. | If Stripe ships native Peru-licensed entity with SUNAT integration. |
| Tailwind v3 (not v4) | Plugin ecosystem still catching up. | When `@tailwindcss/typography` and `tailwind-merge` v4 are stable. |
| Single Sereno plan (Pro S/249/mes) Phase-1 only | One plan to optimize until 30 customers; revert via env. | At customer #30 or first segmentation signal. |
| `bcryptjs` (not native `bcrypt`) for admin auth | Pure JS, builds on every Railway image, low admin volume. | If admin login latency exceeds 800ms p95. |
| Wildcard preview subdomains for Proto-60 | Each generated proto gets its own URL; sharable. | Never; it's the product. |
| Service-detail page slugs frozen | Marketing SEO depends on URL stability. | Never (would require 301-redirect maps). |

When you encounter code that contradicts a locked-in decision, that is a bug — file it in `BUGS.md`, do not "fix" it silently.

---

## 8 · Anti-patterns — what AI defaults to that we forbid

These are the Claude / Codex / Cursor defaults that look fine on review and silently misbehave in production. The list comes from the deep-review email of 2026-05-06.

### 8.1 Stop introducing these

- **`bcryptjs` everywhere by default.** Acceptable for Sereno admin (low volume); reach for native `bcrypt` only if a future service has high-volume password verification.
- **Schema auto-bootstrap on first request.** Sereno does this for legacy reasons; it is a *constraint*, not a model. New repos use explicit numbered migrations.
- **`process.env.X ?? 'fallback'` ad-hoc.** Centralize in `src/lib/env.ts` with zod (§10).
- **No HMAC on webhooks.** Every webhook handler must verify the provider's signature. No exceptions.
- **`as any` casts to silence TypeScript.** If TS is wrong, write a type guard. If TS is right, fix the data flow.
- **`try { … } catch {}` swallowing errors silently.** Catch must either rethrow, log to `trackSafe`, or transform to a typed error.
- **`Array.prototype.forEach` with async callbacks.** Use `for…of` (sequential) or `Promise.all(items.map())` (parallel) explicitly.
- **`new Date()` inside business logic.** Inject the clock — pass `now: Date` as a parameter or read from `lib/clock.ts`. Untestable otherwise.
- **`Math.random()` for slug / id generation.** Use `crypto.randomUUID()` or a proper deterministic hash.
- **CSS modules + Tailwind in the same file.** Pick one per component (Tailwind by default).
- **Inline `dangerouslySetInnerHTML`** with anything other than statically-defined content from `src/data/*`. Never with user input.
- **Comments that describe what the code is doing** rather than why. Either delete the comment or rewrite it as the why.
- **Renaming a public route slug** (`/servicios/sereno/`, `/p/[slug]/`, `/api/leads/public`). Slug renames are SEO incidents.
- **Adding a "helper" file.** See §5.4.
- **`useEffect(fetch)` in client components** when the same data could be fetched at the server boundary.
- **`'use client'` at the top of a page** when only one button needs interactivity. Extract the button.
- **Hard-coded prices** in components. Read from `data/services.ts` or `lib/plans.ts`.
- **Hard-coded WhatsApp phone numbers.** Read from env or from `data/contact.ts`.
- **Generated filenames in commits** (e.g. `tsconfig.tsbuildinfo`). Add to `.gitignore`.
- **Abandoned migrations.** Every `database/migrations/*.sql` must run idempotently and be checked-in with a corresponding entry in `BIBLE.md` (Sereno) or the CRM `README.md`.
- **`console.log` debugging that ships to main.** Either remove or replace with a structured `trackSafe` event.

### 8.2 Required positive habits

- Read `BIBLE.md` (Sereno) before touching anything in `src/lib/` or `scripts/` of `vigiaV2`.
- Read `BUGS.md` before assuming a bug exists or has been fixed.
- Read this file before introducing any of the patterns above.
- Run `npm run build` (or `npm run typecheck` once we add it) before pushing.
- Open a PR for any change > 50 lines, even when working solo. The PR description is the audit trail future-Stuart will read.

---

## 9 · Schema policy (Postgres)

### 9.1 Sereno (`vigiaV2`)

- Schema lives in `src/lib/db.ts` `SCHEMA_SQL` constant.
- Idempotent bootstrap on first connection.
- **Additive only** (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`).
- **Never** `DROP COLUMN`, `RENAME COLUMN`, or change a column type in `SCHEMA_SQL`.
- For breaking changes: write a one-shot migration in `scripts/migrations/<YYYY-MM-DD>-<slug>.ts`, run it manually before deploy, document it in `BIBLE.md`. The new shape is then mirrored in `SCHEMA_SQL` for fresh installs.

### 9.2 CRM (`raineylaguna-crm`)

- Schema lives in `database/crm-schema.sql` for fresh installs.
- Migrations in `database/migrations/<YYYY-MM-DD>-<slug>.sql`.
- Run via `SCHEMA_PATH=… npm run migrate` (single-file mode) or `npm run migrate` (all pending).
- Migrations must be idempotent (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, etc.) so re-runs are safe.

### 9.3 Universal rules

- Every table has `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
- Mutable rows have `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and a `BEFORE UPDATE` trigger or app-level update.
- Soft-delete via `deleted_at TIMESTAMPTZ NULL`. Never hard-delete unless legally required.
- JSONB is acceptable for evolving payloads (`subscriptions.customer`, `briefs.payload`, `events.payload`). Strongly-shaped fields are columns, not JSONB keys.
- Foreign keys are explicit and named (`fk_briefs_customer`).
- Indexes for any column queried in the app outside primary key. Document why.
- Time zones: every `TIMESTAMPTZ`, never `TIMESTAMP`. Render to Lima time at the edge.

### 9.4 The CRM/Sereno split-brain (current state)

CRM uses migrations. Sereno auto-bootstraps. This is a known inconsistency. **Do not "fix" it by porting Sereno to migrations as a side effect of another PR.** That is its own PR with its own review. Until then, both patterns are tolerated; pick the right one for the repo you are in.

---

## 10 · Environment variables

### 10.1 Universal rules

- `.env.example` in every repo must list every variable the code reads.
- `.env.local` is gitignored. Verify before pasting any key into a chat.
- Public variables are prefixed `NEXT_PUBLIC_`. Everything else is server-only.
- A missing required env var must **fail fast at boot**, not silently fall back. (Today most repos silently fall back; this is being migrated to zod-validated boot — see §16 TODO.)

### 10.2 Shared secrets across repos

| Secret | Set on | Same value? |
|---|---|---|
| `ANTHROPIC_API_KEY` | `raineylaguna-next`, CRM, Sereno | Same value across all three (single Anthropic account). |
| `CRM_LEAD_INTAKE_SECRET` | `raineylaguna-next` (sender), CRM (verifier) | **Must match.** Long random string. |
| `CULQI_*` | Sereno | Sereno-only. |
| `TWILIO_*` | Sereno (today) | If CRM gains outbound WhatsApp later, share account. |
| `RESEND_API_KEY` | Sereno (today) | Same. |
| `OPERATOR_WHATSAPP` | Sereno cron | E.164 (`+51987654321`), no `whatsapp:` prefix. |

### 10.3 Per-repo authoritative env list

For the full list per repo, refer to `.env.example` in that repo. Critical-path subsets:

- **Sereno:** `BIBLE.md` Part VII.
- **CRM:** `README.md` of `raineylaguna-crm`.
- **`raineylaguna-next`:** `.env.example` (audit + lead-intake + Sereno-API).
- **Studios:** no env beyond build-time (static site).

---

## 11 · Auth conventions

### 11.1 Sereno admin

- Currently: middleware basic-auth via `ADMIN_PASSWORD` env.
- Replacement (in flight per recent commit `08a71a8`): admin login route with bcryptjs-hashed passwords in DB, signed session cookie via `src/lib/admin-auth.ts`.
- Cookie: `HttpOnly`, `Secure` in production, `SameSite=Lax`, expires 7 days.
- Session JWT: HS256, secret ≥ 32 chars, rotation procedure documented in `RUNBOOKS.md` (TODO §16).

### 11.2 Sereno customer

- Current state: weakly-defined; check `vigia/src/app/login/page.tsx` and `src/lib/admin-auth.ts` before adding to it.
- Goal state: same cookie convention as admin, separate cookie name (`sereno_session` vs `sereno_admin_session`), shorter expiry (24h sliding).

### 11.3 CRM

- Multi-user auth landed; bcryptjs hashes in `crm_users`. Session cookie signed with `SESSION_SECRET`.
- `middleware.ts` redirects `/dashboard/*` without cookie to `/login`.
- No CSRF token today (cookie-only auth + Same-Site=Lax). Acceptable for a single-operator internal tool; reconsider if exposed to the public.

### 11.4 `raineylaguna-next`

- No user-facing auth. The only "admin" surface is `/api/audit` and `/api/lead`, both rate-limited by IP.

### 11.5 Universal rules

- **Rate-limit every login route** (5 attempts / 15 min / IP). Login routes without rate limits are bugs.
- **Constant-time compare** for any header secret (`CRM_LEAD_INTAKE_SECRET`, webhook HMAC). Use `crypto.timingSafeEqual`.
- **No password in logs**, no token in logs, no API key in logs. Period.
- **Session revocation**: today we cannot revoke a stolen JWT mid-flight. Acceptable for current scale; if you ship a feature that handles money or PII at higher risk, add a server-side session table.

---

## 12 · Webhook policy

Every inbound webhook handler must:

1. **Verify the signature** with the provider's documented method, in constant time.
   - Culqi: `X-Culqi-Signature` against payload + `CULQI_WEBHOOK_SECRET`.
   - Twilio: `X-Twilio-Signature` validated via Twilio SDK or manual HMAC.
   - Resend: signed via Svix; verify with the Svix verifier or skip and rely on a shared secret in the path.
2. **Be idempotent.** Use the provider's event ID as a key. Persist seen IDs in an `idempotency_keys` table (or equivalent JSON record).
3. **Log every event** with `trackSafe({ type: 'webhook.<provider>.received', payload })`. Failures, replays, signature failures all count.
4. **Respond fast (< 5s).** Heavy work goes to a worker queue or a follow-up cron — never inline.
5. **Return 200 on duplicates.** Returning non-2xx will cause the provider to retry, which the idempotency layer must still handle.

Non-compliance is a bug, not a refactor. As of 2026-05-06 the Culqi and Twilio handlers in Sereno are missing signature verification; this is logged in §16 TODO.

---

## 13 · Testing — current state and forward plan

### 13.1 Honest current state

Zero tests across all five repos as of 2026-05-06. This is an acknowledged gap, not a stylistic choice. The full test catalog with priorities lives in `TESTS.md` (~150 items).

### 13.2 Test runners (when introduced)

- **Vitest** for unit + light integration tests in every Next.js repo.
- **Playwright** for end-to-end browser tests. Already a `vigiaV2` runtime dep (legacy from a collector); installable in the others.
- **`@axe-core/playwright`** for a11y assertions.

### 13.3 File layout

```
<repo>/
├─ src/
│  └─ lib/foo.ts
└─ tests/
   ├─ unit/
   │  └─ foo.test.ts             ← colocated by domain, mirrors src tree
   ├─ integration/
   │  └─ api-leads-public.test.ts
   └─ e2e/
      └─ audit-tool.spec.ts
```

Co-locating `*.test.ts` next to the source is also acceptable when the test is purely unit. Pick one style per repo and stick with it.

### 13.4 What every PR should answer

1. What did you change?
2. What test covers it (or, why is "no test" the right call)?
3. What manual verification did you run?

`/admin` UI changes are exempt from "what test" until we have a Playwright harness. Everything in `lib/` is not exempt.

### 13.5 Test order of operations

(Refer to `TESTS.md` for the per-repo catalog. The week-1 order is locked here so no agent re-debates it.)

| Day | Repo | Tests |
|---|---|---|
| 1 AM | All Next | GitHub Actions: typecheck + lint + build |
| 1 PM | CRM | `priority-score.ts` unit suite |
| 2 AM | `raineylaguna-next` | `lima-weather.ts`, `proto-prompt.ts`, Hero `normaliseUrl` |
| 2 PM | Sereno | `sample-week.ts`, `shortlinks.ts`, brief schema |
| 3 | Sereno | First Playwright e2e (full brief pipeline) |
| 4 | All | Webhook HMAC + idempotency tests |
| 5 AM | Studios | Hydroprint Lab + QR snapshot Playwright |
| 5 PM | All | Synthetic monitoring + Lighthouse CI |

---

## 14 · Git conventions

### 14.1 Branches

- `main` (or `master` for `vigiaV2` legacy) is always deployable.
- Feature branches: `feat/<scope>-<short>` (e.g. `feat/sereno-counter-move-tracker`).
- Fix branches: `fix/<scope>-<short>`.
- Chore branches: `chore/<scope>-<short>`.
- Hotfix: branch from `main`, PR straight in, document the failure mode in `BUGS.md`.

### 14.2 Commits

- One concern per commit. A commit that touches the schema *and* a UI page *and* an env var is three commits.
- Imperative subject ≤ 72 chars: `add CRM phone column to public lead intake`.
- Body explains *why* and references docs / PRs / issues.

### 14.3 Commit message hygiene

- Co-author trailers are not required (solo repo) but welcome when an agent did substantive work.
- Scope prefix optional in the subject (`feat(crm): …`).
- **Never** include `Generated with Claude` / `Co-Authored-By: Claude <noreply@anthropic.com>` etc. We attribute by *what was done*, not *who/what wrote it*. Future-Stuart needs the diff to read like the codebase, not like a tool.

### 14.4 PR review

- Every PR ≥ 50 lines gets a self-review pass before merge.
- The "self-review pass" is: open the PR diff, read it linearly, fix any anti-pattern from §8 you spot.
- Solo merges are fine; the PR record is the audit trail.

### 14.5 Tags & releases

- No semver tags today. When a service ships v1.0 (Sereno at customer #30, marketing at 1k MRR, etc.), introduce `v1.0.0` tags and `CHANGELOG.md`.

---

## 15 · Voice and brand registers

Three surfaces, three registers. From `BRAND.md` plus operator instinct.

| Surface | Audience | Register |
|---|---|---|
| `raineylagunastudios.com` (Studios) | Artisans, cultural buyers, design press | **Atmospheric, slow, poetic.** Single-word concepts (Garúa, Espejo). Spanish-first. Lima-coastal. |
| `raineylaguna.com` (Web vertical) | Lima SMB owners (restaurant, gym, clinic, retail) | **Direct, plain, useful.** "Sitios cuidados" not "premium digital experiences". Bilingual. Audit-first, not portfolio-first. |
| Sereno product (`sereno.raineylaguna.com`) | Anxious owners checking WhatsApp at 7am Monday | **Telegraphic, calm, decisive.** "El sereno detectó 3 cambios. Aquí lo importante." No marketing fluff inside a brief. |

When in doubt, ask: would this sentence belong on the *next* surface up the brand stack? If a Sereno brief sounds like a Studios poem, you've slipped registers.

### 15.1 Universal rules

- **Spanish first.** Lima Spanish, not Madrid Spanish. "Mañana" not "ahora mismo". "S/" not "PEN". "Distrito" not "borough".
- **No emojis** in copy unless the content type explicitly requires (WhatsApp telegraph allows ✓, brief headlines do not).
- **No exclamation marks** in service descriptions, brief content, or onboarding. Excitement is performative; we are calm.
- **No "AI-powered", "revolutionary", "next-generation".** Describe what the thing does, in the voice of someone who would do it manually.
- **Numbers are specific.** "Lunes 8 a.m." not "every week". "S/ 600/mes" not "afford­able pricing".
- **Bilingual surfaces:** every Spanish element has a `data-en` attribute (Studios) or a parallel `/en/` route (`raineylaguna-next`). English mirror for service detail pages is incomplete; see §16 TODO.

---

## 16 · Open infrastructure debt (TODO)

Tracked here because it spans repos. Mirror in each repo's `BUGS.md` / `ROADMAP.md` when actionable.

### Critical

- [ ] **GitHub Actions: typecheck + lint + build on PR** for `raineylaguna-next`, `vigiaV2`, `raineylagunastudios`. (One workflow exists in archived `raineylaguna`.)
- [ ] **Zod-validated env loaders** in each Next.js app (`src/lib/env.ts`), fail-fast at boot.
- [ ] **Sentry SDK** in each Next.js app. Free tier sufficient.
- [ ] **HMAC verification** on Culqi and Twilio webhook handlers in Sereno.
- [ ] **`idempotency_keys` table** in Sereno; webhook handlers consume it.
- [ ] **Per-tenant Anthropic budget cap** in Sereno (`subscriptions.customer.token_budget` + alerting cron).

### High

- [ ] **`/en/servicios/*` mirror** in `raineylaguna-next`. None of the 8 service detail pages have an English mirror today.
- [ ] **`Cache-Control: s-maxage=30, stale-while-revalidate=120`** on Sereno's planned `/api/public-signals` route (route itself does not yet exist; build alongside cache).
- [ ] **Cloudflare proxy (orange cloud)** verified on every public hostname.
- [ ] **Cloudflare Turnstile** on Almanac form, contact form, `/proto`, `/audit`, login pages.
- [ ] **Better Stack synthetic monitor** on every public URL + `/api/health`.
- [ ] **Plausible (or Umami)** analytics on all 3 Next.js apps.
- [ ] **Customer self-service cancel** in Sereno `/app/settings`.
- [ ] **Counter-Move "did this" tracker** in Sereno (close the loop on v2 banners).
- [ ] **Wildcard preview DNS** for `<slug>.preview.raineylaguna.com`.

### Medium

- [ ] **`RUNBOOKS.md`** in `rainey-stack` with one entry per failure mode (brief send fails, Culqi webhook stops, audit returns 500, lead intake silently drops).
- [ ] **`DECISIONS.md`** in `rainey-stack` (ADR-style, one per decision, chronological).
- [ ] **`TESTS.md`** in `rainey-stack` with the full ~150-item test catalog and priority.
- [ ] **`STRATEGY.md`** in `rainey-stack` answering "given this rate, what does the next year look like".
- [ ] **Markdown link-check** in CI for `rainey-stack` — every internal link resolves.
- [ ] **DEPLOY.md drift check** — env vars in docs match `.env.example` in each repo.
- [ ] **Centralized i18n** at `messages/{es,en}.ts` per Next.js app.
- [ ] **`as any` audit** across CRM and replace with type guards.
- [ ] **SRI hashes** on every Studios CDN script tag.
- [ ] **`next/image`** for hero / SerenoBrief assets in `raineylaguna-next`.
- [ ] **Backup / restore runbook** for Sereno + CRM Postgres.
- [ ] **Secret rotation procedure** for JWT / intake / API keys.

### Low (worth doing, no urgency)

See `ROADMAP.md` — most "small features" and "medium features" from the 2026-05-06 review live there. This file does not duplicate them.

---

## 17 · How to update this file

- Open a PR named `docs(conventions): <what changed in 5 words>`.
- Bump the "Last refreshed" date at the top.
- If you reverse a §7 locked-in decision, link to the PR or commit that authorized it in the table cell.
- If you add a new pattern, also flag the symmetric anti-pattern in §8.
- If you delete content, leave a one-line note in §17 itself (below) so future readers can grep history.

### Changelog of structural edits to this file

- 2026-05-06 — initial document. Stuart Rainey + agent. Captures stack state at the convergence of `raineylaguna` (archived) → `raineylaguna-next`, and the Vigía → Sereno rename.

---

## 18 · One-paragraph summary for the impatient

Five repos. Three Next.js 16 + React 19 + Tailwind 3 marketing/product apps, one static-HTML brand site, one docs-only meta-repo. Postgres on Railway, Cloudflare DNS+CDN. Anthropic Claude for AI; Twilio for WhatsApp; Culqi (never Stripe) for Peruvian payments. Spanish-first, Lima-specific, no emojis. Eight services on `raineylaguna.com` keyed by frozen slugs, `sereno` formerly `vigia`. Schema is additive only in Sereno, migration-driven in the CRM. Webhooks must be HMAC-verified and idempotent. Auth is bcryptjs + signed cookies. Tests are a known gap with a sequenced plan in `TESTS.md`. Voice register changes by surface — Studios is poetic, Web is direct, Sereno is telegraphic. Read `BIBLE.md` (Sereno) before touching that repo, `BUGS.md` before assuming anything, this file before introducing patterns.
