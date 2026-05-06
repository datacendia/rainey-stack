# Vigía → Sereno rename plan

**Status:** not started
**Owner:** TBD
**Estimated effort:** ~2 hours of mechanical edits + 1 hour smoke testing
**Touch points:** ~237 occurrences across ~63 files in 2 repos (`vigiaV2`, `raineylaguna-next`)

> **Do not start this until** (a) `serenowatch.com` is registered, and (b) you
> are within ~1 week of opening checkout to a real customer, OR you are about
> to create Culqi live-mode plans / Nubefact comprobantes that bake the brand
> name into legal artefacts.

---

## Step 0 — Prerequisites (do *before* any code change)

- [ ] `serenowatch.com` registered at Cloudflare Registrar
- [ ] `@serenowatch` claimed on:
  - [ ] X / Twitter
  - [ ] Instagram (priority — primary marketing channel for Lima SMBs)
  - [ ] GitHub org or repo namespace under `datacendia`
  - [ ] LinkedIn company page
- [ ] Cloudflare DNS zone added for `serenowatch.com` with empty record set
- [ ] Decide: keep `vigiaV2` repo name on GitHub, or rename to `serenowatch`?
  - **Recommended**: rename the GitHub repo. Old URL auto-redirects. One-time DNS-style chore.

---

## Step 1 — Branch + grep baseline

```bash
cd vigiaV2
git checkout -b rename/sereno
git grep -i 'vigia' > /tmp/vigia-baseline.txt   # ~150 lines expected
```

Repeat for `raineylaguna-next` (~85 lines expected).

Keep the baselines around — they're your "before" diff for review.

---

## Step 2 — Categorise the matches

Not every `vigia` becomes `sereno`. There are four classes:

### Class A — Brand strings (rename)
User-visible product name. Replace `Vigía` → `Sereno` with case preservation:

- `Vigía` → `Sereno`
- `vigía` → `sereno` (rare, accented lowercase)
- `vigia` → `sereno` (in URLs, slugs, ids)
- `VIGIA` → `SERENO` (in env-var names, see Class C)

Files most affected:
- `src/app/page.tsx`, `src/app/layout.tsx`, marketing components
- `src/components/email/BriefEmailTemplate.tsx`
- `BUSINESS_MODEL.md`, `BIBLE.md`, `GO_TO_MARKET.md`, `ROADMAP.md`, `SAMPLE_BOLETIN.md`
- `README.md`, `CULQI_SETUP.md`, `RAILWAY_DEPLOY.md`
- `raineylaguna-next/src/components/VigiaBrief.tsx` (also rename file → `SerenoBrief.tsx`)
- `raineylaguna-next/src/data/services.ts` (33 hits — service catalogue copy)

### Class B — Domain / URL strings (rename)
- `vigia.pe` → `serenowatch.com`
- `vigia.raineylaguna.com` → either keep (subdomain still valid as a redirect) or `app.serenowatch.com` for production
- `hola@vigia.pe` → `hola@serenowatch.com`
- `https://vigia.pe/api/webhooks/twilio` → `https://serenowatch.com/api/webhooks/twilio`

### Class C — Env-var names (rename, breaking change)
- `NEXT_PUBLIC_VIGIA_WHATSAPP` → `NEXT_PUBLIC_SERENO_WHATSAPP`
- `NEXT_PUBLIC_VIGIA_API` (in `raineylaguna-next`) → `NEXT_PUBLIC_SERENO_API`

These are breaking. Coordinate with the Railway env-var update (Step 5).

### Class D — File / route paths (rename, breaking change)
- `raineylaguna-next/src/app/servicios/vigia/page.tsx` → `…/sereno/page.tsx`
  - Update internal links and `sitemap.xml`
  - Add a `vigia → sereno` redirect in `next.config.js`
- `vigiaV2/src/components/email/BriefEmailTemplate.tsx` — content only
- `raineylaguna-next/src/components/VigiaBrief.tsx` → `SerenoBrief.tsx`

### Class E — Do **not** touch
- `package-lock.json` — let `npm install` regenerate after `package.json` is updated
- `CONCEPTS.md` — historical document; the "Vigía was once a candidate alongside Scoutly" framing is correct as history
- `vigiaV2/CONCEPTS.md` Scoutly references — already documented as historical in the README
- The **codebase identifier** `vigia` in scripts/log lines that are operator-internal (e.g. `vigia-cron`, `vigia-worker` Railway service names) — these are infrastructure labels, not user-facing. **Decision: rename them in a follow-up to keep the diff small.**

---

## Step 3 — Mechanical replacement

Run case-sensitive replacements in this order (order matters: longer strings first):

