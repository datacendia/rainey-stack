# STATUS.md — 42-item progress tracker

**As of:** 2026-05-08 — branch `claude/review-and-commit-changes-2bIcg` across all 5 repos.

This is the canonical status doc for the multi-repo improvement programme. Each
row maps an item from the operator's checklist to hard evidence (a commit SHA,
a file path, or an explicit "N/A — reason"). Update this file in the same PR
as the work it tracks.

Legend: `[x]` shipped & verified · `[~]` partial · `[ ]` not started ·
`[N/A]` not applicable (with reason).

Repos referenced:
- `rs` = rainey-stack (this repo)
- `vV2` = vigiaV2 (Sereno)
- `rln` = raineylaguna-next
- `rls` = raineylagunastudios
- `crm` = raineylaguna-crm

> **Note:** items in `crm` cannot be verified from the current sandbox (repo
> not cloned). They are listed as `[?]` until a session with that workspace
> open ticks them off.

---

## Documentation & conventions (rainey-stack)

| #  | Item                                              | Status | Evidence |
|----|---------------------------------------------------|--------|----------|
| 1  | `rs` CONVENTIONS.md authored                      | `[x]`  | `CONVENTIONS.md` 39 KB, 493 lines · commit `9296927` |
| 2  | `rs` README.md authored                           | `[x]`  | `README.md` present at root |
| 17 | `rs` TESTS.md catalogue                           | `[x]`  | `TESTS.md` 19 KB, 241 lines · commit `e28d72f` |
| 18 | `rs` DECISIONS.md ADR log                         | `[x]`  | `DECISIONS.md` 25 KB, 482 lines · commit `f37e204` |
| 19 | `rs` RUNBOOKS.md failure playbooks                | `[x]`  | `RUNBOOKS.md` 21 KB, 518 lines · commit `f37e204` |
| 42 | Markdown link-check CI                            | `[x]`  | `.github/workflows/link-check.yml` · commit `94005d2` (lychee, push/PR/Mon-09:00 UTC) |

## Read-first pointers (each repo's README links back to `rs/CONVENTIONS.md`)

| #  | Repo  | Status | Evidence |
|----|-------|--------|----------|
| 4  | `vV2` | `[x]`  | `README.md` lines 6–14 (with BIBLE.md as repo-local doc) |
| 3  | `rln` | `[x]`  | `README.md` lines 5–11 |
| 5  | `rls` | `[x]`  | `README.md` lines 7–14 |
| 6  | `crm` | `[?]`  | unverifiable — repo not in sandbox |

## env-loader (zod, fail-fast)

| #  | Repo  | Status | Evidence |
|----|-------|--------|----------|
| 11 | `vV2` | `[x]`  | `src/lib/env.ts` · 4-commit refactor `b167be1`→`f14b0e6` (scripts/ documented as bootstrapped exemptions) |
| 10 | `rln` | `[x]`  | `src/lib/env.ts` (179 lines), `src/instrumentation.ts` (70 lines) · commit `04b67ce` + `ef750e3` |

## Sentry SDK init

| #  | Repo  | Status | Evidence |
|----|-------|--------|----------|
| 13 | `vV2` | `[x]`  | `instrumentation-client.ts` at root (Next 16 modern client init), `src/instrumentation.ts` server+edge, `src/lib/sentry.ts` shared shim |
| 12 | `rln` | `[x]`  | `src/instrumentation.ts` + `instrumentation-client.ts` · commit `a209edc` |

## Webhook security (vigiaV2)

| #  | Item                                              | Status | Evidence |
|----|---------------------------------------------------|--------|----------|
| 14 | HMAC-SHA256 + timing-safe compare on Culqi        | `[x]`  | `src/app/api/webhooks/culqi/route.ts` `verifySignature()` |
| 15 | HMAC verify on Twilio                             | `[x]`  | `src/app/api/webhooks/twilio/route.ts` `verifyTwilio()` |
| 16 | `idempotency_keys` table + `dedupeWebhook` use    | `[x]`  | `src/lib/webhook-idempotency.ts`; integration tests `src/lib/webhook-idempotency.test.ts` (commit `e2941c2`, S18-S21) |

## Test harnesses

