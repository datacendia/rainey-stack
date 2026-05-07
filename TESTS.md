# TESTS.md — Test Catalog for the Rainey Laguna Stack

Authoritative inventory of every test that should exist across the four
product repos, with priority, type, and current status. This file is the
source of truth for "what's tested" — `CONVENTIONS.md` §13.5 sequences the
order of implementation; this file enumerates the destination.

> **Scope.** Unit, integration, and end-to-end tests across `raineylaguna-next`,
> `vigiaV2` (Sereno), `raineylaguna-crm`, and `raineylagunastudios`. Manual
> QA scripts and one-off operator validations live in `RUNBOOKS.md`, not here.

> **Process.** When a test ships, change its **Status** to `✅` and link the
> test file. When a feature ships without a corresponding test, **add the
> test entry first as `❌`** so the gap is visible. Never delete an entry —
> obsolete tests get marked `🗑 retired` with a one-line reason.

## Legend

- **Priority** — `P0` blocks production, `P1` should land within a week,
  `P2` is hygiene, `P3` is nice-to-have.
- **Type** — `U` unit (pure function, no I/O), `I` integration (touches DB
  / network / FS), `E` end-to-end (Playwright / Cypress).
- **Status** — `✅` passing, `🟡` in progress, `❌` not started, `🗑` retired.

---

## 1 · Cross-cutting (the four repos)

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| X01 | CONVENTIONS.md links resolve in CI | U | P2 | ❌ | markdown-link-check action; gates the rainey-stack repo |
| X02 | Every repo's `.env.example` matches its `src/lib/env.ts` schema | I | P1 | ❌ | Diff script; runs in each repo's CI |
| X03 | DEPLOY.md env-var list matches each repo's env loader | U | P2 | ❌ | Codegen + grep |
| X04 | Branch protection rule on `main`/`master` for every repo | — | P1 | ❌ | Manual GitHub UI, recorded in DECISIONS.md |
| X05 | All four repos pin Node 22 LTS in CI | U | P0 | ✅ | All workflows set to Node 22 |
| X06 | `instrumentation.ts` boot fails fast on bad env in every Next.js repo | I | P0 | ❌ | Smoke test: bad ANTHROPIC_API_KEY → process exits 1 |

---

## 2 · `vigiaV2` (Sereno) — the largest test surface

### 2.1 Pure / unit (`src/lib/*`)

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| S01 | `sample-week.ts::nextMondayISO()` | U | P0 | ❌ | Day-1-PM target. Lima TZ, every DOW, `includeToday` |
| S02 | `sample-week.ts::seedSamplePlaceholder()` payload shape | U | P1 | ❌ | Mock `upsertDraft`, assert `meta.is_sample` |
| S03 | `shortlinks.ts::generateSlug()` collisions across 100k samples | U | P1 | ❌ | Probabilistic; 6-char alphabet seed |
| S04 | `shortlinks.ts::resolveSlug()` 302 / 404 paths | U | P1 | ❌ | Mock pool query |
| S05 | `plans.ts::getPlan()` returns null for unknown slug | U | P0 | ❌ | One-liner, foundation |
| S06 | `plans.ts` price totals match marketing pages | U | P0 | ❌ | Locked-in S/249 per CONVENTIONS §7 |
| S07 | `events.ts::trackSafe()` swallows DB errors silently | U | P0 | ❌ | Failure mode: must not throw to caller |
| S08 | `events.ts` payload sanitization (no PII keys) | U | P1 | ❌ | Allow-list of payload keys |
| S09 | `nubefact.ts::issueComprobante()` request body shape | U | P0 | ❌ | Snapshot test against fixture |
| S10 | `nubefact.ts` retries on 5xx; gives up on 4xx | I | P0 | ❌ | nock |
| S11 | `subscriptions.ts::createSubscription()` idempotent on culqi_subscription_id | I | P0 | ❌ | DB integration |
| S12 | `subscriptions.ts::recordCharge()` increments last_charged_at | I | P0 | ❌ | DB integration |
| S13 | `subscriptions.ts::nextComprobanteNumero()` is monotonic under contention | I | P0 | ❌ | Concurrent transactions |
| S14 | `briefs.ts::upsertDraft()` idempotent on (customer_slug, week_of) | I | P0 | ❌ | DB integration; sample-week trigger relies on it |
| S15 | `briefs.ts::approveBrief()` state machine (draft→approved only) | U | P1 | ❌ | Reject illegal transitions |
| S16 | `briefs.ts` Counter-Move v2: `counter_moves` JSONB shape | U | P1 | ❌ | Schema validation |
| S17 | `priority-score.ts` (if present) | U | P1 | ❌ | Per ROADMAP — verify file location |
| S18 | `webhook-idempotency.ts::dedupeWebhook()` first call returns `fresh:true` | I | P0 | ❌ | DB integration |
| S19 | `webhook-idempotency.ts::dedupeWebhook()` replay returns `fresh:false` | I | P0 | ❌ | DB integration |
| S20 | `webhook-idempotency.ts` failure persists `result.ok=false` and re-throws | I | P0 | ❌ | DB integration |
| S21 | `webhook-idempotency.ts::fallbackEventId()` deterministic for same body | U | P1 | ❌ | sha256 stability |
| S22 | `cors.ts` allow-list logic (preview / prod / unset cases) | U | P1 | ❌ | Per CONVENTIONS §7 |
| S23 | `admin-auth.ts::verifyCookie()` rejects expired / tampered tokens | U | P0 | ❌ | Sign with bad secret → reject |
| S24 | `admin-auth.ts` constant-time bcrypt compare | U | P0 | ❌ | Timing-attack regression |
| S25 | `env.ts` rejects malformed `DATABASE_URL` | U | P1 | ❌ | Zod schema test |
| S26 | `env.ts::serverEnv` Proxy throws when accessed in browser | U | P0 | ❌ | Mock `typeof window` |
| S27 | `env.ts::clientEnv` warns but does not throw on bad NEXT_PUBLIC_* | U | P1 | ❌ | Soft-warn behaviour |
| S28 | `env.ts` `SKIP_ENV_VALIDATION=1` bypasses parse | U | P0 | ❌ | CI build path |
| S29 | `cron-auth.ts::verifyCronSecret()` constant-time compare | U | P0 | ❌ | Timing-attack regression |
| S30 | `i18n` Spanish/English string parity (no missing keys) | U | P2 | ❌ | Snapshot of key set |

