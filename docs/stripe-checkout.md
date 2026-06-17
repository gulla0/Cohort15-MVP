# Stripe Checkout Setup

T020 uses [Stripe-hosted Checkout](https://docs.stripe.com/payments/checkout) for two one-time packages: 6 credits for $6 and 14 credits for $12. Cohort15 never receives or stores card details. The server creates Checkout Sessions and retrieves the completed Session from Stripe before adding credits.

## Human Setup Checklist

Complete this in Stripe test mode first. Do not paste API keys, webhook secrets, payment details, or session cookies into chat, issues, or committed files.

1. Open the [Stripe Dashboard](https://dashboard.stripe.com/) and switch on **Test mode**.
2. Go to **More** -> **Product catalog** -> **Products**, or open [Product catalog](https://dashboard.stripe.com/test/products).
3. Create a product named `Cohort15 Credits` with two one-time USD prices:
   - `$6.00` for the 6-credit package.
   - `$12.00` for the 14-credit package.
4. Copy each `price_...` identifier. Price IDs are configuration values, not secrets.
5. Go to **Developers** -> **API keys**, or open [test API keys](https://dashboard.stripe.com/test/apikeys). Reveal and copy the test secret key directly into the runtime environment. Never commit it.
6. In Render, open [Dashboard](https://dashboard.render.com/) -> `cohort15-mvp` -> **Environment** and set:
   - `STRIPE_SECRET_KEY` to the server-side `sk_test_...` key while testing, then the corresponding `sk_live_...` key for launch.
   - `STRIPE_PRICE_6_CREDITS` to the exact 6-credit Price ID.
   - `STRIPE_PRICE_14_CREDITS` to the exact 14-credit Price ID.
   - Keep `COHORT15_APP_URL` set to the deployed origin with no trailing slash, currently `https://cohort15-mvp.onrender.com` unless Render assigned another URL.
7. Review the local configuration templates at `.env.example`, `render.yaml`, and `src/config/runtime.mjs`. Do not put real secrets in `.env.example` or `render.yaml`.
8. Redeploy, sign in, and open the exact purchase page: `COHORT15_APP_URL/credits/buy`.
9. Select each package and confirm Stripe-hosted Checkout shows the matching amount. In test mode, use a [Stripe test card](https://docs.stripe.com/testing#cards), not a real card.
10. After payment, Stripe returns the browser to `COHORT15_APP_URL/credits/checkout/complete?session_id={CHECKOUT_SESSION_ID}`. Confirm the page reports the correct number of credits and `/dashboard` shows the increased available balance.
11. Cancel a separate Checkout attempt and confirm Stripe returns to `COHORT15_APP_URL/credits/buy?cancelled=1` with no new purchase credit transaction.
12. In Stripe, open **Payments** and confirm test payments match the Cohort15 purchases. In Supabase, open **Table Editor** and confirm `cohort15_purchases` and `cohort15_credit_transactions` contain the matching auditable records; do not share full payment or user records in chat.

Checkpoint: T020 can run after the secret key and both Price IDs are entered in the deployment environment. Report only whether setup and both test purchases succeeded; sharing Price IDs is acceptable, but never share secret keys.

## Fulfillment Boundary

The return route retrieves the Checkout Session directly from Stripe and verifies its account reference, purchase metadata, amount, currency, completion status, and paid status before granting credits. Refreshing a completed return page does not add credits twice in the running application.

Stripe recommends webhook-driven fulfillment because a customer might pay and never return to the application. T021 owns the production webhook endpoint, signature verification, durable event idempotency, pending/failed reconciliation, and recovery for completed payments whose browser does not return. Until T021 is complete, do not treat T020 alone as the final payment reliability boundary.

## Local and Test Mode

Local development remains runnable without Stripe configuration; `/credits/buy` displays checkout as unavailable and cannot collect payment. To exercise real Stripe test Checkout locally, set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_6_CREDITS`, and `STRIPE_PRICE_14_CREDITS` in the process environment and set `COHORT15_APP_URL` to the browser-reachable local origin, normally `http://localhost:3000`. Do not commit a local environment file containing the key.

Automated tests inject a fake Stripe transport and never call Stripe or use provider credentials:

```bash
node --test tests/stripe-purchases.test.mjs
```
