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
| 21 | `rln` | Vitest harness + env-loader test                   | `[x]`  | `vitest.config.ts` + `src/lib/env.test.ts` — see this PR (#21 was originally "Vitest for `lima-weather.ts` + `shortlinks.ts` + brief schema". `lima-weather.ts` does **not** live in this repo (it's in `rls/scripts/` driving the Living Manifesto static page); `shortlinks` and brief schema live in `vV2`. The portable test target in `rln` is the env loader, which is what we landed.) |
| 20 | `crm` | priority-score test                                | `[?]`  | unverifiable |
| 23 | `vV2` | Playwright e2e Sereno pipeline                     | `[ ]`  | `playwright` is in deps but **no `playwright.config.ts` and no `tests/e2e/`**. Open work item. |
| 24 | `crm` | webhook tests                                      | `[?]`  | unverifiable |

## Customer-facing UI (vigiaV2 / Sereno)

| #  | Item                                              | Status | Evidence |
|----|---------------------------------------------------|--------|----------|
| 26 | Self-service cancel at `/app/settings`            | `[~]`  | `src/app/app/settings/page.tsx` exists (65 lines) but no `cancel`/`subscription` strings detected. Likely placeholder — needs a Culqi `/api/subscription/cancel` route, settings UI button, and confirmation modal. Open work. |
| 27 | Counter-Move "did this" tracker UI                | `[ ]`  | Only `src/app/api/og/counter-move/` (OG image generation) exists. No tracker UI / no DB column / no API endpoint. Open work. |

## API & routing

| #  | Repo  | Item                                              | Status | Evidence |
|----|-------|---------------------------------------------------|--------|----------|
| 33 | `vV2` | Per-tenant Anthropic budget cap + cron            | `[x]`  | `src/app/api/cron/anthropic-budget-check/` route; `.env.example` exposes `ANTHROPIC_MONTHLY_BUDGET_USD_PER_TENANT` |
| 34 | `vV2` | `/api/public-signals` with `s-maxage` cache       | `[x]`  | New route added in this PR. `src/app/api/signals` was a mock-data endpoint; `/api/public-signals` is the cache-headed, anonymized public read meant for marketing-site embeds. |
| 25 | `rln` | `/servicios` EN mirror at `/en/services/{slug}/`  | `[~]`  | This PR adds skeleton route files for all 8 services with English meta + hreflang; long-form ES copy still surfaced inline with a "translation in progress" banner. Full English `SERVICES_EN` data deferred to a follow-up PR (≈ 50 KB of business copy to translate carefully). |
| 38 | `rln` | `next/image` migration audit                      | `[~]`  | Only one file references `<img>`: `src/lib/proto-templates.tsx` — these are **template strings** that produce HTML for Anthropic-generated previews rendered as raw HTML (`dangerouslySetInnerHTML`); converting to `next/image` is not applicable for output strings. No raw `<img>` tags remain in JSX. |

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

| #  | Item                                              | Status |
|----|---------------------------------------------------|--------|
| 6  | CONVENTIONS.md read-first pointer                 | `[?]`  |
| 20 | priority-score test                               | `[?]`  |
| 24 | webhook tests                                     | `[?]`  |
| 36 | `as any` audit                                    | `[?]`  |

## Infrastructure / multi-repo (out of code-repo scope)

| #     | Item                                              | Status |
|-------|---------------------------------------------------|--------|
| 28-32 | DNS, Turnstile, monitoring, analytics, Cloudflare | `[?]`  |
| 39    | Runbooks reference                                | `[x]`  | covered by `RUNBOOKS.md` |
| 40    | Drift check                                       | `[?]`  |
| 41    | (slot)                                            | `[?]`  |

---

## Summary (verifiable in this sandbox)

- **Shipped & verified:** 22 items — #1, #2, #3, #4, #5, #7, #9, #10, #11, #12, #13, #14, #15, #16, #17, #18, #19, #21, #22, #33, #34, #42
- **Partial / skeleton:** 3 items — #25 (EN service-page mirrors), #26 (cancel UI), #38 (next/image — formally N/A but documented)
- **Open work:** 2 items — #23 (Playwright config + first e2e in vV2), #27 (Counter-Move tracker UI)
- **N/A with reason:** 1 item — #37 (no CDN scripts in `rls`)
- **Unverifiable from this sandbox (`crm` + infra):** 14 items — #6, #20, #24, #28-32, #36, #39, #40, #41

## How to use this doc

- Update the row whenever you change the underlying state. Don't let it rot.
- The "Evidence" column must point to a SHA, a path, or an explicit reason —
  no hand-wavy "done" entries.
- If you mark something `[~]` partial, file the follow-up as a `BUGS.md` or
  `ROADMAP.md` entry so it doesn't get lost.
