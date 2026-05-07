# DECISIONS.md — Architecture Decisions Log

Chronological log of every decision that's expensive to reverse. Each entry
captures **why** at the moment of the call, so a future session — human or
AI — does not relitigate it without first understanding what changed.

> **Process.** Add a new entry when a decision is locked in. Update an
> existing entry only with `### Update YYYY-MM-DD` notes appended below
> the original — never rewrite history. Mark superseded entries
> `~~Superseded~~` with a link to the replacement.

> **Format (per ADR-lite).** Each entry has: title, status, date, context,
> decision, consequences (good and bad), and references. Keep it short —
> the value is in the `Why` box, not in long prose.

## Index

| ID  | Title | Status |
|-----|-------|--------|
| D01 | Four-repo architecture under `datacendia/` | Accepted |
| D02 | Vigía → Sereno product rename | Accepted |
| D03 | One plan, not three (Phase-1 launch posture) | Accepted |
| D04 | Culqi for PE payments (not Stripe-only) | Accepted |
| D05 | Twilio as WhatsApp BSP | Accepted |
| D06 | Anthropic Claude for all LLM calls | Accepted |
| D07 | Postgres on Railway (not Supabase / Neon) | Accepted |
| D08 | `raineylagunastudios.com` is static HTML, no build | Accepted |
| D09 | npm (not pnpm / yarn / bun) across all repos | Accepted |
| D10 | Node 22 LTS pinning in CI | Accepted |
| D11 | `instrumentation.ts` for boot-time env validation + Sentry init | Accepted |
| D12 | Webhook idempotency via Postgres `webhook_events` (not Redis) | Accepted |
| D13 | Two git remotes on `c:\Users\Stu\vigia` (`origin` + `v2`) | Accepted |
| D14 | Sentry minimal init now; sourcemap upload deferred | Accepted |
| D15 | Vitest (not Jest) for unit tests | Accepted |
| D16 | `CONVENTIONS.md` as load-bearing anti-drift document | Accepted |
| D17 | Schema bootstrap via `CREATE TABLE IF NOT EXISTS`, no migration framework | Accepted |
| D18 | Zod-validated env loader; every var `.optional()` initially | Accepted |
| D19 | Idempotent `briefs` upsert via unique `(customer_slug, week_of)` index | Accepted |
| D20 | English mirror of marketing under `/en/*`, not a separate domain | Accepted |

---

## D01 · Four-repo architecture under `datacendia/`

**Status.** Accepted · 2025-Q4

**Context.** The stack spans a parent-brand site, a web-vertical marketing
site, an internal CRM, and a SaaS product. Two extremes were considered:

1. *Monorepo.* Tooling (turborepo / nx) and shared `packages/`.
2. *Many small repos.* One repo per product surface.

**Decision.** Four independent repos, all under `github.com/datacendia/`,
no submodules. A fifth meta-repo (`rainey-stack`) holds cross-repo docs.

**Consequences.**
- 👍 Each product surface ships at its own cadence — Sereno can deploy
  3× a day without churning the static studios site.
- 👍 Cleanest blast radius: a botched build on the marketing site cannot
  brick the customer dashboard.
- 👍 Easy to hand a single repo to a contractor without leaking the others.
- 👎 Shared types / utilities have to be duplicated (e.g. signed-lead
  payload shape between `raineylaguna-next` and `raineylaguna-crm`).
  Mitigation: keep the shared surface tiny and treat the wire format as
  the contract, not the language types.
- 👎 Cross-repo refactors (rename, dep upgrade) are N PRs not 1.

**References.** `CONVENTIONS.md §1`, `README.md`.

---

## D02 · Vigía → Sereno product rename