### 2.2 Route handlers / API

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| S40 | `POST /api/webhooks/culqi` rejects bad HMAC with 401 | I | P0 | ❌ | Signed body fixture |
| S41 | `POST /api/webhooks/culqi` accepts valid HMAC | I | P0 | ❌ | Round-trip with CULQI_WEBHOOK_SECRET |
| S42 | `POST /api/webhooks/culqi` deduplicates retried event.id | I | P0 | ❌ | Two POSTs, one dispatch |
| S43 | `POST /api/webhooks/culqi` issues exactly one comprobante per event | I | P0 | ❌ | Counts Nubefact mock calls |
| S44 | `POST /api/webhooks/twilio` rejects bad X-Twilio-Signature | I | P0 | ❌ | Signed form-urlencoded |
| S45 | `POST /api/webhooks/twilio` deduplicates (sid, status) tuple | I | P0 | ❌ | Two retries, one trackSafe |
| S46 | `POST /api/webhooks/twilio` emits `brief.send_failed` for `undelivered` | I | P1 | ❌ | Status mapping |
| S47 | `POST /api/webhooks/stripe` deduplicates event.id | I | P0 | ❌ | Two POSTs, one createSubscription |
| S48 | `POST /api/webhooks/stripe` rejects bad signature | I | P0 | ❌ | constructEvent throws → 400 |
| S49 | `POST /api/checkout/culqi` creates Culqi subscription | I | P1 | ❌ | nock Culqi API |
| S50 | `POST /api/checkout/stripe` creates Checkout session with plan metadata | I | P1 | ❌ | nock Stripe API |
| S51 | `POST /api/onboarding` stamps `sample_brief_due` to next Monday | I | P1 | ❌ | DB integration |
| S52 | `POST /api/admin/login` rate-limits brute force | I | P0 | ❌ | 10 bad attempts → 429 |
| S53 | `POST /api/admin/login` sets HttpOnly Secure SameSite=Strict cookie | I | P0 | ❌ | Header inspection |
| S54 | `POST /api/admin/logout` clears cookie | I | P1 | ❌ | Set-Cookie has Max-Age=0 |
| S55 | `POST /api/cron/weekly` requires CRON_SECRET | I | P0 | ❌ | 401 without bearer |
| S56 | `POST /api/cron/weekly` is idempotent on `pipeline_locks` | I | P0 | ❌ | Two parallel calls → one lock holder |
| S57 | `GET /api/brief?slug=...` CORS allow-list enforced | I | P0 | ❌ | Preflight from forbidden origin → 403 |
| S58 | `GET /api/brief?slug=demo` returns curated fallback when DB unset | I | P1 | ❌ | hasDatabase=false path |
| S59 | `POST /api/audit*` CORS allow-list enforced | I | P1 | ❌ | Same as S57 |
| S60 | `POST /api/audit-completed` records ip_hash (not raw IP) | I | P0 | ❌ | AUDIT_IP_SALT applied |
| S61 | `GET /j/[slug]` 302s to target and increments click_count | I | P1 | ❌ | shortlinks integration |
| S62 | `GET /api/health` returns 200 with commit sha | I | P1 | ❌ | RAILWAY_GIT_COMMIT_SHA echo |
| S63 | `POST /api/socio/respond` requires authenticated client | I | P1 | ❌ | Socio AI assistant route |
| S64 | `POST /api/proto/generate` 503s when ANTHROPIC_API_KEY unset and `PROTO_STUB_MODE!=1` | I | P1 | ❌ | (raineylaguna-next; cross-listed) |