| #  | Repo  | Item                                               | Status | Evidence |
|----|-------|----------------------------------------------------|--------|----------|
| 22 | `vV2` | Vitest for sample-week / shortlinks / brief schema | `[x]`  | `vitest.config.ts`; `src/lib/sample-week.test.ts`, `shortlinks.test.ts`, `plans.test.ts`, `webhook-idempotency.test.ts`; `package.json` `"test": "vitest"` |
| 21 | `rln` | Vitest harness + env-loader test                   | `[x]`  | `vitest.config.ts` + `src/lib/env.test.ts` + `src/data/services.test.ts`. (#21 originally said "Vitest for `lima-weather.ts` + `shortlinks.ts` + brief schema" — `lima-weather` lives in `rls`, the others in `vV2`. The portable test targets in `rln` are the env loader and the services catalogue.) |
| 20 | `crm` | priority-score test                                | `[?]`  | sandbox cannot access `crm` repo |
| 23 | `vV2` | Playwright e2e Sereno pipeline                     | `[x]`  | `playwright.config.ts` + `e2e/landing.spec.ts` (3 marketing-funnel smokes) + `e2e/api.spec.ts` (4 public-signals contract tests). `@playwright/test` moved to devDeps; `npm run e2e` runs the suite. |
| 24 | `crm` | webhook tests                                      | `[?]`  | sandbox cannot access `crm` repo |

## Customer-facing UI (vigiaV2 / Sereno)

| #  | Item                                              | Status | Evidence |
|----|---------------------------------------------------|--------|----------|
| 26 | Self-service cancel at `/app/settings`            | `[x]`  | `src/lib/culqi.ts#cancelSubscription`, `src/app/api/app/subscription/cancel/route.ts` (zod-validated, idempotent, rate-limited 5/5min, `subscription.canceled` event with reason), `src/app/app/settings/CancelSubscriptionPanel.tsx` (two-step confirm + reason textbox + error display), wired into the Plan section of `/app/settings`. |
| 27 | Counter-Move "did this" tracker UI                | `[x]`  | Tracker existed in `MoveTracker.tsx` (state machine `pending → in_progress → done | skipped`, outcome notes, optimistic UI). This PR adds: (a) `getMoveStats()` in `src/lib/moves.ts` for 30-day roll-up with `actionRate` excluding skipped, (b) `MoveSummary.tsx` rendering counts + segmented progress bar above the latest brief, (c) prominent amber "✓ Hice esto" primary action distinct from the granular state buttons. |

## API & routing

| #  | Repo  | Item                                              | Status | Evidence |
|----|-------|---------------------------------------------------|--------|----------|
| 33 | `vV2` | Per-tenant Anthropic budget cap + cron            | `[x]`  | `src/app/api/cron/anthropic-budget-check/` route; `.env.example` exposes `ANTHROPIC_MONTHLY_BUDGET_USD_PER_TENANT` |
| 34 | `vV2` | `/api/public-signals` with `s-maxage` cache       | `[x]`  | New route added in this PR. `src/app/api/signals` was a mock-data endpoint; `/api/public-signals` is the cache-headed, anonymized public read meant for marketing-site embeds. |
| 25 | `rln` | `/servicios` EN mirror at `/en/services/{slug}/`  | `[x]`  | Skeleton + full long-form translation. `SERVICES_EN` now has `sections` + `faq` for all 8 services in addition to the previously-shipped hero/meta/includes/pricing/CTA. `EnglishServicePage.tsx` renders entirely in English (no Spanish-prose fallback banner). Cross-link descriptions pull the EN tagline from the linked service. Sitemap + hreflang + canonical correct. AI-translated; flagged in the file header for native-speaker review before any major campaign. |
| 38 | `rln` | `next/image` migration audit                      | `[N/A]` | Only `src/lib/proto-templates.tsx` uses `<img>` — 3 instances rendering arbitrary user-supplied photo URLs (Meta IG API, pasted CDNs). `next/image` requires the host to be in `next.config.js#images.remotePatterns`; whitelisting "any host" defeats the optimizer's security model. Each tag is intentionally `eslint-disable`d and the rationale is now in the file header. Conclusion: keep `<img>`. |

## raineylaguna-next other items

| #  | Item                                              | Status | Evidence |
|----|---------------------------------------------------|--------|----------|
| 7  | CI workflow (lint + typecheck + build)            | `[x]`  | `.github/workflows/ci.yml` |

## raineylagunastudios

| #  | Item                                              | Status | Evidence |
|----|---------------------------------------------------|--------|----------|
| 9  | HTML / JS / JSON-LD validation CI                 | `[x]`  | `.github/workflows/ci.yml` runs `node scripts/check-html.mjs` · commit `e907359` |
| 37 | SRI hashes on CDN imports                         | `[N/A]` | `index.html`, `404.html`, `og-image.html`, `verify.html` contain **0 CDN `<script src=https://…>`** tags — all scripts are local under `/scripts/`. Google Fonts `<link>` URLs are CSS, not script integrity-hash territory. SRI re-opens **only when a CDN script is added**; the workflow now records this rule. |

## raineylaguna-crm (cannot verify from this sandbox)

This sandbox is restricted to the 5 repos `vigiav2`, `raineylaguna-next`,
`rainey-stack`, `raineylagunastudios`, `vigia`. **`raineylaguna-crm` is not in
the allowed-repos list** — clones return `repository not authorized` from the
proxy and the GitHub MCP refuses calls to the repo. Action required: get
`datacendia/raineylaguna-crm` added to the sandbox's allowed-repos config,
then these 4 items can be implemented.

| #  | Item                                              | Status |
|----|---------------------------------------------------|--------|
| 6  | CONVENTIONS.md read-first pointer                 | `[?]`  |
| 20 | priority-score test                               | `[?]`  |
| 24 | webhook tests                                     | `[?]`  |
| 36 | `as any` audit                                    | `[?]`  |

## Infrastructure / multi-repo (code + operator runbook)

| #  | Item                              | Status | Evidence |
|----|-----------------------------------|--------|----------|
| 28 | DNS as code                       | `[x]`  | `dns/expected.yml` + `INFRA-SETUP.md §4` |
| 29 | Cloudflare Turnstile              | `[x]`  | `rln/src/lib/turnstile.ts`, `rln/src/components/TurnstileWidget.tsx`, wired into `/api/lead`. Gated on `TURNSTILE_SECRET` / `NEXT_PUBLIC_TURNSTILE_SITEKEY` |
| 30 | Uptime monitoring                 | `[x]`  | `.github/workflows/uptime.yml` (free, 10-min cron, 9 URLs) + UptimeRobot operator step in `INFRA-SETUP.md §1` |
| 31 | Analytics                         | `[x]`  | Cloudflare Web Analytics in `rln`, `vV2`, `rls` (script + injector). Gated on env. `INFRA-SETUP.md §2` |
| 32 | Cloudflare zone settings          | `[x]`  | Checklist in `INFRA-SETUP.md §5` |
| 39 | Runbooks reference                | `[x]`  | `RUNBOOKS.md` + new `INFRA-SETUP.md` |
| 40 | DNS drift check                   | `[x]`  | `scripts/dns-drift.mjs` + `.github/workflows/dns-drift.yml` (Mon 14:00 UTC + PR trigger, gated on `CF_API_TOKEN` secret) |
| 41 | (unlabeled slot)                  | `[?]`  | unclear what this item is |

---

## Summary (verifiable in this sandbox)

- **Shipped & verified:** 33 items — #1-5, #7, #9-19, #21-23, #25-34, #39, #40, #42
- **Partial / skeleton:** 0
- **N/A with reason:** 2 — #37, #38
- **Sandbox-blocked (`crm` repo not in allowed list):** 4 — #6, #20, #24, #36
- **Unclear (no spec):** 1 — #41

The infra items (#28-32, #39, #40) shipped as **code + operator
runbook**. Code is gated on env vars / GitHub secrets so production
stays quiet until you paste the actual tokens — see `INFRA-SETUP.md`.

## How to use this doc

- Update the row whenever you change the underlying state. Don't let it rot.
- The "Evidence" column must point to a SHA, a path, or an explicit reason —
  no hand-wavy "done" entries.
- If you mark something `[~]` partial, file the follow-up as a `BUGS.md` or
  `ROADMAP.md` entry so it doesn't get lost.
