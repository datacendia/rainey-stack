# Rainey Laguna stack — full deployment guide

This document describes how the four repos in this folder fit together at
runtime, how to deploy them on Railway, and how to wire DNS via Cloudflare.

```
_external/rainey-stack/
├── raineylagunastudios/   parent brand site            → raineylagunastudios.com
├── raineylaguna-next/     web-development vertical     → raineylaguna.com
├── raineylaguna-crm/      lead CRM (web + BullMQ)      → crm.raineylaguna.com
└── vigiaV2/               Vigía SaaS (web + worker + cron) → vigia.raineylaguna.com (subject to rename)
```

---

## 1. Domains

### Buy these two now (verified available May 2026 via Verisign WHOIS)

| Domain                       | Status        | Where to buy            |
| ---------------------------- | ------------- | ----------------------- |
| `raineylaguna.com`           | 🟢 available  | Cloudflare Registrar    |
| `raineylagunastudios.com`    | 🟢 available  | Cloudflare Registrar    |

Cloudflare Registrar charges at-cost (~$10/yr per `.com`) and forces WHOIS
privacy on by default. Buy both, leave them parked there.

### Vigía is being renamed to **Sereno**

Final domain: `serenowatch.com` 🟢 (verified available, register at Cloudflare).

The codebase still says `vigia` everywhere; the rename is tracked in
`BRAND.md` and `RENAME-PLAN.md`. **Do not start the code rename until
`serenowatch.com` is registered** — see `RENAME-PLAN.md` Step 0 for the
full prerequisites list.

During the transition, the Vigía services run at `vigia.raineylaguna.com`
and cut over to `app.serenowatch.com` once the rename ships. All
cross-origin references in `raineylaguna-next` continue to work because
both domains point at the same Railway service during cutover.

---

## 2. Runtime contracts between repos

```
raineylagunastudios.com  ───────►  (no runtime link, brand-only)
                                       │
                                       ▼
   ┌──── raineylaguna.com  (Next.js, R3F)
   │      │
   │      │  POST /api/leads/public  (HMAC-signed with CRM_LEAD_INTAKE_SECRET)
   │      ▼
   │   crm.raineylaguna.com  (Next.js + Postgres + BullMQ outreach worker)
   │
   │   GET /api/brief  (CORS allow-list: raineylaguna.com, www.raineylaguna.com)
   └─►  vigia.raineylaguna.com  (Next.js + Postgres + BullMQ collect-worker + weekly cron)
```

Key shared secrets / env vars:

| Variable                  | Owner    | Consumer            | Purpose                              |
| ------------------------- | -------- | ------------------- | ------------------------------------ |
| `CRM_LEAD_INTAKE_SECRET`  | CRM      | `raineylaguna-next` | Signed POST to `/api/leads/public`   |
| `NEXT_PUBLIC_VIGIA_API`   | —        | `raineylaguna-next` | Base URL of Vigía for live brief embed |
| `PUBLIC_BRIEF_ALLOWED_ORIGINS` | Vigía | —                  | CORS allow-list for `/api/brief`     |
| `AUDIT_ALLOWED_ORIGINS`   | Vigía    | —                   | CORS allow-list for `/api/audit*`    |

---

## 3. Railway project layout

One Railway project — **`rainey-laguna`** — containing eight services and
two managed databases:

| Service              | Repo                  | Builder    | Start command                                | Notes                                |
| -------------------- | --------------------- | ---------- | -------------------------------------------- | ------------------------------------ |
| `studios-web`        | `raineylagunastudios` | Static / Nixpacks | `npx serve -s . -p $PORT`             | Or keep on Vercel (`vercel.json` already wired) |
| `rl-web`             | `raineylaguna-next`   | Nixpacks   | `npm run start`                              | Healthcheck `/`                      |
| `rl-crm-web`         | `raineylaguna-crm`    | Nixpacks   | `npm start`                                  |                                      |
| `rl-crm-worker`      | `raineylaguna-crm`    | Nixpacks   | `npm run worker`                             | Same repo, different start command   |
| `vigia-web`          | `vigiaV2`             | Dockerfile | `npm start`                                  | Healthcheck `/api/health`. Rename to `sereno-web` after the rename. |
| `vigia-worker`       | `vigiaV2`             | Dockerfile | `npx tsx src/workers/collect-worker.ts`      | Rename to `sereno-worker` post-rename. |
| `vigia-cron`         | `vigiaV2`             | Dockerfile | `npm run weekly`                             | Cron `0 4 * * 0` (Sun 23:00 PE). Rename to `sereno-cron` post-rename. |
| `vigia-brief-cron`   | `vigiaV2`             | Dockerfile | `curl -s -X POST http://vigia-web.railway.internal/api/cron/send-briefs -H "Authorization: Bearer $CRON_SECRET"` | Cron `0 8 * * 1` (Mon 08:00 UTC) |

Plus two managed plugins shared across services:

