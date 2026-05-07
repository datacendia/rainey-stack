# RUNBOOKS.md — Operator Playbooks per Failure Mode

One entry per known failure mode across the four-repo stack. Each entry
is the answer to **"the operator just got paged at 03:00 — what do they
do in the next 10 minutes?"**

> **Format.** Symptom → Diagnosis (how to confirm it's *this* failure)
> → Remediation (the exact commands / dashboard clicks) → Prevention
> (what to do later so it doesn't happen again). Keep each entry under
> a screen of text. If diagnosis takes > 5 commands, split it into a
> sub-runbook.

> **Process.** When a new failure mode is genuinely surprising, add an
> entry. When an existing entry's remediation no longer works, update
> it (and prepend the date so the audit trail survives). When a failure
> can be prevented entirely by code (e.g. webhook idempotency), move
> the entry to a `🗑 retired` section and link the PR that fixed it.

## Index

| ID  | Title | Surface |
|-----|-------|---------|
| RB01 | Customer reports "no Monday brief arrived" | Sereno |
| RB02 | Webhook signature failures spike | Sereno |
| RB03 | Cron pipeline deadlocked (`pipeline_locks`) | Sereno |
| RB04 | Postgres connection storm / pool exhausted | Both Next.js apps |
| RB05 | Anthropic budget exceeded / rate-limited | Sereno + raineylaguna-next |
| RB06 | Twilio sending paused / templates rejected | Sereno |
| RB07 | Culqi webhook delivery permanently failing | Sereno |
| RB08 | Comprobante issuance (Nubefact) failing | Sereno |
| RB09 | Admin login locked out / forgotten password | Sereno admin |
| RB10 | Domain DNS propagation delay | Cloudflare |
| RB11 | Railway deploy failed (build vs runtime) | All Next.js apps |
| RB12 | Sentry signal noisy / false positives | Both Next.js apps |
| RB13 | Lead capture broken (raineylaguna.com → CRM) | Marketing + CRM |
| RB14 | Sample-week trigger fired but no brief delivered | Sereno |
| RB15 | Boletín markdown rendering breaks WhatsApp client | Sereno |
| RB16 | `vigia` accidental push to archived repo | Git hygiene |

---

## RB01 · Customer reports "no Monday brief arrived"

**Symptom.** Customer DMs the operator on Monday afternoon: "I haven't
received my brief." This is the highest-impact failure mode — Monday
delivery is the product.

**Diagnosis.**

```sql
-- Was the brief generated?
SELECT id, status, generated_at, sent_at, send_attempts, twilio_sid
FROM briefs
WHERE customer_slug = '<slug>'
ORDER BY generated_at DESC
LIMIT 3;
```

Three states:
1. No row → generator never ran. Go to **RB03** (pipeline lock) or
   **RB05** (Anthropic budget).
2. Row with `status='draft'` → never approved. The operator missed
   the review queue at `/admin/briefs?status=draft`.
3. Row with `status='approved'` but `sent_at IS NULL` → Twilio send
   failed. Check `pipeline_runs` for the kind='send' run, then
   look up the Twilio Console for the failure reason.
4. Row with `sent_at IS NOT NULL` → it was sent. Check
   `webhook_events WHERE provider='twilio' AND event_id LIKE '<sid>:%'`
   to see what status Twilio reported. The customer may have it in
   their other-WhatsApp / archived chats.

**Remediation.**

- **Case 2 (draft):** approve and send.
  ```bash
  npm run weekly -- --customer <slug> --send-only
  ```
- **Case 3 (send failed):** retry once.
  ```bash
  npm run send -- --brief-id <id>
  ```
  If it fails again, check Twilio Console → Programmable Messaging →
  Logs for the specific MessageSid. Common causes: customer's WhatsApp
  number changed, opted out, or the 24h window expired and the
  template SID is wrong.
- **Case 4 (delivered, customer didn't see):** screenshot the WhatsApp
  delivery log (Twilio shows "delivered" / "read") and DM the customer
  proof. Then check that the WhatsApp number on file is current.

**Prevention.**

- Synthetic monitor on `/api/health` plus a Monday-noon synthetic that
  asserts at least one `brief.sent` event in the last 6h
  (todo `synthetic-monitor`).
- The CRM Monday digest should surface "customers with no brief sent
  this week" so the operator catches misses before the customer does.

---

## RB02 · Webhook signature failures spike

**Symptom.** Sentry alert: many 401 responses from `/api/webhooks/*`,
or a customer reports a charge that didn't reflect in Sereno.

**Diagnosis.**

```sql
SELECT provider, COUNT(*) AS bad_sigs
FROM events
WHERE type = 'webhook.signature.invalid'
  AND ts > NOW() - INTERVAL '1 hour'
GROUP BY provider;
```

(Requires the events instrumentation to log a `webhook.signature.invalid`
type — track `events.ts` audit.)

If a single provider:
- **Culqi.** Check whether `CULQI_WEBHOOK_SECRET` was rotated in the
  Culqi dashboard but not in Railway env. The `crypto.timingSafeEqual`
  comparison is between secrets; a missing secret returns
  `401 Firma inválida`.
- **Twilio.** The signature is computed over the URL Twilio called
  *plus* the form body. If a CDN or proxy rewrote the path,
  `TWILIO_WEBHOOK_PUBLIC_URL` overrides the URL used for verification.
- **Stripe.** `STRIPE_WEBHOOK_SECRET` mismatch, or the request body
  was modified (e.g. by a JSON-pretty-print middleware).

**Remediation.**

- Pull the latest secret from the provider's dashboard.
- Update Railway → Variables → restart.
- Check that **only one** webhook endpoint is configured upstream;
  duplicate endpoints with stale secrets are a common cause.

**Prevention.**

- Document secret rotation procedure with a calendar reminder
  (todo `secret-rotation`).
- Synthetic test that POSTs a known-signed body monthly to verify
  the verifier still works (deferred).

---

## RB03 · Cron pipeline deadlocked (`pipeline_locks`)

**Symptom.** Monday brief generation didn't run. `/admin/runs` shows
the most recent kind='weekly' run as `status='running'` for hours.

**Diagnosis.**

```sql
SELECT name, run_id, acquired_at, expires_at, NOW() - acquired_at AS held_for
FROM pipeline_locks
WHERE name = 'weekly';
```

If `expires_at < NOW()` the lock should have been auto-released; if
`held_for > 30 minutes` the previous run died without releasing.

**Remediation.**

```sql
DELETE FROM pipeline_locks WHERE name = 'weekly' AND expires_at < NOW();

UPDATE pipeline_runs
SET status = 'failed', finished_at = NOW(), details = jsonb_set(COALESCE(details,'{}'::jsonb), '{cause}', '"orphaned"')
WHERE kind = 'weekly' AND status = 'running' AND started_at < NOW() - INTERVAL '1 hour';
```

Then re-run:
```bash
npm run weekly
```

**Prevention.**

- Lock TTL should be aggressive (e.g. 10 min) so an orphaned lock
  expires before the next scheduled run.
- The cron service should `SELECT pg_advisory_lock` *and* the table
  lock as belt-and-braces — if one is dropped, the other catches it.

---

## RB04 · Postgres connection storm / pool exhausted

**Symptom.** 500s spike across both Next.js apps. Sentry: "remaining
connection slots are reserved" or "too many clients".

**Diagnosis.**

```sql
SELECT state, COUNT(*) FROM pg_stat_activity GROUP BY state;
SELECT pid, state, query_start, NOW() - query_start AS age, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start
LIMIT 20;
```

Common causes:
- A long-running query holds connections; a new request burst fans out.
- A leaked connection from a server-action that errored before
  `client.release()`.
- The pool's `max` setting is too high relative to the Postgres
  service's `max_connections`.

**Remediation.**

- Kill the slowest non-idle queries:
  ```sql
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE state != 'idle' AND query_start < NOW() - INTERVAL '5 minutes';
  ```
- If the pool size is wrong, edit `src/lib/db.ts` (`max: 5` is
  current Sereno default) and redeploy.
- Bounce the Railway service: `railway service restart`.

**Prevention.**

- Audit every direct `pool.query` call site for missing `try/finally`
  / `client.release` (only relevant when using `pool.connect`).
- Set `statement_timeout` at the Postgres role level so long-running
  queries auto-cancel.

---

## RB05 · Anthropic budget exceeded / rate-limited

**Symptom.** `/api/proto/generate` (raineylaguna-next) and the boletín
generator return 429 / 402, or Sentry surfaces a "credit_balance" error.

**Diagnosis.**

```bash
# Anthropic Console: https://console.anthropic.com/settings/billing
# Check balance + per-day usage.
```

For Sereno specifically:
```sql
SELECT
  DATE_TRUNC('day', generated_at) AS day,
  SUM(ai_input_tokens + ai_output_tokens) AS tokens,
  SUM(ai_cost_usd) AS cost
FROM briefs
WHERE generated_at > NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;
```

**Remediation.**

- **Out of credit.** Top up via Anthropic Console.
- **Rate-limited.** Spread the boletín generation across hours (it
  currently runs sequentially over customers; if rate limit is the
  cap, add `await sleep(1000)` between customers).
- **Budget cap implementation pending.** When in place
  (todo `anthropic-budget-cap`), the cap halts new generation and
  pages the operator with the remaining budget.

**Prevention.**

- Per-tenant cap (`anthropic-budget-cap` todo) hard-caps any single
  customer's per-month spend.
- Daily Sentry digest of yesterday's Anthropic spend.
- For raineylaguna-next: `PROTO_STUB_MODE=1` returns deterministic
  output without burning tokens — useful for QA.

---

## RB06 · Twilio sending paused / templates rejected

**Symptom.** All Sereno briefs fail to send. `/api/webhooks/twilio`
emits `brief.send_failed` with `error_code` ~ 63016 / 21610 / 21408.

**Diagnosis.**

- Twilio Console → Programmable Messaging → Logs → filter by error
  code.
- Common codes:
  - **63016** — outbound message to a number that hasn't messaged us
    in the 24h window AND no approved Content Template was used.
    `TWILIO_TEMPLATE_SID` env var is wrong or unset.
  - **21610** — recipient is on a stop list (replied STOP).
  - **21408** — destination region not enabled on the Twilio account.
  - **63007** — the template SID was approved but its body has been
    edited and now exceeds the approved variant.

**Remediation.**

- **63016:** verify `TWILIO_TEMPLATE_SID` matches the latest approved
  template. Re-submit a new template if the body has drifted.
- **21610:** customer must DM "START" to the WhatsApp number; nothing
  the operator can do server-side.
- **21408:** enable the region in Twilio Console → Geo Permissions.
- **63007:** revert the template body to the approved variant or
  re-submit for approval (3–5 days).

**Prevention.**

- Pin template body content to the SID in a comment in
  `scripts/whatsapp/send.ts`.
- Pre-flight check on cron start: GET the template SID via Twilio API
  and assert `status === 'approved'`.

---

## RB07 · Culqi webhook delivery permanently failing

**Symptom.** Culqi dashboard shows webhook deliveries failing
repeatedly, or `webhook_events` table shows no `provider='culqi'` rows
in the last 24h despite known charges.

**Diagnosis.**

- Culqi Dashboard → Webhooks → check the "Failures" tab for
  HTTP-level errors.
- Test with a manual POST:
  ```bash
  curl -X POST https://sereno.serenowatch.com/api/webhooks/culqi \
    -H 'Content-Type: application/json' \
    -H 'x-culqi-signature: <real-sig>' \
    -d '<real-payload>'
  ```

**Remediation.**

- If the deploy is up but signature verification fails: rotated secret
  not propagated. See **RB02**.
- If the deploy is down: Railway service crashed. Check Sentry; bounce
  the service.
- If Culqi itself can't reach us (timeout): Cloudflare may be on a
  challenge for the IP range. Add Culqi's webhook IP range to the
  bypass rules.
- Manually replay missed deliveries from the Culqi dashboard once the
  endpoint is healthy. The `webhook_events` unique index makes this
  safe — a re-delivery of the same `event_id` is a no-op.

**Prevention.**

- Synthetic monitor that POSTs a known-good signed payload and asserts
  a `webhook_events` row appears within 30s.

---

## RB08 · Comprobante issuance (Nubefact) failing

**Symptom.** `subscription.charge.success` webhook fired but no
boleta/factura was issued. `subscriptions.comprobantes` JSONB is empty
for the latest charge.

**Diagnosis.**

```sql
SELECT id, last_charged_at, comprobantes FROM subscriptions
WHERE culqi_subscription_id = '<sub_id>';
```

```sql
-- Server logs lookup
SELECT ts, payload
FROM events
WHERE type IN ('comprobante.issued', 'comprobante.failed')
  AND payload->>'sub_id' = '<sub_id>'
ORDER BY ts DESC LIMIT 5;
```

Common causes:
- `NUBEFACT_TOKEN` invalid or expired.
- Customer's RUC fails SUNAT validation (wrong digit, suspended RUC).
- Nubefact API outage.

**Remediation.**

- Re-issue manually with `npm run boletin:reissue -- --sub-id <id>`
  (or the equivalent script) after fixing the underlying cause.
- For invalid RUC: contact the customer for the correct RUC and
  re-issue with the corrected `subscriptions.customer.ruc`.
- For Nubefact outage: wait + retry. SUNAT compliance allows up to
  72h to issue, so we have a window.

**Prevention.**

- RUC validation client-side at signup (regex per D18 schema:
  `/^(10|15|16|17|20)\d{9}$/`).
- Daily alert: comprobantes issued today vs charges recorded today.
  Drift > 24h pages the operator.

---

## RB09 · Admin login locked out / forgotten password

**Symptom.** Operator can't log in to `/admin`. Either the password is
wrong or the rate-limiter is in a backoff window.

**Diagnosis.**

```sql
SELECT email, last_login_at, disabled_at FROM admin_users
WHERE email = '<email>';
```

If `disabled_at IS NOT NULL`, the account is disabled — see who
disabled it (audit log) before re-enabling.

**Remediation.**

- **Reset password:**
  ```bash
  npm run admin:create -- <email> "<Name>" <new-password>
  ```
  (`admin-user-create.ts` upserts on email and re-hashes the password.)
- **Re-enable:**
  ```sql
  UPDATE admin_users SET disabled_at = NULL WHERE email = '<email>';
  ```
- **Rate-limiter cooldown:** wait 15 min, or restart the service to
  clear in-memory rate-limiter state.

**Prevention.**

- Always have ≥ 2 admin accounts so a lock-out of one doesn't lock
  the operator out entirely.
- Document the recovery procedure in onboarding docs for any new
  operator.

---

## RB10 · Domain DNS propagation delay

**Symptom.** A new subdomain (`crm.raineylaguna.com`,
`sereno.raineylaguna.com`, preview environments) returns NXDOMAIN or
the wrong IP after a Cloudflare DNS edit.

**Diagnosis.**

```bash
dig +short <hostname> @1.1.1.1
dig +short <hostname> @8.8.8.8
nslookup <hostname>
```

If Cloudflare returns the right answer but the local resolver doesn't,
it's a propagation issue. If Cloudflare returns the wrong answer, the
DNS record itself is wrong.

**Remediation.**

- Check the Cloudflare dashboard for the DNS record. Verify the
  record type (CNAME vs A), the value (Railway-assigned hostname),
  and **proxy status (orange cloud)**. Per CONVENTIONS §16, every
  public hostname is proxied.
- If the record is correct but propagation is slow: Cloudflare's
  authoritative answer is instant; the customer's recursive resolver
  is the bottleneck. Wait up to 1h.

**Prevention.**

- Document every hostname's record in `DEPLOY.md` with the canonical
  CNAME target.
- When adding a preview environment, use the wildcard
  `*.preview.raineylaguna.com` (todo `wildcard-preview-dns`) to skip
  per-PR DNS edits.

---

## RB11 · Railway deploy failed (build vs runtime)

**Symptom.** Railway dashboard shows the latest deploy as `Failed`.

**Diagnosis.**

- **Build failure:** Railway → Deployments → click the failed deploy →
  Build Logs. Common causes: typecheck error, lint error, missing
  env var declared as required, dependency that's broken on Linux.
- **Runtime failure:** the build succeeded but the container restarts
  in a loop. Deploy Logs → look for a stack trace from the env
  validator at boot (per D18). If the schema rejected, the message
  is clearly formatted.

**Remediation.**

- **Build:** the same failure is reproducible locally. Run
  `npm run typecheck && npm run lint && npm run build` and fix.
- **Runtime env failure:** open Railway → Variables → fix the bad
  env var (the Sentry / lib/env error message says exactly which
  one) → restart.
- **Runtime crash post-boot:** check Sentry; the exception is captured
  there.

**Prevention.**

- The CI workflows added in commits `88d82f1` / `60e5cbe` / `e907359`
  catch typecheck / lint / build failures *before* a Railway deploy
  is even attempted.
- Branch protection (todo `ci-branch-protection`) requires CI green
  before merge.

---

## RB12 · Sentry signal noisy / false positives

**Symptom.** Sentry is paging on errors that are expected (e.g. a 4xx
from a misbehaving client, or a Twilio webhook with a known-bad
signature being correctly rejected).

**Diagnosis.**

- Sentry → Alerts → check which rule fired. The rule should be on
  `error level >= warning AND environment == production`, not on
  every `info`-level breadcrumb.

**Remediation.**

- Add an `Sentry.ignoreErrors` entry for the noisy class (e.g.
  `/Firma inválida/` for Culqi 401s — they're correct, not bugs).
- Or: log them as `info` in our code instead of throwing an Error
  that Sentry captures.

**Prevention.**

- Triage Sentry issues weekly; tag known-good rejections so they
  don't accumulate.

---

## RB13 · Lead capture broken (raineylaguna.com → CRM)

**Symptom.** Customer fills the contact / audit form, sees the success
page, but the lead never lands in the CRM.

**Diagnosis.**

- raineylaguna-next: check `/api/lead` logs in Railway. If
  `CRM_PUBLIC_API` is unset, the route falls back to log-only stub
  mode. The lead is in the marketing-site logs, not in the CRM DB.
- CRM: check `/api/leads/public` logs. If signature verification
  fails, the request is rejected with 401. The shared secret
  (`CRM_LEAD_INTAKE_SECRET`) must match between marketing and CRM
  Railway envs.

**Remediation.**

- Verify both services have the *same* `CRM_LEAD_INTAKE_SECRET`.
  Rotate it together.
- Re-process logged leads from marketing logs:
  ```bash
  # On the CRM:
  npm run leads:replay -- --since=2026-05-01
  ```
  (or the equivalent script)

**Prevention.**

- Synthetic test that submits a fixture form daily and asserts the
  CRM has the row within 60s.
- Both services share the secret value via a single source (Railway
  env-share, manual sync, or a vault).

---

## RB14 · Sample-week trigger fired but no brief delivered

**Symptom.** New customer signed up Friday; expected a sample brief
on Monday. `subscriptions.created_at` is set, but no brief delivered.

**Diagnosis.**

```sql
SELECT s.id, s.customer->>'business_name' AS biz, s.created_at,
       b.id AS brief_id, b.status, b.payload->'meta'->'is_sample' AS is_sample
FROM subscriptions s
LEFT JOIN briefs b ON b.customer_slug = s.customer->>'slug'
WHERE s.id = '<sub_id>'
ORDER BY b.generated_at DESC NULLS LAST
LIMIT 5;
```

If no brief row at all: the placeholder seed never ran. Was
`/api/onboarding` called? Check the events log.

If a brief row exists with `is_sample = true` but `status='draft'`: the
operator missed approval.

**Remediation.**

- Run the seed manually:
  ```bash
  npm run weekly -- --customer <slug> --sample
  ```
- Or generate-and-send in one go if the operator is comfortable that
  the brief is good:
  ```bash
  npm run weekly -- --customer <slug> --sample --auto-approve
  ```

**Prevention.**

- The unit suite `S01` (nextMondayISO) locks in the date math.
- An e2e test (`S82` in TESTS.md) verifies the full sample-week flow
  from signup → approval → send.

---

## RB15 · Boletín markdown rendering breaks WhatsApp client

**Symptom.** Customer sees garbled brief: asterisks visible (`*bold*`),
emoji boxes, or markdown link syntax.

**Diagnosis.**

WhatsApp's markdown is a strict subset:
- `*bold*` → bold (single asterisk, no doubling).
- `_italic_` → italic.
- `~strike~` → strikethrough.
- ``` `code` ``` → monospace.
- Links: paste the URL directly; no `[label](url)`.

If the brief contains `**bold**` (Markdown standard) it renders
literally as `*bold*` in WhatsApp.

**Remediation.**

- Brief generator (`scripts/boletin/generate.ts`) post-processes:
  `**` → `*`, `[label](url)` → `label url`. Verify the post-processor
  ran. If not, regenerate.
- Long URLs: replace with a shortlink (`/j/<slug>`).

**Prevention.**

- Snapshot test on the post-processor (deferred; would land as
  S70-ish in TESTS.md).
- Pre-flight check: send the brief to the operator's own WhatsApp
  number first, eyeball it, then approve.

---

## RB16 · `vigia` accidental push to archived repo

**Symptom.** A new branch / commit landed on `datacendia/vigia`
(archived) instead of `datacendia/vigiaV2` (canonical). The local
`master` may be out of sync with the canonical remote.

**Diagnosis.**

```bash
git -C c:\Users\Stu\vigia remote -v
# origin → datacendia/vigia.git    (archived)
# v2     → datacendia/vigiaV2.git  (canonical)
git -C c:\Users\Stu\vigia branch -vv
# master should track v2/master
```

If a recent push went to `origin/master` instead of `v2/master`:

```bash
git -C c:\Users\Stu\vigia log --oneline origin/master ^v2/master
# Lists commits on origin/master not on v2/master
```

**Remediation.**

- If the commits are valuable, push them to v2:
  ```bash
  git -C c:\Users\Stu\vigia push v2 origin/master:master
  ```
- Then delete the branch on the archived repo:
  ```bash
  git -C c:\Users\Stu\vigia push origin --delete <branch>
  ```

**Prevention.**

- Set `master`'s upstream explicitly:
  ```bash
  git -C c:\Users\Stu\vigia branch --set-upstream-to=v2/master master
  ```
- Run the deferred chore (`vigia-remote-cleanup` todo): rename `v2`
  to `origin` and drop the archived remote entirely.

---

## Retired runbooks (kept for the audit trail)

*(none yet — when an entry's failure mode is fully prevented by code,
move it here with a link to the prevention PR)*
