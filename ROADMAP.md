# Roadmap — agreed improvements across the four sites

Tracked here so nothing falls through the cracks across sessions. Status
flags: `[ ]` not started, `[~]` in progress, `[x]` shipped.

---

> **Always-fresh status:** check `BUGS.md` before starting any item below — some are blocked by upstream defects.

---

## raineylagunastudios — parent studio

### Incremental
- [x] **`/who-we-serve` page.** *Shipped May 2026.* New `/who-we-serve/index.html` (self-contained, matches `/about/` pattern). Six one-sentence verticals: Hospitalidad, Cultura independiente, Retail de autor, Productores artesanales, Servicios profesionales, Creadores independientes — each with a Spanish + English sentence and a three-word tag. "None of the six?" door routes to `/#commission` (Reverse Commissioning). Linked from home footer map and sitemap.
- [x] **Weekly Kiln cap.** *Shipped May 2026.* Scarcity panel (`#kilnCap`) injected above the Lab WhatsApp CTA. Reads `/data/kiln.json` (operator edits weekly), shows "Próxima cocción · LUNES 11 DE MAYO · 4 de 6 piezas libres" with a progress bar, and flips to a red-bordered "Tirada cerrada" state when full or past firing. Operator cost = 10 seconds in a phone JSON edit every Sunday. Bilingual. Fails silent if the JSON is missing.
- [x] **Public Manifesto changelog.** *Shipped May 2026.* New `/changelog/index.html` renders every revision from `/data/manifesto.json` with timestamp, Lima-weather snapshot (summary + type `wght`/`slnt`), and a paragraph-level LCS diff versus the previous revision (additions vermilion, removals copper, unchanged dim). Operator workflow: when editing `#manifestoBody` in `index.html`, append a new revision object to `data/manifesto.json` before pushing. Linked from footer map + sitemap.

### WOW
- [ ] **The Lima Almanac.** Yearly printed almanac of "what we learned about Lima this year": weather extremes, 12 notable Lima SMB sites, project lessons. 200 numbered copies, free to past clients, S/149 otherwise. Reuses Postcard infrastructure. Builds keepable physical artefacts year-over-year.
  - Year-1 budget: ~S/3k (200 × ~S/15 print+postage).
  - Pages: `/almanac` (back issues) + **Culqi Checkout** (cards + Yape) for paid copies + CSV ship-list pulled from CRM. *Do not use Stripe — see `PAYMENTS.md`.*

---

## raineylaguna.com — web-development vertical