| Plugin   | Used by                  | How to share                                            |
| -------- | ------------------------ | ------------------------------------------------------- |
| Postgres | CRM, Vigía               | One plugin, two logical databases (`crm`, `vigia`).     |
| Redis    | CRM, Vigía               | One plugin; CRM uses DB index 0, Vigía uses index 1 (or distinct key prefixes via BullMQ `prefix` option). |

Inject `DATABASE_URL` and `REDIS_URL` into each consumer service via Railway
**Variable References**, never paste connection strings.

### Cost estimate

| Component                      | ~Monthly |
| ------------------------------ | -------- |
| Postgres plugin                | $5       |
| Redis plugin                   | $5       |
| 7 Railway services @ low usage | $10–25   |
| **Total**                      | **$20–35** |

The first $5/mo is included on Railway's Trial/Hobby plan.

---

## 4. Step-by-step first deploy (~45 min)

1. **Cloudflare Registrar** — buy `raineylaguna.com` and
   `raineylagunastudios.com`. Add both as Cloudflare zones.

2. **Railway** — create one project named `rainey-laguna`.
   - **+ New → Database → PostgreSQL**
   - **+ New → Database → Redis**

3. **Connect the three Next.js repos.** For each:
   - **+ New → GitHub Repo** → pick the repo.
   - In **Variables**, add Variable References for `DATABASE_URL` and
     `REDIS_URL` where applicable.
   - Add the env vars listed in that repo's `.env.example`.

4. **Add the secondary services** (same repo, different start command):
   - `rl-crm-worker` → `npm run worker`
   - `vigia-worker` → `npx tsx src/workers/collect-worker.ts`
   - `vigia-cron` → `npm run weekly`, schedule `0 4 * * 0`
   - `vigia-brief-cron` → curl command above, schedule `0 8 * * 1`

5. **Apply schema migrations** (one-time):
   - CRM: open the web service → "Run a Command" → `npm run migrate`
     (applies `database/crm-schema.sql`).
   - Vigía: schema is bootstrapped automatically on first request (see
     `src/lib/db.ts`).

6. **Generate Railway domains** for each web service
   (`*.up.railway.app`) and smoke-test.

7. **Wire custom domains.** In each web service: Settings → Networking →
   Custom Domain. Railway shows you the CNAME target. Add to Cloudflare DNS:

   ```
   raineylagunastudios.com         CNAME  studios-web-…up.railway.app
   www.raineylagunastudios.com     CNAME  raineylagunastudios.com
   raineylaguna.com                CNAME  rl-web-…up.railway.app
   www.raineylaguna.com            CNAME  raineylaguna.com
   crm.raineylaguna.com            CNAME  rl-crm-web-…up.railway.app
   vigia.raineylaguna.com          CNAME  vigia-web-…up.railway.app
   ```

   Keep the proxy **grey-cloud (DNS-only)** until Railway provisions the
   ACME cert (~5 min), then turn the orange cloud on. Set Cloudflare SSL
   mode to **Full (strict)**.

---

## 5. Production smoke tests

Run after every deploy of a service that touches the contracts in §2.

| Test                                                     | Expected                                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `GET https://vigia.raineylaguna.com/api/health`          | `200` JSON                                                                                |
| `GET https://vigia.raineylaguna.com/api/brief` from `raineylaguna.com` | CORS-allowed; sample brief JSON                                              |
| Submit contact form on `raineylaguna.com`                | New row in CRM `leads` table                                                              |
| Run audit on `raineylaguna.com/auditoria`                | Either real Lighthouse score (PSI key set) or local-heuristic fallback                    |
| Trigger Vigía cron manually                              | Briefs land in `briefs` table as `status='draft'`; operator can approve at `/admin/briefs` |

---

## 6. Repo-local docs (don't duplicate them here)

| Repo                  | Doc                                                              |
| --------------------- | ---------------------------------------------------------------- |
| `vigiaV2`             | `RAILWAY_DEPLOY.md` (definitive step-by-step), `BUSINESS_MODEL.md`, `BIBLE.md` |
| `raineylaguna-next`   | `DEPLOY.md`                                                      |
| `raineylaguna-crm`    | `DEPLOY.md`                                                      |
| `raineylagunastudios` | `README.md` (manifesto + signature mechanics), `progress.txt`     |

---

## 7. Outstanding items before public launch

- [ ] Buy `raineylaguna.com`, `raineylagunastudios.com`, and `serenowatch.com` at Cloudflare Registrar.
- [ ] Execute the Vigía → Sereno code rename per `RENAME-PLAN.md`.
- [ ] Hardenining: rotate `CRM_LEAD_INTAKE_SECRET` away from `change_me_to_a_long_random_string`.
- [ ] Replace single-password admin gate (`ADMIN_PASSWORD`) on Vigía with multi-user auth.
- [ ] Confirm Nubefact `B001` and `F001` series are autorizadas with `numero_inicial = 1`.
- [ ] Approve Twilio Content Template for Boletín del Lunes (`TWILIO_TEMPLATE_SID`).
- [ ] Counsel review of Vigía's collection / publication posture (see Vigía README §"Legal posture").