### 2.3 Boletín pipeline (CLI / cron)

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| S70 | `scripts/boletin/generate.ts` end-to-end from snapshots → brief draft | I | P1 | ❌ | Use a fixture snapshot set |
| S71 | Anthropic call honours `ANTHROPIC_MODEL` override | I | P2 | ❌ | nock Anthropic |
| S72 | Anthropic budget cap aborts after threshold | I | P0 | ❌ | Pending `anthropic-budget-cap` |
| S73 | `scripts/collectors/collect.ts` writes to `snapshots` table | I | P1 | ❌ | Each collector module |
| S74 | `scripts/whatsapp/send.ts` uses approved Content Template SID | I | P0 | ❌ | TWILIO_TEMPLATE_SID required |
| S75 | `scripts/weekly.ts` end-to-end: generate → review queue → send | E | P1 | ❌ | Day-3 e2e per CONVENTIONS §13.5 |
| S76 | `scripts/alert.ts` notifies operator on cron failure | I | P1 | ❌ | OPERATOR_WHATSAPP receives message |

### 2.4 Admin dashboard (browser)

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| S80 | Login → dashboard → review queue → approve flow | E | P1 | ❌ | Playwright |
| S81 | Approve a brief → `briefs.status` transitions draft→approved | E | P1 | ❌ | Playwright + DB assert |
| S82 | Reject a brief with reason → `rejection_reason` persisted | E | P2 | ❌ | Playwright |
| S83 | Operator can toggle Counter-Move "did this" tracker | E | P2 | ❌ | Pending `counter-move-tracker` |
| S84 | Customer self-service cancel flow | E | P1 | ❌ | Pending `self-cancel-sereno` |

### 2.5 Public-facing surfaces

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| S90 | `/` (Spanish landing) renders without JS | E | P1 | ❌ | Playwright with JS disabled |
| S91 | `/precios` shows S/249 (CONVENTIONS-locked price) | E | P0 | ❌ | Critical regression guard |
| S92 | `/muestra` public live-brief renders fallback when DB unset | E | P2 | ❌ | hasDatabase=false |
| S93 | `/api/brief?slug=demo` Cache-Control honoured | I | P1 | ❌ | s-maxage on the response |

---

## 3 · `raineylaguna-next` (marketing / web vertical)

### 3.1 Pure / unit (`src/lib/*`)

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| W01 | `lima-weather.ts` cached / live paths | I | P1 | ❌ | Open-Meteo mock |
| W02 | `lima-weather.ts` graceful fallback when API 5xx | U | P1 | ❌ | |
| W03 | `audit-heuristics.ts` warning enumeration | U | P1 | ❌ | If extracted from route |
| W04 | `proto-prompt.ts::buildProtoUserMessage()` schema | U | P0 | ❌ | Anthropic input contract |
| W05 | `proto-prompt.ts::extractProtoJson()` tolerates code-fence wrapping | U | P1 | ❌ | Common Claude output shape |
| W06 | `proto-prompt.ts::validateProtoOutput()` rejects missing required fields | U | P0 | ❌ | Zod contract |
| W07 | `proto-store.ts` Postgres path | I | P1 | ❌ | DB integration |
| W08 | `proto-store.ts` JSON file fallback when DATABASE_URL unset | I | P1 | ❌ | Filesystem |
| W09 | `proto-ig.ts` Meta Graph token gating | U | P2 | ❌ | Skips when token unset |
| W10 | `services.ts` slug ↔ entry round-trip | U | P1 | ❌ | After 8-page expansion |
| W11 | `env.ts` server schema rejects bad ANTHROPIC_API_KEY prefix | U | P0 | ❌ | Regex contract |
| W12 | `env.ts::serverEnv` Proxy throws on browser | U | P0 | ❌ | Same as Sereno S26 |
| W13 | `env.ts::clientEnv` soft-warns on bad NEXT_PUBLIC_* | U | P1 | ❌ | Same as Sereno S27 |

