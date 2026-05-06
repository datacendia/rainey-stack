# Brand decisions

## TL;DR

| Property         | Value                                  |
| ---------------- | -------------------------------------- |
| Parent studio    | **Rainey Laguna Studios**              |
| Studio domain    | `raineylagunastudios.com` *(unowned, register at Cloudflare)* |
| Web vertical     | **Rainey Laguna**                      |
| Vertical domain  | `raineylaguna.com` *(unowned, register at Cloudflare)* |
| CRM subdomain    | `crm.raineylaguna.com`                 |
| SaaS product     | **Sereno** *(rename pending; codebase still says Vigía)* |
| SaaS domain      | `serenowatch.com` *(unowned, register at Cloudflare)* |
| SaaS subdomain   | `app.serenowatch.com` (production app) |

---

## Sereno — naming rationale

> *Sereno* is the Lima neighbourhood night-watchman who patrols the streets
> on his round (`la ronda`), keeping watch so residents can sleep. The product
> does the same thing for restaurant owners: it watches the competition all
> week so they can sleep on Sunday night instead of doom-scrolling Instagram.

`Sereno` alone is a generic word and `sereno.com` / `sereno.app` /
`sereno.ai` are taken. The bilingual hybrid **serenowatch** preserves the
Lima myth and adds an English-readable handle:

- *`Sereno`* = night-watchman (ES, Lima-specific)
- *`watch`* = surveillance / monitor (EN)
- Same meaning encoded twice → impossible to mistranslate
- Generalises beyond restaurants: a watchman watches anything
- Customer-side narrative writes itself: *"Sereno watched 47 competitors this week"*, *"Set Sereno to watch this competitor"*, *"Your Sereno report is ready."*

### Names rejected and why

| Candidate         | Reason                                                    |
| ----------------- | --------------------------------------------------------- |
| Vigía             | `vigia.com` / `.pe` / `.io` / `.ai` all taken             |
| Scoutly           | `scoutly.com` taken; was an earlier prototype name only   |
| Sereno (alone)    | `.com` taken                                              |
| Mirador, Atalaya  | `.com` taken; `*hq.com` available but weaker              |
| Ronda             | Strong contender (`rondabrief.com` open) but less iconic than `sereno`; held as fallback |

### Defensive registrations to consider

Spending ~$30 to lock these prevents a competitor or squatter from harvesting Sereno's brand traffic:

- `serenosignals.com` — already aligned with the codebase ("signal feed")
- `serenobrief.com` — direct product-name match
- `rondabrief.com` — fallback if Sereno ever gets contested

---

## Domain availability — verified May 2026

Verified via Verisign WHOIS (`whois.verisign-grs.com:43`).

### To register (Cloudflare Registrar, ~$10/yr each)

- 🟢 `raineylaguna.com`
- 🟢 `raineylagunastudios.com`
- 🟢 `serenowatch.com`
- 🟢 (optional defensives) `serenosignals.com`, `serenobrief.com`, `rondabrief.com`

### Already taken — do not pursue

- 🔴 `vigia.com`, `vigia.pe`, `vigia.io`, `vigia.ai`
- 🔴 `scoutly.com`, `scoutly.app`
- 🔴 `sereno.com`, `sereno.app`, `sereno.ai`
- 🔴 `serenoai.com`, `serenolabs.com`, `serenopulse.com`, `trysereno.com`

---

## Visual identity (carry-over from Vigía)

The aesthetic does not change with the rename. Sereno inherits Vigía's design tokens:

- **Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide icons
- **Aesthetic**: editorial / "war-room briefing"
- **Tokens**: `ink-{50..950}`, `amber` (`#ffb020`), `signal-{red,green,blue}`
- **Type**: Fraunces (display, variable axes), JetBrains Mono (code/data)

The night-watchman framing **strengthens** the existing dark-canvas
electric-amber direction — Sereno is a creature of the night.

---

## Pending work

- [ ] Buy `raineylaguna.com`, `raineylagunastudios.com`, `serenowatch.com` at Cloudflare Registrar
- [ ] Confirm `@serenowatch` social handles (X, Instagram, GitHub) — see `RENAME-PLAN.md` §0
- [ ] Execute the code rename per `RENAME-PLAN.md`
- [ ] Update Culqi merchant display name and plan descriptions (live mode)
- [ ] Update Nubefact issuer metadata if the razón social changes
- [ ] Re-render OG images and favicons with new wordmark