### Incremental
- [x] **Move the audit form above the fold.** *Shipped May 2026.* Hero now has a single URL input beneath the headline — *"¿Cuál es tu web?"* / *"What's your site?"* — submitting routes to `/auditoria?url=...` (or `/en/audit?url=...`), and `AuditTool` reads the query param via `useSearchParams` and auto-kicks the audit so the visitor lands on the running progress + results, not an empty form. Input is resilient to paste artefacts (prepends `https://` if missing). Both locale routes wrapped in `<Suspense>` to satisfy Next 15 CSR-bailout rule. Rain shader continues behind the hero.
- [x] **Wire contact form to WhatsApp** in addition to CRM. *Already shipped* — `ContactForm.tsx:88` opens `wa.me/51912418482` on submit; success state shows the link. Verified May 2026.
- [x] ~~Public audit gallery~~ — *cancelled (operator decision: SMBs won't appreciate public scoring)*.

### WOW
- [x] **The 60-Second Site — v1 shipped May 2026.** Public form at `/proto` (page + `Proto60Form.tsx` client component): business name, one-line pitch, district, WhatsApp, up to 3 photo URLs. POSTs to `/api/proto/generate`, which calls Anthropic with the operator-tuned `proto-prompt.ts` and returns a `ProtoOutput { headline, subhead, pillars[3], about, cta }`. The result renders inline as a faithful raineylaguna-styled one-pager (hero, 3 pillar cards, optional photo grid, about, secondary CTA, studio attribution). Hard-coded prompt rules: Lima Spanish, no invention, business name verbatim in headline, no emojis. Falls back to a stub when `ANTHROPIC_API_KEY` or `PROTO_STUB_MODE=1`. Rate-limited 5/min/IP. Honeypot. Added `@anthropic-ai/sdk` to deps.<br>**Deferred to v2:** (a) persistence + shareable URLs at `<slug>.preview.raineylaguna.com` — needs Vercel KV or a small Postgres + slug router; (b) Meta Graph integration for IG URL → photo set (currently the user pastes URLs); (c) 3 alternate templates (currently one template, the most opinionated).
  - Reuses Anthropic API key already wired in vigiaV2.
  - Three Rainey-designed templates so previews still feel branded.
  - Estimated: 2–3 focused days.

---

## crm.raineylaguna.com — internal CRM

### Incremental
- [x] **Snooze + Next-Action column.** *Shipped May 2026.* New `next_action TEXT` and `snoozed_until TIMESTAMPTZ` columns on `crm_leads`. Detail page has a free-text Next Action input (saves on blur) and quick-snooze buttons (1/3/7/14/30d + Wake up). Leads list defaults to hiding snoozed leads, surfaces just-expired snoozes at the top with a `⏰ due` badge, dims actively-snoozed rows when "Include snoozed" is on, and adds a Next Action column. Run migration `database/migrations/2026-05-06-snooze-next-action.sql`.
- [x] **Click-to-WhatsApp on every lead card.** *Shipped May 2026* with `wa.me` deep links on the lead detail header **and** as a `💬` shortcut column on the leads list. Bundled with the lead-intake bug fix that unblocked it (see `BUGS.md`).
- [x] **Self-mailed Monday digest.** *Shipped as `/dashboard/digest` server-rendered page* (May 2026). Operator bookmarks it; no email infra needed. External cron can curl-and-email later if push delivery becomes useful. See `raineylaguna-crm/src/app/dashboard/digest/page.tsx`.

### WOW
- [x] **AI-drafted outreach in CRM (WOW).** *Shipped May 2026 (on-demand v1).* Operator clicks "Generate draft" on a lead detail page → Claude 3.5 Sonnet writes a personalized 90-word Spanish WhatsApp opener grounded in the lead's district / niche / website status / evaluation / strategic action. Operator can edit inline, click "Send via WhatsApp" (deep-links wa.me with the body prefilled and logs an outreach event), or "Discard."
  - New table: `crm_outreach_drafts` (lead_id, channel, body, model, prompt_version, status, generated_at, acted_at).
  - New API: `POST/GET/PATCH /api/leads/[id]/draft-outreach`.
  - New lib: `src/lib/anthropic.ts` (native fetch, no SDK dep).
  - System prompt locked to `v1-2026-05-06`; bumps tracked in `prompt_version` column for A/B comparison.
  - **Operator setup:** set `ANTHROPIC_API_KEY` in CRM Railway env. Optional: `ANTHROPIC_MODEL` (default `claude-3-5-sonnet-20241022`). Run migration `database/migrations/2026-05-06-outreach-drafts.sql`.
  - **Auto-generation cron** *shipped May 2026.* `scripts/draft-outreach-cron.ts` (run as `npm run draft-outreach-cron` from Railway scheduled job). Picks cold leads (`pipeline_stage='Lead'`, ≥ 7 days old, no outreach events, no active snooze, no pending draft) and generates drafts at 1.5s pacing. Caps at 25 leads/run by default (`DRAFT_CRON_MAX_LEADS`). Shares `src/lib/draft-outreach.ts` with the on-demand route so the prompt stays single-source. Suggested schedule: `0 11 * * 1,3,5` in UTC (= 6am America/Lima Mon/Wed/Fri). Dry-run: `DRAFT_CRON_DRY_RUN=true npm run draft-outreach-cron`.

---

## vigiaV2 → Sereno — the SaaS

### Incremental
- [x] **`/muestra` public live-brief page.** *Shipped May 2026.* Server page (`src/app/muestra/page.tsx`) wraps a client component (`MuestraClient.tsx`) that takes `?n=&d=&l=` query params, fetches `/api/brief`, and renders a polished, print-friendly, share-able brief matching the existing ink/amber aesthetic. URL itself is the share key. Marketing Nav now links here as "Probar gratis."
- [x] **Collapse pricing to one plan for Phase-1.** *Shipped May 2026.* `lib/plans.ts` adds `getActivePlans()` gated by `PHASE_1_ACTIVE_SLUGS = ['pro']`. `pricing/page.tsx` and home page hero render a single centered "Sereno · S/249/mes" card when only one plan is active. Full PLANS / PLAN_LIST stay defined so legacy subscriptions resolve. Revert by changing `PHASE_1_ACTIVE_SLUGS` or setting `NEXT_PUBLIC_VIGIA_ALL_PLANS=true`.
- [ ] **Sample-week trigger on signup.** Manual operator-reviewable sample brief delivered the Monday immediately after signup, so first-week retention isn't a 6-day wait.
- [ ] **Ronda/sereno copy across `/admin` and email templates.** *"La ronda de esta semana"*, *"El sereno detectó 3 cambios"*. Couples to the rename — execute as part of `RENAME-PLAN.md` Step 3 after `serenowatch.com` is registered.

### WOW
- [x] **The Counter-Move — v1 shipped May 2026.** Per-signal `counter_move: { title, jugada, reason }` added to `BulletPoint` (optional, so historical briefs still deserialize). Prompt rule 6b + JSON-schema clause force Claude to return one per bullet. Renderers (WhatsApp + Markdown) surface the jugada under each signal; dry-run `mockOutput` emits placeholders so layout work doesn't burn tokens. New `GET /api/og/counter-move?brief=<id>&signal=<n>[&format=square]` route uses `next/og` `ImageResponse` to render a 1080×1350 portrait banner (or 1080×1080 square) per signal in the studios palette, with severity dot, competitor, headline, jugada title, and `vigia.pe` mark. `/app/briefs` page shows a left-bordered callout per bullet with both banner download links. Tracks `counter_move.banner_rendered` events. Banner is cached `s-maxage=86400, immutable`.<br>**Deferred to v2:** dedicated `briefs.counter_moves jsonb` / `briefs.assets jsonb` columns (current `payload` jsonb covers it; promote when a query needs to filter by counter-move state); admin `/admin/briefs/[id]/preview` surface; `vigia.pe/j/<slug>` shortlinks for sharing the banner page itself.

---

# Suggested execution order

Cheap-and-now → expensive-and-later, with WOWs sequenced to avoid blocking on the Sereno rename.

| # | Site               | Item                          | Effort | Dependency             |
|---|--------------------|-------------------------------|--------|------------------------|
| 1 | raineylaguna.com   | WhatsApp link on contact      | 30 min | none                   |
| 2 | CRM                | Click-to-WhatsApp             | 30 min | none                   |
| 3 | CRM                | Self-mailed Monday digest     | 2 hrs  | none                   |
| 4 | studios            | `/who-we-serve` page          | 2 hrs  | none                   |
| 5 | studios            | Manifesto changelog           | 2 hrs  | none                   |
| 6 | studios            | Weekly Kiln cap               | 1 hr   | none                   |
| 7 | raineylaguna.com   | Audit above fold              | 2 hrs  | none                   |
| 8 | CRM                | Snooze + Next-Action column   | 4 hrs  | none                   |
| 9 | Sereno             | `/muestra` public brief page  | 4 hrs  | none                   |
| 10| Sereno             | Sample-week trigger           | 3 hrs  | operator review queue  |
| 11| Sereno             | Collapse to one plan          | 1 hr   | none                   |
| 12| **CRM WOW**        | AI-drafted outreach           | 1 day  | none                   |
| 13| **studios WOW**    | Lima Almanac (year-1 issue)   | 2 days | content                |
| 14| **raineylaguna WOW**| 60-Second Site               | 2-3 days | Meta Graph token     |
| 15| **Sereno WOW**     | Counter-Move + banners        | 3-4 days | rename complete (so banners ship under correct brand) |
| 16| Sereno             | Ronda/sereno copy             | bundled with rename | `serenowatch.com` registered |
| ~~17~~ | ~~Sereno~~ | ~~Enable Yape on Culqi checkout~~ | ~~30 min~~ | **already shipped** — see `BUGS.md` discovery |

Total ~3–4 weeks of focused work to ship the remaining items.

## Shipped this session (May 2026)

- ✅ **Item 1** (raineylaguna.com WhatsApp link) — found already shipped, no work needed.
- ✅ **Item 17** (Yape on Sereno checkout) — found already shipped, no work needed.
- ✅ **Item 3** (CRM Monday digest) — shipped as `/dashboard/digest` server-rendered page in `raineylaguna-crm`.
- 📝 **`BUGS.md`** — logged the broken lead-intake contract (missing `/api/leads/public` route + missing `email`/`phone` columns on `crm_leads`). Critical, blocks Item 2.
