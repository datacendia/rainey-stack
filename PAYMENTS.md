# Payments strategy

## Constraint

**The operator is Peru-resident; registering a US entity for Stripe is not
acceptable.** Every payment surface in this stack must accept payment from a
Peru-resident customer using a Peru-issued instrument, and settle to a
Peru-resident merchant.

## Stack

| Method        | Coverage in Peru | Recommended processor | US entity required? |
| ------------- | ---------------- | --------------------- | ------------------- |
| **Yape**      | Dominant wallet (BCP, ~12M users) | Culqi (native `yape` payment method) | No |
| **Plin**      | Competing wallet (Interbank/BBVA/Scotiabank) | Mercado Pago (multi-wallet support) | No |
| **Cards**     | Visa / Mastercard / Diners | Culqi (primary) or Mercado Pago | No |
| **PagoEfectivo** | Cash via banks/agentes (older but still ~10% of Peru e-commerce) | Culqi (`pago_efectivo` method) | No |
| **Stripe**    | International / USD only | Stripe | **Yes** — do not use as primary |

## Recommended architecture

**Primary**: **Culqi** for cards + Yape + PagoEfectivo (one merchant account, one webhook).
**Secondary**: **Mercado Pago** for Plin (and a redundant card path).
**Tertiary** (only if international demand emerges): Stripe with a Stripe-Atlas LLC, or a Wise Business / Payoneer recipient on a Mercado Pago payout — defer this until there's actual international revenue to justify the setup.

## Per-site payment status

### Sereno (`vigiaV2`)

- ✅ Culqi cards: wired (`src/lib/culqi.ts`, plans configured via `CULQI_PLAN_*` env vars)
- ✅ Nubefact SUNAT comprobantes: wired (boleta `B001`, factura `F001`)
- ✅ Culqi webhook: wired (`/api/webhooks/culqi`)
- ⛔ **Yape**: not enabled yet — add `payment_method: 'yape'` to the Culqi Checkout configuration. Trivial change.
- ⛔ **Plin**: not supported. Add Mercado Pago as a secondary processor only if Yape conversion proves insufficient.
- ✅ Stripe: gated behind `NEXT_PUBLIC_STRIPE_ENABLED=false` — leave it off for now.

### Lima Almanac (studios WOW, item #13)

Originally scoped with "Stripe Checkout". **Replace with Culqi Checkout** —
the Almanac is sold to past Lima clients, almost all of whom will pay with
Yape. Stripe stays disabled.

### raineylaguna.com / CRM

No payment surfaces today. If you ever take project deposits online, route
through Culqi using the same merchant account as Sereno. (Culqi does not
require a separate merchant per product; the `description` field
distinguishes the line item on the boleta.)

## Open work

- [ ] **Enable Yape on Sereno checkout** (`vigiaV2/src/app/checkout/page.tsx` — pass `payment_methods` to Culqi.checkout). Estimated 30 min.
- [ ] **Re-scope Almanac WOW to use Culqi Checkout**, not Stripe.
- [ ] **Decide on Mercado Pago for Plin**: skip for v1 (Yape covers ~70% of wallet share); revisit at 30+ paying customers if Plin-only customers ask.
- [ ] **Document the Culqi merchant onboarding** in `vigiaV2/CULQI_SETUP.md` if it doesn't already cover Yape activation. (The Yape merchant flag is enabled per-account in Culqi's dashboard.)

## References

- Culqi docs — https://docs.culqi.com/es/documentacion/checkout-v4 (Yape config)
- Mercado Pago Perú — https://www.mercadopago.com.pe/developers
- BCP Yape developer portal — https://yape.pe/empresas (if direct integration ever needed; Culqi is the easier path)