### 3.2 Route handlers / API

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| W20 | `POST /api/lead` forwards to CRM with HMAC-signed body | I | P0 | ❌ | Mock CRM endpoint |
| W21 | `POST /api/lead` falls back to log-only when CRM_PUBLIC_API unset | I | P1 | ❌ | Stub mode |
| W22 | `POST /api/audit` runs full audit pipeline | I | P1 | ❌ | PageSpeed mocked |
| W23 | `POST /api/audit` 503s gracefully without PAGESPEED_INSIGHTS_API_KEY | I | P2 | ❌ | Local heuristics only |
| W24 | `POST /api/proto/generate` returns deterministic stub when `PROTO_STUB_MODE=1` | I | P1 | ❌ | No Anthropic call |
| W25 | `POST /api/proto/generate` rate-limits per IP | I | P1 | ❌ | If implemented |
| W26 | `GET /p/[slug]` renders persisted prototype | E | P2 | ❌ | proto-store integration |

### 3.3 Pages / e2e

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| W30 | Home `/` renders pixel-faithful to design spec | E | P1 | ❌ | Visual regression (Percy / Playwright snapshots) |
| W31 | `<RainShader>` falls back to static image when WebGL unavailable | E | P2 | ❌ | Headless browser without WebGL |
| W32 | `/auditoria` form submits → CRM lead created | E | P0 | ❌ | Critical lead-gen path |
| W33 | `/contacto` form submits → CRM lead created | E | P0 | ❌ | Critical lead-gen path |
| W34 | `/en/audit` (English mirror) renders identically structured | E | P1 | ❌ | Pending `en-mirror-services` |
| W35 | `/servicios/[slug]` × 8 service detail pages render | E | P1 | ❌ | Pending `en-mirror-services` for /en |
| W36 | i18n routing `/` ↔ `/en` preserves path | E | P2 | ❌ | Per CONVENTIONS §15 |
| W37 | OG meta tags present on every public page | U | P1 | ❌ | Linkedom on rendered HTML |
| W38 | `<SerenoBrief>` renders cached fallback when NEXT_PUBLIC_SERENO_API unset | E | P1 | ❌ | Sereno integration |

---

## 4 · `raineylaguna-crm` (internal CRM)

> CRM is not cloned in the workstation today; tests are documented here
> and ship in a CRM-side PR. See CONVENTIONS.md §1.

### 4.1 Lead pipeline

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| C01 | `priority-score.ts::scoreLead()` weighted-sum determinism | U | P0 | ❌ | Day-1-PM per CONVENTIONS §13.5 |
| C02 | `priority-score.ts` re-scores on lead update | I | P0 | ❌ | Trigger / observer |
| C03 | `POST /api/leads/public` rejects unsigned bodies | I | P0 | ❌ | CRM_LEAD_INTAKE_SECRET HMAC |
| C04 | `POST /api/leads/public` deduplicates by email + url within 24h | I | P1 | ❌ | Spam guard |
| C05 | `POST /api/leads/public` persists `audit_summary` JSONB blob | I | P1 | ❌ | From raineylaguna-next |
| C06 | Lead creation enqueues AI-drafted outreach via BullMQ | I | P1 | ❌ | Redis dependency |
| C07 | AI-drafted outreach respects `ANTHROPIC_MODEL` override | I | P2 | ❌ | |
| C08 | Monday digest cron sends summary to operator | I | P1 | ❌ | Cron + Resend |

### 4.2 Type-safety hygiene

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| C20 | No `as any` casts (audit) | U | P2 | ❌ | Pending `as-any-audit` |
| C21 | All env reads via `serverEnv` | U | P2 | ❌ | Pending env-zod-crm |

---

## 5 · `raineylagunastudios` (parent brand site)

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| R01 | `scripts/check-html.mjs` validates every shipped page | U | P0 | ✅ | Wired into CI in `e907359` |
| R02 | Markdown link-check passes across `*.md` | U | P2 | ❌ | Pending `markdown-link-check` |
| R03 | Hydroprint Lab demo loads without WebGL errors | E | P2 | ❌ | Playwright + console-error assert |
| R04 | Memory Object renders Fraunces with weather-driven axes | E | P3 | ❌ | Visual snapshot when humid vs dry |
| R05 | Almanac preorder form posts and shows confirmation | E | P1 | ❌ | If form is wired |
| R06 | SRI hashes present on every CDN script tag | U | P1 | ❌ | Pending `sri-hashes-studios` |
| R07 | `data/twins.json` shape matches consumer in `twin-wall.js` | U | P2 | ❌ | Schema validate |
| R08 | `og-image.html` renders without missing fonts | E | P3 | ❌ | OG generator path |

