# Roadmap — agreed improvements across the four sites

Tracked here so nothing falls through the cracks across sessions. Status
flags: `[ ]` not started, `[~]` in progress, `[x]` shipped.

---

> **Always-fresh status:** check `BUGS.md` before starting any item below — some are blocked by upstream defects.

---

## raineylagunastudios — parent studio

### Incremental
- [ ] **`/who-we-serve` page.** One sentence per vertical. Converts "cool site" → "I get what they sell." Linked from primary nav and footer.
- [ ] **Weekly Kiln cap.** Replace on-demand firing with a Monday-only schedule, "next firing: Mon, N slots remaining." Scarcity > availability for parent brand.
- [ ] **Public Manifesto changelog.** Render a `/changelog` page that diffs every Manifesto revision with timestamp + Lima-weather snapshot. Makes the existing mechanic legible.

### WOW
- [ ] **The Lima Almanac.** Yearly printed almanac of "what we learned about Lima this year": weather extremes, 12 notable Lima SMB sites, project lessons. 200 numbered copies, free to past clients, S/149 otherwise. Reuses Postcard infrastructure. Builds keepable physical artefacts year-over-year.
  - Year-1 budget: ~S/3k (200 × ~S/15 print+postage).
  - Pages: `/almanac` (back issues) + **Culqi Checkout** (cards + Yape) for paid copies + CSV ship-list pulled from CRM. *Do not use Stripe — see `PAYMENTS.md`.*

---

## raineylaguna.com — web-development vertical

### Incremental
- [ ] **Move the audit form above the fold.** Single-input hero: *"¿Cuál es tu web?"*. Rain shader runs behind it. Strongest conversion moment should not be a page away.
- [x] **Wire contact form to WhatsApp** in addition to CRM. *Already shipped* — `ContactForm.tsx:88` opens `wa.me/51912418482` on submit; success state shows the link. Verified May 2026.
- [x] ~~Public audit gallery~~ — *cancelled (operator decision: SMBs won't appreciate public scoring)*.

### WOW
- [ ] **The 60-Second Site.** Prospect inputs business name + Instagram URL + WhatsApp; within 60s a real one-page site renders on `<slug>.preview.raineylaguna.com` using their Instagram photos (via Meta Graph) and Claude-generated copy. CTA: *"Esto es generado; lo a medida toma 6 semanas. Reserva."*
  - Reuses `vigiaV2/scripts/collectors/meta-ads.ts` Meta integration.
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
  - **Deferred:** auto-generation cron (Mon/Wed/Fri 6am for untouched ≥ 7-day leads) — code is ready to wrap, just hadn't shipped a worker yet. Add when daily lead volume justifies it.

---

## vigiaV2 → Sereno — the SaaS

### Incremental
- [x] **`/muestra` public live-brief page.** *Shipped May 2026.* Server page (`src/app/muestra/page.tsx`) wraps a client component (`MuestraClient.tsx`) that takes `?n=&d=&l=` query params, fetches `/api/brief`, and renders a polished, print-friendly, share-able brief matching the existing ink/amber aesthetic. URL itself is the share key. Marketing Nav now links here as "Probar gratis."
- [x] **Collapse pricing to one plan for Phase-1.** *Shipped May 2026.* `lib/plans.ts` adds `getActivePlans()` gated by `PHASE_1_ACTIVE_SLUGS = ['pro']`. `pricing/page.tsx` and home page hero render a single centered "Sereno · S/249/mes" card when only one plan is active. Full PLANS / PLAN_LIST stay defined so legacy subscriptions resolve. Revert by changing `PHASE_1_ACTIVE_SLUGS` or setting `NEXT_PUBLIC_VIGIA_ALL_PLANS=true`.
- [ ] **Sample-week trigger on signup.** Manual operator-reviewable sample brief delivered the Monday immediately after signup, so first-week retention isn't a 6-day wait.
- [ ] **Ronda/sereno copy across `/admin` and email templates.** *"La ronda de esta semana"*, *"El sereno detectó 3 cambios"*. Couples to the rename — execute as part of `RENAME-PLAN.md` Step 3 after `serenowatch.com` is registered.

### WOW
- [ ] **The Counter-Move.** Every signal in the weekly brief gets *"Tu jugada esta semana"* + (where applicable) a pre-built Instagram banner the operator can paste directly. Closes the know→do gap, justifies premium pricing, creates passive viral surface (every banner posted is a subtle Sereno ad).
  - Banner generation via `next/og` (Satori) — already in Next 16.
  - Counter-move text via existing Anthropic call (extend prompt).
  - Schema additions: `briefs.counter_moves jsonb`, `briefs.assets jsonb`.
  - Estimated: 3–4 days.

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