```bash
# Class A — brand
git ls-files | xargs sed -i 's/Vigía/Sereno/g'
git ls-files | xargs sed -i 's/VIGIA/SERENO/g'      # only in env-var-y contexts; review diff
git ls-files | xargs sed -i 's/Vigia/Sereno/g'
git ls-files | xargs sed -i 's/vigía/sereno/g'
git ls-files | xargs sed -i 's/vigia/sereno/g'

# Class B — domains
git ls-files | xargs sed -i 's/vigia\.pe/serenowatch.com/g'
git ls-files | xargs sed -i 's/hola@serenowatch\.com/hola@serenowatch.com/g'   # idempotent re-write

# Class C/D handled by the broad replace above; verify with:
git diff --stat
git diff -- '*.env.example' '*.toml' '*.json'
```

**Review every chunk before commit.** Especially:
- `package.json` — `"name": "vigia"` becomes `"name": "sereno"` ✅
- `scripts/socio/types.ts` — "socio" is a separate concept (the "partner" persona), don't accidentally rename
- `scripts/collectors/meta-ads.ts` — META Ads SDK, not Vigía
- Any string inside `BIBLE.md` / `BUSINESS_MODEL.md` quoting Spanish copy where `vigía` is being used as a *common noun* (rare but possible) — keep the lowercase common-noun usage if so

---

## Step 4 — Update file & route names

```bash
# vigiaV2 — repo name only changes on GitHub, not on disk
# (Rename in GitHub UI: vigiaV2 → serenowatch; clone URL auto-redirects)

# raineylaguna-next
git mv src/app/servicios/vigia src/app/servicios/sereno
git mv src/components/VigiaBrief.tsx src/components/SerenoBrief.tsx
# update imports of VigiaBrief → SerenoBrief
```

Add to `raineylaguna-next/next.config.js`:

```js
async redirects() {
  return [
    { source: '/servicios/vigia', destination: '/servicios/sereno', permanent: true },
    { source: '/en/services/vigia', destination: '/en/services/sereno', permanent: true },
  ]
}
```

---

## Step 5 — Infrastructure cutover

Done in the Railway dashboard (no code change), in this order:

1. Add `app.serenowatch.com` (or chosen subdomain) as an additional custom
   domain to the Vigía web service. Keep `vigia.raineylaguna.com` live.
2. Rename Railway env vars on **all** Vigía services (web, worker, cron):
   - `NEXT_PUBLIC_VIGIA_WHATSAPP` → `NEXT_PUBLIC_SERENO_WHATSAPP`
   - any others discovered in Step 2 Class C
3. Deploy the rename branch. Both domains now serve the renamed app.
4. Update Culqi webhook URL to `https://app.serenowatch.com/api/webhooks/culqi`.
5. Update Twilio webhook URL similarly.
6. Update Resend `RESEND_FROM` → `Sereno <hola@serenowatch.com>` (after MX/SPF are configured for the new domain).
7. After 7 days of green metrics on the new domain, set up a 308 redirect
   from `vigia.raineylaguna.com` → `app.serenowatch.com` and remove the old
   custom domain from Railway.

---

## Step 6 — Brand artefacts

- [ ] OG images: regenerate with the new wordmark (`vigiaV2/scripts/render-og.mjs` analogue if it exists, or by hand)
- [ ] Favicon / apple-touch-icon
- [ ] `site.webmanifest` `name` and `short_name`
- [ ] `llms.txt` (in `raineylaguna-next/public/` and `raineylagunastudios/`)
- [ ] WhatsApp Content Template approved with Twilio under the new sender display name
- [ ] Culqi merchant display name (live mode)
- [ ] Nubefact issuer metadata if `razón social` changes
- [ ] Re-render `SAMPLE_BOLETIN.md` if it embeds the brand

---

## Step 7 — Verification checklist

After deploy, confirm:

- [ ] `https://app.serenowatch.com/` loads with new branding
- [ ] `https://vigia.raineylaguna.com/` either redirects (post-cutover) or also loads the renamed app (during transition)
- [ ] `GET /api/health` returns 200 on both
- [ ] `GET /api/brief` from `raineylaguna.com` still passes CORS
- [ ] Submit a test Culqi checkout → comprobante issued under correct issuer name
- [ ] Send a test brief via Twilio → arrives with new sender name
- [ ] `raineylaguna.com/servicios/sereno` loads; `/servicios/vigia` 308s to it
- [ ] PostHog / Sentry projects renamed (cosmetic, optional)

---

## Step 8 — Update this stack repo

After the rename ships:

- [ ] Update `BRAND.md` — strike "rename pending"
- [ ] Update `DEPLOY.md` — replace all `vigia.raineylaguna.com` with `app.serenowatch.com`
- [ ] Update `README.md` here — change `vigiaV2` to `serenowatch` if the repo was renamed on GitHub
- [ ] Tag the commit: `git tag rename-complete-YYYYMMDD`
