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
- [ ] **Snooze + Next-Action column.** Kanban cards show the next *verb* ("Send audit video", "Follow up in 3 days"), not just status. Cuts daily triage from ~20 min to ~2.
- [ ] **Click-to-WhatsApp on every lead card.** Either Twilio (rich tracking, reuses Vigía's setup) or `wa.me` link (zero infra). Pick `wa.me` for v1. **BLOCKED** by `BUGS.md` §"lead-intake contract is broken" — needs `phone` column on `crm_leads` first.
- [x] **Self-mailed Monday digest.** *Shipped as `/dashboard/digest` server-rendered page* (May 2026). Operator bookmarks it; no email infra needed. External cron can curl-and-email later if push delivery becomes useful. See `raineylaguna-crm/src/app/dashboard/digest/page.tsx`.

### WOW
- [ ] **AI-drafted outreach.** Daily Anthropic-powered drafter generates 3-line WhatsApp messages for every overdue lead, surfaced on each card. One-click review → send via Twilio. Targets ~5×ing daily outreach volume at the same wall-clock cost.
  - New table: `outreach_drafts (lead_id, body, generated_at, status)`.
  - New cron: `scripts/draft-outreach.ts`, Mon/Wed/Fri 6am.
  - Reuses Anthropic key + prompt patterns from vigiaV2.
  - Estimated: 1 day.

---

## vigiaV2 → Sereno — the SaaS

### Incremental
- [ ] **`/muestra` public live-brief page.** Renders the existing `/api/brief` JSON beautifully, no auth. Highest single-leverage page on the site — prospects can *read the product*, not read about it.
- [ ] **Collapse pricing to one plan for Phase-1.** Esencial/Pro/Cadena → "Sereno · S/249/mes" only. Three tiers re-introduced at ~30 paying customers. Reduces checkout cognitive load.
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
