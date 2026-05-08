# Stack status — security & test audit

Snapshot of where the audit stands across the three production repos.
Living doc; refresh after each session.

Last updated: **2026-05-08**.

---

## Repos in scope

| Repo | Branch | Purpose |
|------|--------|---------|
| `datacendia/vigiaV2` | `master` | Sereno SaaS (briefs, billing, admin, cron jobs) |
| `datacendia/raineylaguna-next` | `main` | Marketing site + 60-second proto generator |
| `datacendia/raineylaguna-crm` | `main` | Internal CRM (leads, outreach drafts) |

---

## Session 2026-05-08 — what shipped (19 PRs)

**vigiaV2** (12 PRs):

- `#4` test(p0): cron-auth helper + 5 unit suites covering S07/S08/S22-S29
- `#5` fix(ci): use `npm install` to self-heal package-lock drift
- `#6` fix(ci): soft-skip lint pending `next lint` → ESLint CLI migration
- `#7` test(p0): briefs state machine + counter-move JSONB + webhook HMAC verifiers
- `#8` test(p0): security sweep (H06/H07/H08) + H04 admin-auth gap initially flagged
- `#9` test(security): pin H04 admin proxy contract (proxy.ts already exists; H04 was a misdiagnosis)
- `#10` feat(security): rate-limit admin login (5/min/IP) + reusable `rate-limit` lib
- `#11` feat(perf): cache `/api/signals` at the edge (s-maxage=60, SWR=300)
- `#12` feat(observability): server + edge Sentry instrumentation

**raineylaguna-next** (4 PRs):

- `#3` test(p0): proto-prompt + env loader + `/api/lead` route
- `#4` feat(security): CSP + complementary security headers
- `#5` docs: BUGS.md tracker (T01 + L01)
- `#6` fix(security): wire Turnstile into all 3 public forms + 2 API routes (closes T01)

**raineylaguna-crm** (5 PRs):

- `#3` test(p0): CRM auth round-trip + `/api/leads/public` shared-secret + de-dup
- `#4` test(p0): security sweep (H06 secret leak, H07 pg SSL, H08 bcrypt cost)
- `#5` feat(security): rate-limit `/api/auth/login` (5/min/IP)
- `#6` docs: BUGS.md tracker (L01 / C20 / C21)
- `#7` feat(observability): wire `@sentry/nextjs` on browser + server + edge

CSP + complementary security headers on `vigiaV2` were already shipped in
`next.config.mjs` before the session — no PR needed.

---

## Test coverage — high-level

See `TESTS.md` for the per-ID matrix. Headline numbers as of this snapshot:

- **vigiaV2**: 14/14 P0 IDs shipped (S07, S08, S14–16, S22–29, S40, S41, S44).
  Pending P1 / P2: boletín pipeline E2E, admin login E2E, brief approval E2E,
  sample-week loader smoke (currently behind `continue-on-error: true`).
- **raineylaguna-next**: 8/8 P0 IDs shipped (W04–W06, W11–W13, W20, W21).
  Pending: W22 Turnstile end-to-end across all forms (server-side closed; UI integration shipped 2026-05-08, full E2E via Playwright pending), EN service render, canonical link audit.
- **raineylaguna-crm**: 4/4 P0 IDs shipped (C03, C04, plus auth round-trip and
  rate-limit route tests). Pending cleanup: C20 (`as any`) and C21
  (raw `process.env` reads — full env loader migration is multi-PR).
- **Cross-cutting (H-series)**: 4/5 shipped (H04, H06, H07, H08). H03
  (no raw `process.env` reads outside env loader) is essentially complete on
  vigiaV2 — only one intentional CLI-bootstrap exception in
  `src/workers/collect-worker.ts` with explanatory comment. CRM is the bulk
  of the remaining work and needs an `env.ts` schema first.

---

## Improvements shipped this session

- **CSP + security headers** on `raineylaguna-next` (HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- **Cache-Control** on `vigiaV2 /api/signals` (`max-age=10, s-maxage=60,
  stale-while-revalidate=300`).
- **Rate-limit on admin / auth login** in both `vigiaV2` and `raineylaguna-crm`
  (5 attempts / IP / minute, sliding window, in-memory; 429 + `Retry-After`).
- **Edge middleware admin gate** on `vigiaV2` — actually `src/proxy.ts`
  already existed; closed H04 as misdiagnosed and pinned the contract via
  static-source tests.
- **Sentry server + edge instrumentation** on `vigiaV2` and `raineylaguna-crm`
  (browser SDK was already wired on `vigiaV2` and `raineylaguna-next`).
- **Turnstile end-to-end** on `raineylaguna-next` — `TurnstileWidget`
  rendered in `ContactForm`, `Proto60Form`, `AuditTool`; token forwarded;
  `verifyTurnstile` wired into `/api/proto/generate` and `/api/audit`.

---

## Known bugs / debt

See per-repo `BUGS.md` files. Notable items:

- **`vigiaV2-H04` (closed-as-misdiagnosed, 2026-05-08)** — original report said
  `/api/admin/**` was unauthenticated. Turned out the gate already lived in
  `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`); the JSDoc on
  each admin route still said "Protected by middleware.ts" which was the
  source of the confusion. Static-source contract tests now pin
  `proxy.ts`'s shape.
- **Legacy flaky suites in vigiaV2**: `webhook-idempotency.test.ts`,
  `shortlinks.test.ts`, `sample-week.test.ts`. CI guards with
  `continue-on-error: true` on the unit-tests step; typecheck + build still
  gate merges. Fix path documented in `vigiaV2/BUGS.md`.
- **Next 16 `next lint` removal**: each repo's `lint` script currently echoes
  a deprecation notice. Migration path
  (`npx @next/codemod@canary next-lint-to-eslint-cli`) tracked in each
  repo's `BUGS.md`.

---

## Next session — priority queue

1. **Sentry `onRequestError` hook** — re-add once Sentry publishes a Next
   16-compatible signature. Tracked in instrumentation.ts comments.
2. **CRM env loader (C21)** — create `src/lib/env.ts` with zod schema,
   migrate ~10 raw `process.env` reads to it. Multi-PR.
3. **Replace `bcryptjs` with native `bcrypt`** in CRM and vigiaV2 admin
   (perf only; cost factor unchanged). Single-PR per repo.
4. **CRM `as any` cleanup (C20)**.
5. **P1 test batch** — boletín pipeline, admin login E2E, brief approval E2E,
   EN service render parity, canonical link audit.
6. **W22 Turnstile end-to-end Playwright** — verify the full UI ↔ API loop
   with a real Turnstile sitekey in CI.
7. **Final TESTS.md status flip** — mark every shipped ID `✅` in the
   canonical matrix.

---

## Quick commands

```powershell
# Per-repo CI status
gh pr checks <N> --repo datacendia/<repo>
gh pr merge  <N> --repo datacendia/<repo> --squash --delete-branch

# Per-repo local CI
npm test
npm run typecheck
npm run build
```