---

## 6 · Security / hardening (cross-cutting)

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| H01 | All webhook signature verifiers use `crypto.timingSafeEqual` | U | P0 | ✅ | Verified in audit; idempotency added in `c1aafac` |
| H02 | Webhook handlers idempotent across all providers | I | P0 | ✅ | dedupeWebhook in `c1aafac` |
| H03 | No `process.env.X` reads outside the env loader (post-refactor) | U | P2 | ❌ | Pending `env-refactor-*` |
| H04 | All admin routes require auth (no fail-open path) | I | P0 | ❌ | Crawl all routes, assert 401/403 |
| H05 | CSP header present on every public response | I | P1 | ❌ | next.config / middleware |
| H06 | No secrets in client bundles (grep `.next/static/**`) | U | P0 | ❌ | CI grep step |
| H07 | Postgres SSL on (rejectUnauthorized) by default | U | P0 | ❌ | Verify per-repo db.ts |
| H08 | bcrypt cost ≥ 12 for admin password hashing | U | P0 | ❌ | scripts/admin-user-create.ts |
| H09 | Cron endpoints require `CRON_SECRET` bearer | I | P0 | ❌ | Per route |
| H10 | Rate-limit on login + lead-intake routes | I | P1 | ❌ | Upstash or in-memory |
| H11 | Cloudflare Turnstile on every public form | E | P1 | ❌ | Pending `turnstile-public-forms` |

---

## 7 · Observability

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| O01 | Sentry server SDK initializes when SENTRY_DSN set | U | P1 | ❌ | Both Next.js apps |
| O02 | Sentry no-ops cleanly when SENTRY_DSN unset | U | P0 | ❌ | Boot doesn't crash |
| O03 | `onRequestError` forwards RSC errors to Sentry | I | P1 | ❌ | Both Next.js apps |
| O04 | Synthetic monitor on every public URL + /api/health | E | P0 | ❌ | Pending `synthetic-monitor` |
| O05 | Plausible analytics pageview event on every route | E | P2 | ❌ | Pending `plausible-analytics` |

---

## 8 · CI / build

| ID  | Title | Type | Pri | Status | Notes |
|-----|-------|------|-----|--------|-------|
| B01 | `npm run lint` passes in raineylaguna-next | U | P0 | ✅ | Wired in `88d82f1` |
| B02 | `npm run typecheck` passes in raineylaguna-next | U | P0 | ✅ | Wired in `88d82f1` |
| B03 | `npm run build` passes in raineylaguna-next | U | P0 | ✅ | Wired in `88d82f1` |
| B04 | `npm run lint` passes in vigiaV2 | U | P0 | ✅ | Wired in `60e5cbe` |
| B05 | `npm run typecheck` passes in vigiaV2 | U | P0 | ✅ | Wired in `60e5cbe` |
| B06 | `npm run build` passes in vigiaV2 | U | P0 | ✅ | Wired in `60e5cbe` |
| B07 | `npm run check` passes in raineylagunastudios | U | P0 | ✅ | Wired in `e907359` |
| B08 | Playwright tests run in CI for at least one repo | E | P1 | ❌ | Probably Sereno first |
| B09 | Vitest (or equivalent) installed in vigiaV2 | U | P1 | 🟡 | Day-1-PM target |
| B10 | Vitest installed in raineylaguna-next | U | P2 | ❌ | Follow-up |

---

## Priority order for implementation

Per `CONVENTIONS.md` §13.5, the canonical ramp is:

1. **Day 1 AM** — `B01–B07` (CI gates per repo). ✅ Done.
2. **Day 1 PM** — `S01`, `C01` (first Vitest suites). 🟡 In progress.
3. **Day 2** — `S05–S08`, `S18–S21`, `W04–W06` (pure-function units).
4. **Day 3** — `S40–S48`, `S75`, `S80–S82` (e2e + webhook integration).
5. **Day 4** — `H01–H10`, `O01–O03` (security + observability sweep).
6. **Day 5+** — All remaining `P1` entries; `P2`/`P3` ratchet up over time.

> **House rules.**
> - Land tests in the same PR as the feature whenever feasible.
> - When a P0 test goes red on `main`, no new feature merges until it's
>   green or explicitly retired with reason.
> - Mock external APIs (`nock` for HTTP, `pg-mem` for Postgres unit-only).
>   Real DB needed only for the `I` and `E` rows.