**Status.** Accepted · 2026-Q1, completed 2026-05-06 (PR #2)

**Context.** The codebase originated from a generic "Scoutly" prototype
and was repointed at the Lima restaurant market under the name "Vigía".
Two problems:

1. `vigia.com` / `vigía.com` were unobtainable; `serenowatch.com` was.
2. The brand voice for restaurateurs in Lima skews atmospheric, not
   surveillance-flavoured. "Sereno" (the night watchman of colonial
   Lima — a familiar, warm reference) outperformed "Vigía" in qualitative
   interviews.

**Decision.** Product brand is **Sereno**. The local folder name
(`c:\Users\Stu\vigia`) and the GitHub repo (`vigiaV2`) keep the legacy
slug; this is intentional friction so renames don't cascade into git
history. `vigia` is a forbidden string in *new* component names, slugs,
or marketing copy.

**Consequences.**
- 👍 Brand consistency across npm `name`, payment integrations, WhatsApp
  message templates, customer-facing docs.
- 👍 Operator can speak about "Sereno" externally without exposing the
  legacy stack.
- 👎 Permanent papercut: the local checkout dir and GitHub repo names
  don't match. Documented as a "gotcha" in `CONVENTIONS.md §1`.
- 👎 Legacy customer comprobantes / receipts pre-rename keep the old
  brand string. Acceptable.

**References.** `RENAME-PLAN.md`, `vigia/README.md`, `CONVENTIONS.md §1`.

---

## D03 · One plan, not three (Phase-1 launch posture)

**Status.** Accepted · 2026-05-06

**Context.** Three plans (Esencial S/89, Pro S/249, Cadena S/799) were
fully built in `src/lib/plans.ts`. Pre-launch the operator has zero
pricing data, and three tiers force every prospect into a comparison
they cannot meaningfully resolve. Empirical literature (Predictably
Irrational, Kahneman, modern SaaS pricing) puts checkout-completion
rate of "one plan, one price" at roughly 2× the same product behind a
3-tier matrix, when the prospect lacks enough information to self-segment.

**Decision.** Phase-1 active plan is **Pro at S/249/mes**, exclusively.
`PHASE_1_ACTIVE_SLUGS = ["pro"]` in `src/lib/plans.ts`. The other tiers
remain in the registry so legacy customer subscriptions still resolve
via `getPlan()` and webhooks keep working.

**Reopen-when.** ~30 paying customers and meaningful signal on
willingness-to-pay differential. Then flip
`NEXT_PUBLIC_SERENO_ALL_PLANS=true` (no redeploy).

**Consequences.**
- 👍 Pricing page reads as a single ask, not a comparison.
- 👍 Marketing copy lands on one anchor.
- 👎 Customers asking "why so expensive" have no cheaper anchor.
  Mitigation: free 7-day sample week (the "sample-week trigger").

**References.** `CONVENTIONS.md §7`, `src/lib/plans.ts:111`.

---

## D04 · Culqi for PE payments (not Stripe-only)

**Status.** Accepted · 2026-Q1

**Context.** Stripe is the global default; Culqi is a Peruvian-specific
provider. Three constraints:

1. Stripe doesn't natively support Yape (the dominant PE wallet) without
   intermediaries; Culqi does.
2. SUNAT compliance (boletas/facturas) requires a domestic invoicing API;
   Culqi integrates with Nubefact, which issues PE-compliant comprobantes.
3. Culqi's PE card-acceptance rate is materially higher (~10–15 pp) than
   Stripe's PE acceptance rate due to local interbank routing.

**Decision.** Culqi is the canonical PE payment processor. Stripe is a
secondary path (international cards, behind a feature flag
`NEXT_PUBLIC_STRIPE_ENABLED`).

**Consequences.**
- 👍 Higher domestic conversion + native SUNAT comprobante issuance.
- 👍 Customers see Yape / Plin in the checkout — familiar, faster.
- 👎 Culqi's Subscriptions API is less mature than Stripe's; we're more
  exposed to provider quirks.
- 👎 Two payment paths to maintain.

**References.** `PAYMENTS.md`, `CONVENTIONS.md §7`,
`src/app/api/checkout/culqi/route.ts`.

---

## D05 · Twilio as WhatsApp BSP

**Status.** Accepted · 2026-Q1

**Context.** WhatsApp delivery requires a Business Solution Provider.
Options: Twilio, 360dialog, MessageBird, Wati, self-hosting via Whatsapp
Business API directly (only viable at scale). Sereno's flagship feature
is a Monday WhatsApp brief; delivery reliability is core to the product.

**Decision.** Twilio. Specifically, the **WhatsApp Cloud API via Twilio**.

**Why over alternatives.**
- Twilio's PE numbering is well-supported.
- We already use Twilio's Voice / SMS for operator self-alerts; one BSP
  reduces vendor surface.
- Approved Content Templates (`TWILIO_TEMPLATE_SID`) are required for
  outbound-initiated messages outside the 24h window — non-negotiable
  for a Monday brief.

**Consequences.**
- 👍 Reliable delivery; constant-time HMAC verification of status webhooks.
- 👎 Per-message price > a self-hosted Cloud API instance, accepted.
- 👎 Template-approval friction. Mitigation: keep templates generic
  enough to survive minor copy iterations.

**References.** `CONVENTIONS.md §7`, `scripts/whatsapp/send.ts`,
`src/app/api/webhooks/twilio/route.ts`.

---

## D06 · Anthropic Claude for all LLM calls

**Status.** Accepted · 2026-Q1

**Context.** OpenAI vs Anthropic vs (Mistral / Llama / etc.). Two
LLM-driven surfaces: Sereno's weekly brief generator and the Lima-aware
audit on raineylaguna-next.

**Decision.** Anthropic Claude (`claude-3-5-sonnet-20241022` default,
`claude-3-haiku-20240307` for the diff-enrichment "why-it-matters").

**Why over OpenAI.**
- Spanish-language quality on PE-localised content is materially better
  in qualitative comparisons (informed by the operator's tests).
- Anthropic's stricter refusals are an acceptable trade for a product
  that ships into restaurateurs' WhatsApp inboxes.
- Single vendor reduces credential / billing surface.

**Consequences.**
- 👍 One key, one console, one bill.
- 👎 Anthropic outage = both surfaces degraded. Mitigation: `PROTO_STUB_MODE=1`
  for the marketing surface returns deterministic output; Sereno's brief
  pipeline tolerates a one-week postponement.

**References.** `CONVENTIONS.md §7`, `scripts/boletin/generate.ts`,
`src/app/api/proto/generate/route.ts` (raineylaguna-next),
`src/lib/proto-prompt.ts` (raineylaguna-next).

---

## D07 · Postgres on Railway (not Supabase / Neon)

**Status.** Accepted · 2026-Q1

**Context.** Sereno needs a relational store; the marketing site needs a
small persistence surface for proto-store and audit logs.

**Decision.** Railway-managed Postgres for both Sereno and the marketing
site. Each Railway project gets its own Postgres service, attached
implicitly via `DATABASE_URL`.

**Why over Supabase.**
- We don't need Supabase's auth / storage / realtime — only the
  Postgres. Carrying the full Supabase surface adds a vendor lock for
  features we don't use.
- Railway's deploy-and-DB-in-one-place reduces ops complexity for the
  current scale.

**Why over Neon.**
- Sereno's writes pattern is bursty (Monday cron) but predictable;
  Neon's serverless cold-start tax is unwanted on a job that already
  has tight time-to-WhatsApp-delivery SLOs.
- Railway's flat pricing matches the predictable load profile.

**Consequences.**
- 👍 Simple ops: one provider for compute + DB.
- 👎 Vendor-locked to Railway-isms (their internal networking, env
  injection, deploy hooks). Acceptable at this scale.

**References.** `CONVENTIONS.md §7`, `DEPLOY.md`.

---

## D08 · `raineylagunastudios.com` is static HTML, no build

**Status.** Accepted · 2025-Q4

**Context.** The parent-brand site is a "living manifesto" with three
WebGL signature mechanics. Two paths:

1. Migrate to Next.js so it shares tooling with the web-vertical site.
2. Keep it as hand-authored static HTML + ES-module scripts on a CDN.

**Decision.** Stay static. Build step is `node scripts/check-html.mjs`
(syntax / JSON-LD / inline-JS validation, runs in CI).

**Why.**
- The site is *the artifact*: Fraunces variable-axes wired to
  Open-Meteo Lima weather, the Memory Object, hydroprint demos. Adding
  React / Next would obscure the craft, not amplify it.
- A static site is an unkillable artifact. CDN edge cache, no runtime,
  no upgrade treadmill.
- The voice register (atmospheric, slow, poetic, Spanish-first per
  `CONVENTIONS §15`) reads better when the source code looks like
  letterpress, not bundler output.

**Consequences.**
- 👍 No bundler updates, no Node version upgrade pressure, no
  `next` major-version migrations.
- 👍 Page weight is genuinely under control.
- 👎 No automatic i18n routing; everything lives in `data-es` /
  `data-en` attributes consumed by an inline interpolator.
- 👎 No image optimization pipeline; manual squoosh runs.

**References.** `raineylagunastudios/README.md`,
`raineylagunastudios/scripts/check-html.mjs`.

---

## D09 · npm (not pnpm / yarn / bun) across all repos

**Status.** Accepted · 2025-Q4

**Context.** Multiple package managers were considered.

**Decision.** Stock npm. `package-lock.json` checked in. CI uses
`npm ci`.

**Why.**
- Zero install friction for any contributor — comes with Node.
- Railway's build step ships `npm` natively.
- The repos don't have a workspace shape that benefits from pnpm's
  symlink layout (we explicitly chose four separate repos in D01).

**Consequences.**
- 👍 Lowest possible adoption barrier.
- 👎 Slower than pnpm / bun on a fresh install. Acceptable in CI;
  cached after first run.
- 👎 npm's resolution is occasionally dumber than pnpm's (peerDeps).
  Mitigation: `overrides` in `package.json` when needed (see
  `vigia/package.json`).

**References.** `CONVENTIONS.md §3`.

---

## D10 · Node 22 LTS pinning in CI

**Status.** Accepted · 2026-05-06

**Context.** CI workflows could float on `node-version: latest`, pin to
the major Next.js requires (Node 18.18+ for Next 16), or pin to LTS.

**Decision.** Pin to Node 22 LTS in every CI workflow. Match in
production via Railway's `nixpacks` selection.

**Why.**
- LTS = security patches without surprise major bumps.
- 22 specifically: native fetch, structured-clone, dispose-pattern,
  matches what the dependency tree expects.
- Pinning a major (not floating) means a Node 24 release doesn't break
  CI overnight.

**Consequences.**
- 👍 Reproducible builds.
- 👎 Manual upgrade decision when 24 LTS lands. Acceptable.

**References.** `CONVENTIONS.md §3`, `.github/workflows/ci.yml` per repo.

---

## D11 · `instrumentation.ts` for boot-time env validation + Sentry init

**Status.** Accepted · 2026-05-06

**Context.** Two mechanisms run at server boot: env validation (Zod) and
Sentry init. Three places they could live:

1. Each route handler — duplicated, racy.
2. `next.config.js` — runs at *build* time, not request time.
3. `instrumentation.ts` — Next's official boot hook, runs once per
   server process.

**Decision.** `src/instrumentation.ts` per Next.js convention.

**Why.**
- Single source of truth for boot ordering.
- Validation runs *before* the first request, so a malformed env
  crashes fast and Railway's restart loop surfaces it.
- Sentry init can layer on cleanly; future hooks (OTel, Anthropic
  budget cap, BullMQ workers) follow the same pattern.

**Consequences.**
- 👍 No request-time overhead — validation happens at boot.
- 👍 Clear failure mode: bad env → process exits with the schema error
  printed.
- 👎 Adds a dependency on Next's instrumentation hook, which has
  evolved across major versions (Next 13 → 14 → 15 → 16). Locked to
  Next 16 conventions.

**References.** `CONVENTIONS.md §10`, `src/instrumentation.ts` per repo.

---

## D12 · Webhook idempotency via Postgres `webhook_events` (not Redis)

**Status.** Accepted · 2026-05-07

**Context.** Three webhook providers (Culqi, Twilio, Stripe) retry
failed deliveries. Without idempotency: duplicate boletas, duplicate
subscription rows, duplicate analytics events. Two patterns:

1. Redis SETNX with TTL.
2. Postgres `INSERT ... ON CONFLICT DO NOTHING` against a unique index.

**Decision.** Postgres `webhook_events` table with unique index on
`(provider, event_id)`. Helper module `src/lib/webhook-idempotency.ts`
exposes `dedupeWebhook(provider, eventId, handler)`.

**Why over Redis.**
- We already have Postgres for everything else; adding Redis-as-truth
  expands the failure surface.
- Postgres gives us auditability for free: every received webhook is
  on disk forever (or until we add a TTL job), useful for forensics
  when something bills wrong.
- The throughput of webhook deliveries (~thousands/day at peak) is
  trivial for Postgres.

**Consequences.**
- 👍 Forensic record of every webhook.
- 👍 Atomic dedupe via the unique index — no race window.
- 👎 Dead rows accumulate over time. Mitigation: add a 90-day TTL
  cleanup cron (deferred).

**References.** `CONVENTIONS.md §11`, `src/lib/webhook-idempotency.ts`,
`src/lib/db.ts` (`webhook_events` schema).

---

## D13 · Two git remotes on `c:\Users\Stu\vigia` (`origin` + `v2`)

**Status.** Accepted · 2026-05-06 (current state, deferred cleanup)

**Context.** During the Vigía → Sereno rename, a parallel branch was
pushed by an unsupervised GitHub Copilot Agent run on the *archived*
`datacendia/vigia` repo, while the canonical work continued on
`datacendia/vigiaV2`. The local clone has both as remotes.

**Decision.** Keep both remotes in place; document the gotcha in
`CONVENTIONS.md §1`. Always push with `git push v2 …` from this
folder. Pushing to `origin` would pollute the archived repo.

**Consequences.**
- 👍 The archived repo's history is preserved as-is, including the
  Copilot Agent's parallel work, which can be mined later if any of
  those features become useful.
- 👎 Permanent footgun for new sessions. Mitigated by the explicit
  warning in CONVENTIONS.

**Reopen-when.** Operator decides to mine the archived repo for
salvageable code; until then, the chore-rename
(`v2` → `origin`, drop archived) is deferred.

**References.** `CONVENTIONS.md §1`.

---

## D14 · Sentry minimal init now; sourcemap upload deferred

**Status.** Accepted · 2026-05-07

**Context.** `@sentry/nextjs` has two layers of integration:

1. `Sentry.init()` — error capture, traces, no build-time concern.
2. `withSentryConfig()` wrapper around `next.config.js` — sourcemap
   upload, requires `SENTRY_AUTH_TOKEN`, complicates CI builds.

**Decision.** Layer 1 only for now. The SDK is conditional on
`SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` being set, so the marketing site
ships unchanged when no DSN is configured.

**Consequences.**
- 👍 ~80% of Sentry's value (error capture + traces) at ~5% of the
  setup complexity.
- 👍 No CI build dependency on a Sentry org token.
- 👎 Stack traces in Sentry are minified until sourcemaps are uploaded.
  Acceptable until we have enough volume to need named frames.

**Reopen-when.** First production incident where minified frames
genuinely block diagnosis, or operator accepts the
`SENTRY_AUTH_TOKEN` rotation cost.

**References.** `CONVENTIONS.md §13.5`, `src/instrumentation.ts`,
`instrumentation-client.ts` per repo.

---

## D15 · Vitest (not Jest) for unit tests

**Status.** Accepted · 2026-05-07

**Context.** Three runner candidates: Jest (incumbent), Vitest, Node's
built-in `node --test`.

**Decision.** Vitest.

**Why.**
- ESM-native; matches the rest of the repo (Next 16 + React 19 + ESLint 10
  are all ESM-first).
- Drop-in Jest API surface (describe / it / expect / vi.mock) so future
  Jest contributors land softly.
- Built on Vite — fast cold-starts, watch mode is genuinely usable on
  the operator's workstation.
- Plays well with TypeScript out of the box; no Babel config.

**Why not Jest.**
- Jest's CommonJS-first stance creates friction with ESM-only deps
  (which Sereno has via `@anthropic-ai/sdk`, `jose`, etc.).
- Slower, more config.

**Why not `node --test`.**
- Test discovery, snapshot, mocking story still maturing. Re-evaluate
  in ~2 years.

**Consequences.**
- 👍 Fast, modern, ESM-native.
- 👎 Newer ecosystem; some adapters (e.g. for Storybook) may lag Jest's.

**References.** `CONVENTIONS.md §13.5`, `vigia/vitest.config.ts`.

---

## D16 · `CONVENTIONS.md` as load-bearing anti-drift document

**Status.** Accepted · 2026-05-06

**Context.** AI sessions across multiple weeks were re-asking
already-decided questions ("should we use Stripe?", "what's the brand
name?", "what's the schema for X?"), wasting tokens and risking silent
divergence between repos.

**Decision.** Author `rainey-stack/CONVENTIONS.md` as the single
canonical document. Every product repo's README links to it as
"Read first, every session." Each entry that captures a locked-in
decision links here for the *why*; this file is the long-form,
CONVENTIONS.md is the cheat sheet.

**Consequences.**
- 👍 New sessions paste relevant sections into context and ramp in
  minutes, not hours.
- 👍 Drift becomes visible: when CONVENTIONS contradicts a repo's
  README, the README must be reconciled within 24h.
- 👎 Maintenance overhead: every locked-in decision needs an entry.
  Mitigated by a §16 TODO table inside CONVENTIONS that tracks
  freshness.

**References.** `CONVENTIONS.md §16` (meta), `README.md`.

---

## D17 · Schema bootstrap via `CREATE TABLE IF NOT EXISTS`, no migration framework

**Status.** Accepted · 2025-Q4

**Context.** Sereno needs a Postgres schema. Options: Drizzle, Prisma,
Knex migrations, or hand-written SQL via `IF NOT EXISTS`.

**Decision.** Hand-written SQL in `src/lib/db.ts::SCHEMA_SQL`, executed
on first DB query via `ensureSchema()`. Idempotent.

**Why.**
- At Sereno's scale, "drop column" is a once-a-quarter event, not a
  daily one.
- A migration framework adds: a CLI to learn, a generated lockfile,
  a deploy step, a rollback story. None of those pay for themselves
  yet.
- `ALTER TABLE ADD COLUMN IF NOT EXISTS` covers the additive cases
  cleanly (already used for Counter-Move v2).

**Reopen-when.**
- First destructive migration (drop column / rename column / change
  type) — manual SQL becomes risky. Adopt Drizzle or Prisma at that
  point and do a one-time import.

**Consequences.**
- 👍 Zero migration tooling to learn or debug.
- 👍 Cold starts boot the schema implicitly.
- 👎 Destructive changes require operator-run manual SQL with a
  runbook entry.

**References.** `src/lib/db.ts:313` (`ensureSchema`), `CONVENTIONS.md §9`.

---

## D18 · Zod-validated env loader; every var `.optional()` initially

**Status.** Accepted · 2026-05-07

**Context.** 51 distinct env vars in Sereno; ~12 in raineylaguna-next.
Reading them via raw `process.env.X` produces silent runtime surprises
when typos / missing values aren't caught at boot.

**Decision.** `src/lib/env.ts` per Next.js repo: Zod schemas split into
`serverSchema` and `clientSchema`. Eagerly parsed on the server at
boot via `instrumentation.ts`. **Every var is `.optional()` initially**;
the schema validates *shape* only (URL format, key prefixes, minimum
length, boolean coercion).

**Why optional-first.**
- Production code already runs with partial env (degraded modes,
  fallbacks to file-based JSON). Promoting fields to required would
  crash a currently-working production service.
- Required-ness is a per-call-site audit; landing it as a separate PR
  per call site is safer than a big-bang switch.

**Consequences.**
- 👍 Boot-time failure on bad shapes (Anthropic key without `sk-ant-`,
  malformed RUC, non-URL `DATABASE_URL`).
- 👍 Type-safe consumer story (`serverEnv.X` instead of
  `process.env.X` casts).
- 👎 Doesn't yet enforce presence; a missing required var still
  surfaces as a runtime 503. Acceptable while the audit ratchets up.

**References.** `CONVENTIONS.md §10`, `src/lib/env.ts` per repo.

---

## D19 · Idempotent `briefs` upsert via unique `(customer_slug, week_of)` index

**Status.** Accepted · 2026-Q1

**Context.** The Sereno boletín pipeline runs weekly (cron + manual
re-runs), and re-running for the same `(customer_slug, week_of)` is
intentional — it overwrites a draft with a regeneration.

**Decision.** `briefs` table has a UNIQUE INDEX on
`(customer_slug, week_of)`. Generator uses `INSERT ... ON CONFLICT
(customer_slug, week_of) DO UPDATE`. Status (`draft` / `approved` /
`sent`) is preserved when we want it; the sample-week placeholder
flag survives regenerations.

**Consequences.**
- 👍 Pipeline can be re-run safely without manual cleanup.
- 👍 Sample-week trigger's placeholder is upgraded to a real brief
  cleanly.
- 👎 No history of *previous* drafts for the same week. Mitigation:
  `events.brief.generated` rows preserve the audit trail.

**References.** `src/lib/db.ts` (`idx_briefs_unique`),
`src/lib/briefs.ts::upsertDraft`, `src/lib/sample-week.ts`.

---

## D20 · English mirror under `/en/*`, not a separate domain

**Status.** Accepted · 2026-Q1

**Context.** raineylaguna.com targets Lima (Spanish primary) but also
serves international prospects. Two patterns:

1. `raineylaguna.com/en/*` — same domain, sub-route.
2. `en.raineylaguna.com` — subdomain.

**Decision.** `/en/*` sub-routes.

**Why.**
- One Cloudflare zone, one Railway service, one CI workflow.
- Shared SEO authority; no canonical-tag gymnastics.
- Spanish stays the default at the apex domain — the brand register
  per `CONVENTIONS §15` is Spanish-first.
- Easier to mirror exactly: one ES file per page, one EN file alongside.

**Consequences.**
- 👍 Operationally trivial.
- 👎 The naive `next-intl` route map is the simplest implementation
  and we may outgrow it. Re-evaluate when there are >15 pages.

**References.** `CONVENTIONS.md §15`, `raineylaguna-next/src/app/en`.
