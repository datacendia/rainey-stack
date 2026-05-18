# INFRA-SETUP.md — operator runbook for the free-tier infra layer

This is the step-by-step guide to wire up the infrastructure layer
that the codebase already supports. Everything below is **free** at the
volumes Rainey Laguna runs at; nothing here costs money unless you
deliberately upgrade.

The code-side of each item is already shipped and gated on environment
variables, so a half-finished setup never breaks production — it just
doesn't fire until you complete the operator step.

Tracks STATUS.md rows: #28 (DNS), #29 (Turnstile), #30 (Monitoring),
#31 (Analytics), #32 (Cloudflare config), #40 (Drift check).

---

## 0. Account hygiene first (do this before anything else)

If you haven't already, in this order:

1. **Pick a password manager** (1Password, Bitwarden, Apple Keychain, anything that isn't your head).
2. **Generate a unique strong password for Cloudflare.** Save it.
3. **Generate a unique strong password for Railway.** Save it. Different from the Cloudflare one.
4. **Enable 2FA on Cloudflare.** Profile → Authentication → 2FA. Use the password manager's TOTP if it has one, or Google Authenticator / Authy.
5. **Enable 2FA on Railway.** Account → Two-Factor Authentication.
6. **Audit Cloudflare API tokens.** Profile → API Tokens → make sure no unfamiliar tokens exist. Delete any you don't recognize.
7. **Audit Railway sessions / project tokens.** Account → Active sessions; project pages → settings → tokens.

Do not re-use passwords across these two services or any others.

---

## 1. Free monitoring — UptimeRobot (5 min)

The repo already has a free-tier GitHub Actions uptime check at
`.github/workflows/uptime.yml` that pings every public URL every 10
minutes. This is the backstop. UptimeRobot gives you nicer alerting
(email, SMS, push, Slack) and a public status page.

1. Sign up: https://uptimerobot.com/signUp — free tier, 50 monitors, 5-minute checks.
2. **Add monitors** for at least:
   - `https://raineylaguna.com/` (HTTPS keyword: any 200)
   - `https://raineylaguna.com/auditoria`
   - `https://raineylagunastudios.com/`
   - `https://sereno.com.pe/`
   - `https://sereno.com.pe/api/public-signals` (HTTP, expect 200, contains `signals`)
   - `https://crm.raineylaguna.com/`
3. **Alert contacts** → add your email + WhatsApp via the free tier limits. Optional: a Discord/Slack webhook.
4. **Public status page** (optional) — My Settings → Status Pages → New Status Page → "Rainey Laguna Stack". Make it public if you want a `status.raineylaguna.com` later.

The GitHub Actions check stays in place as a free secondary signal — if both UptimeRobot AND the GH workflow fire, it's a real outage.

---

## 2. Free analytics — Cloudflare Web Analytics (5 min)

Free, no cookies, no PII, GDPR-fine. Already wired into all 3 sites
gated on `NEXT_PUBLIC_CF_BEACON_TOKEN` (Next sites) or
`CF_BEACON_TOKEN` (the static studios site).

1. Cloudflare → **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Choose **"I don't have a Cloudflare proxied site"** (works even when DNS is on Cloudflare; the script-tag mode is universal).
3. Enter `raineylaguna.com`. Cloudflare returns a snippet of the form:
   ```html
   <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
     data-cf-beacon='{"token":"abc123…"}'></script>
   ```
4. **Copy the token** (`abc123…`, the inside of `data-cf-beacon`).
5. Repeat for `raineylagunastudios.com` and `sereno.com.pe` — each gets its own token.

Then wire the tokens:

### raineylaguna-next + vigiaV2 (Railway)

1. Railway → project → service → **Variables** → add:
   - `NEXT_PUBLIC_CF_BEACON_TOKEN=<token from step 4>`
2. Redeploy. The `<CloudflareAnalytics />` component renders automatically when the var is set.

### raineylagunastudios (static)

1. Run locally:
   ```bash
   cd raineylagunastudios
   CF_BEACON_TOKEN=<token> npm run analytics:inject
   ```
2. The script writes the snippet into every page (`scripts/inject-analytics.mjs`). Inspect the diff.
3. Commit + push. The static site host serves the updated HTML.
4. To remove later: `CF_BEACON_TOKEN= npm run analytics:inject` and commit again.

Verify: visit each site once in a private window, then check Cloudflare dashboard → Web Analytics → events should appear within a minute.

---

## 3. Free anti-bot — Cloudflare Turnstile (10 min)

Replaces hCaptcha/reCAPTCHA on public-facing forms. Already wired
into `/api/lead` (raineylaguna-next) and ready to extend.

1. Cloudflare → **Turnstile** → **Add a site**.
2. Domain: `raineylaguna.com`. (You can list multiple — `raineylagunastudios.com`, `sereno.com.pe` — under one widget if they share a form, or create separate widgets per domain.)
3. **Widget mode**: "Managed" (Cloudflare picks invisible vs. interactive challenge based on signal). For low-traffic forms, "Non-Interactive" is also fine.
4. Save. Cloudflare returns a **Site Key** (public, starts `0x4AAAAA...`) and a **Secret** (server-only, starts `0x4AAAAA...`).

Then wire them:

### raineylaguna-next (Railway)

1. Variables → add:
   - `NEXT_PUBLIC_TURNSTILE_SITEKEY=<site key>`
   - `TURNSTILE_SECRET=<secret>`
2. Redeploy.
3. The `<TurnstileWidget />` client component (under `src/components/TurnstileWidget.tsx`) is ready to drop into any form. The contact form / audit / lead intake should pass the resulting `token` into the POST body as `turnstileToken`. The server-side `/api/lead/route.ts` already calls `verifyTurnstile()` on it.

(If the secret is unset, `verifyTurnstile()` returns `{ ok: true, skipped: true }` — production deploys must set it.)

### Other sites

Turnstile widget can be embedded into any HTML form — the studio site doesn't currently have a form, so no action there.

---

## 4. DNS-as-code + drift check (#28 + #40)

Source of truth: `dns/expected.yml`. Drift check: `scripts/dns-drift.mjs`.
GitHub Actions: `.github/workflows/dns-drift.yml` runs every Monday.

### Initial population

1. Open `dns/expected.yml`. The skeleton is committed with `TODO-…` placeholders.
2. In Cloudflare → DNS for each zone, copy each record's actual value into the YAML:
   ```yaml
   - type: CNAME
     name: "@"
     value: <real Railway target>.up.railway.app
     proxied: true
   ```
3. Commit. Open a PR; the drift workflow runs against the PR's version of the YAML.

### Wire the API token

1. Cloudflare → Profile → **API Tokens** → **Create Token** → **Custom token**.
2. Name: `rainey-stack-dns-drift`.
3. Permissions:
   - Zone — **Zone** — **Read**
   - Zone — **DNS**  — **Read**
4. Zone Resources: `Include — Specific zone — raineylaguna.com` (add one row per zone you want monitored: `raineylagunastudios.com`, `sereno.com.pe`).
5. **TTL**: set an expiry — e.g. 1 year — so a leaked token isn't permanent.
6. Save. Cloudflare shows the token **once**; copy it now.
7. GitHub → repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - Name: `CF_API_TOKEN`
   - Value: paste the token.
8. The `dns-drift` workflow now runs every Monday at 14:00 UTC and fires on PRs touching `dns/expected.yml`.

### Local run

```bash
CF_API_TOKEN=<token> node scripts/dns-drift.mjs                  # all zones
CF_API_TOKEN=<token> node scripts/dns-drift.mjs raineylaguna.com  # one zone
```

The script never modifies Cloudflare. To apply a change: edit it in the
dashboard by hand, then update `dns/expected.yml` to match in the same PR.

---

## 5. Cloudflare zone settings checklist (#32)

For each zone, in Cloudflare dashboard:

- **SSL/TLS** → **Overview** → set to **"Full (strict)"** if Railway has a valid cert (it does), else "Full". Never "Flexible" — that lets the connection from CF to origin be plaintext.
- **SSL/TLS** → **Edge Certificates** → enable **Always Use HTTPS** + **HSTS** (Max-Age 6 months, Include Subdomains, Preload — only if you're sure).
- **SSL/TLS** → **Edge Certificates** → **Minimum TLS Version**: TLS 1.2.
- **Security** → **Settings** → **Security Level**: Medium (not High — High blocks too many real visitors, and Turnstile + the rate limits in `/api/lead` already cover spam).
- **Security** → **Bots** → enable **Bot Fight Mode** (free tier).
- **Speed** → **Optimization** → enable **Auto Minify** for CSS / JS / HTML, **Brotli**, **Early Hints**.
- **Caching** → **Configuration** → **Caching Level**: Standard. **Browser Cache TTL**: Respect Existing Headers.
- **Network** → **HTTP/3 (with QUIC)**: on. **0-RTT Connection Resumption**: on.
- **Notifications** → add an email/webhook on:
  - **Origin Error Rate Alert**
  - **Universal SSL Renewal Failure**
  - **DDoS Attack Alert (Network/L4)**

These are all free-tier toggles.

---

## 6. Verifying everything is live (5 min)

Once 1–5 are done, do a single end-to-end smoke:

1. Open each public URL in a private window. Confirm 200.
2. Cloudflare → Web Analytics → confirm pageviews appearing.
3. Submit the contact form (if Turnstile widget is rendered, the challenge should pop or stay invisible). CRM should receive the lead.
4. UptimeRobot → all monitors green.
5. GitHub → Actions → `uptime` workflow → latest run green.
6. GitHub → Actions → `dns-drift` workflow → either green ("All zones in sync") or `skip=true` (if you haven't set CF_API_TOKEN yet).

If any of these fail, see RUNBOOKS.md for triage.

---

## 7. What's still operator-only after this

The codebase covers everything except **the actions only you can take**:

- creating accounts (Cloudflare, Railway, UptimeRobot)
- generating tokens / sitekeys / secrets in those dashboards
- pasting them into Railway / GitHub repo secrets
- approving 2FA / accepting MFA prompts
- pointing your domain registrar's nameservers at Cloudflare (one-time, only if not already done)

I (Claude / agent) can write code and config; I cannot log into your
billing-attached accounts, and you should never want me to.
