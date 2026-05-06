# Known bugs across the stack

Discovered while implementing the ROADMAP. Logged here so they don't fall
through the cracks.

---

## ✅ FIXED (commit incoming): lead-intake contract

**Resolved May 2026** — see commit on `datacendia/raineylaguna-crm`. Recap of
what was done:

1. `database/migrations/2026-05-06-public-lead-intake.sql` adds `email`,
   `phone`, `source` columns + indexes. Idempotent, runs once via
   `SCHEMA_PATH=database/migrations/2026-05-06-public-lead-intake.sql npm run migrate`.
2. `database/crm-schema.sql` updated so fresh installs include the columns.
3. `src/app/api/leads/public/route.ts` created. Validates
   `X-Lead-Intake-Secret` in constant time, de-dupes by email/phone
   (appends to existing notes if a match is found), inserts pipeline_stage
   `Lead`.
4. `src/lib/types.ts` Lead type extended with `email`, `phone`, `source`.
5. `src/app/api/leads/[id]/route.ts` PATCH allowlist now includes
   `email` and `phone`.
6. Lead detail page (`src/app/dashboard/leads/[id]/page.tsx`) renders
   email/phone/source in the metadata grid plus a one-click WhatsApp
   button in the header.
7. Leads list page (`src/app/dashboard/leads/page.tsx`) gets a tiny `�`
   shortcut column so you can open a chat without drilling into the lead.

**Remaining manual step (operator):** set `CRM_LEAD_INTAKE_SECRET` to the
same long random string in **both** Railway environments (raineylaguna-next
and raineylaguna-crm). Currently defaulted to `change_me_to_a_long_random_string`.

---

## 📝 Historical: lead-intake contract was broken

**Symptom**: leads submitted from `raineylaguna.com` contact form do not
appear in the CRM.

**Root cause**:

1. `raineylaguna-next/src/app/api/lead/route.ts:55` POSTs to
   `${CRM_PUBLIC_API}/api/leads/public` with body
   `{ name, email, phone, district, niche, notes }`.
2. The CRM has **no `/api/leads/public` route** — only:
   - `raineylaguna-crm/src/app/api/leads/route.ts`
   - `raineylaguna-crm/src/app/api/leads/[id]/route.ts`
   - `raineylaguna-crm/src/app/api/leads/bulk/route.ts`
3. `crm_leads` table has **no `email` or `phone` columns**
   (`raineylaguna-crm/database/crm-schema.sql:36-52`).

**Effect today**: the marketing-site form falls back to its `log-only` mode
(line 51 of the lead route) and silently 200s. Visitors think the form
worked. You never see the lead.

**Fix (estimate ~1 hr)**:

1. Add columns to `crm_leads`:
   ```sql
   ALTER TABLE crm_leads
     ADD COLUMN email VARCHAR(255),
     ADD COLUMN phone VARCHAR(50),
     ADD COLUMN source VARCHAR(100);
   ```
2. Create `raineylaguna-crm/src/app/api/leads/public/route.ts`:
   - Validates `X-Lead-Intake-Secret` header against `CRM_LEAD_INTAKE_SECRET`
   - Inserts a new row with the public payload
   - Returns `{ ok: true, id }`
3. Update `Lead` type in `raineylaguna-crm/src/lib/types.ts` to include the
   new fields, and surface them on the lead detail page.
4. Set `CRM_LEAD_INTAKE_SECRET` to the same long random string in **both**
   Railway environments (raineylaguna-next + raineylaguna-crm). Currently
   defaulted to `change_me_to_a_long_random_string`.

**Was blocking**:

- ~~ROADMAP item #2 (click-to-WhatsApp on CRM lead cards) — needs `phone`.~~ ✅
- ~~Operator can't actually receive leads from the public site.~~ ✅

---

## 🟡 Stale: outreach worker doesn't send

`raineylaguna-crm/scripts/outreach-worker.ts:30` says:

```js
// TODO: send via real provider here.
// For now we just mark the event as Sent so the dashboard updates.
```

Until this is wired to Twilio (you have it in vigiaV2 already) or Resend,
"Batch Outreach" → "Sent" is a lie. ROADMAP item #12 (AI-drafted outreach)
covers this.

---

## 🟡 Cosmetic: CRM seed phone fields

The `crm_leads` schema has no phone column today, but the ~330 seeded leads
in `scripts/seed.ts` may already include phone data inside `notes` as a
freeform string. After fixing the critical bug above, write a one-time
migration to extract phones from existing `notes` blobs and into the new
column. Otherwise old leads stay un-WhatsAppable.

---

## ⛔ Won't fix: Procfile worker on Railway

Documented in `raineylaguna-crm/README.md:47-51`. Railway ignores Procfile
process types; the worker has to be a separate Railway service. This is
a Railway limitation, not a code bug. Already documented.
