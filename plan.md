# Cohort15 Piece of Pie MVP Plan

## Project

Cohort15 already has a publicly deployed lofi product for creating cohort requests, collecting private-email interest, reaching quorum, sending notifications, publishing research, and capturing feedback. The Piece of Pie branch adds the minimum identity, credits, and payment layer on top of that working base.

Canonical behavior source: `docs/cohort15-piece-of-pie-mvp-spec.md`.

The earlier lofi specification is retained as historical context only. Where it excludes authentication, credits, or payments, it is superseded by the Piece of Pie specification.

## Goal

Within three days, deploy a public flow that proves a real user can:

1. create an account;
2. receive and use two free credits;
3. encounter a clear payment gate;
4. pay USD $6 for six credits through Stripe; and
5. use purchased credits in the real cohort creation or interest flow.

This product work addresses the Builder Pie payment-gate requirement. Public repository history, weekly progress posts, registration evidence, deployment evidence, and the final presentation remain human obligations tracked in the indexed launch checklist.

## Hard Constraints

- Build from `codex/piece-of-pie`, which was created from the current lofi branch.
- Do not merge or cherry-pick `main`; adapt only proven concepts that fit the lofi architecture.
- Preserve the live Supabase project, Render service, `cohort15.com`, Resend setup, analytics, production data, research, and feedback paths.
- Use additive `cohort15_lofi_*` database objects and nullable account links for legacy rows.
- Use Supabase email magic links only for the three-day MVP.
- Grant exactly two signup credits once per account.
- Use the original two-credit creation, one-credit interest, hold/consume/refund model.
- Offer one Stripe package: six credits for USD $6.
- Require signed, idempotent fulfillment before launch.
- Keep emails, auth tokens, session tokens, payment data, credentials, and provider payloads private.
- Put all provider-dashboard, credential, migration, operational-decision, and production-verification work under `docs/human-tasks/` and index it.
- Run `npm run check` after every implementation or workflow wave.

## Architecture Direction

- Retain the Node HTTP server, ES modules, server-rendered UI, repository boundary, local test store, and server-only Supabase PostgREST adapter.
- Extend domain and persistence with users, hashed opaque sessions, immutable credit transactions, purchases, and processed Stripe events.
- Provision the user and two-credit grant atomically after Supabase verifies a magic-link callback.
- Derive balance exclusively from immutable ledger entries; never persist a mutable balance field.
- Extend cohort and interest records with nullable user IDs while preserving private normalized emails and legacy anonymous rows.
- Make account-backed creation/interest and their holds atomic. Make quorum consumption and expiry refund idempotent and concurrency-safe.
- Use Stripe-hosted Checkout so Cohort15 never receives card details.
- Route both the signed webhook and verified browser return through one fulfillment operation.
- Extend the existing production environment rather than creating replacement provider resources.

## Three-Day Execution

### Day 1 — Identity And Ledger

- L015: add account, session, credit, purchase, and Stripe-event persistence with additive migration and atomic primitives.
- L016: add Supabase magic-link authentication, secure app sessions, CSRF, and the exactly-once two-credit grant.

Exit: a verified account can sign in and has a durable, non-duplicating credit balance.

### Day 2 — Product Gate And Payment

- L017: require authenticated credits for create and interest, then consume/refund holds through quorum and expiry.
- L018: add the one-package Stripe checkout, signed webhook, verified return reconciliation, and idempotent credit fulfillment.

Exit: the real product has a clear payment gate and purchased credits can fund product actions locally.

### Day 3 — Launch Gate

- L019: finish balance/payment UI, runtime configuration, privacy/security regression coverage, and complete end-to-end verification.
- L020: perform the indexed human provider configuration, additive migration, deployment, live payment/use smoke test, and evidence closeout.

Exit: `cohort15.com` publicly demonstrates account → free credits → payment gate → payment → product use.

## MVP Cut

Build now:

- email magic-link sign-in and sign-out;
- durable application sessions and CSRF;
- two-credit once-only account grant;
- credit balance in shared navigation;
- two-credit cohort creation and one-credit interest;
- quorum consumption and expiry refund;
- insufficient-credit Buy Credits gate;
- one USD $6 / six-credit Stripe package;
- signed webhook, verified return, and idempotent fulfillment;
- existing provider extension, deployment, and smoke verification.

Explicitly defer:

- passwords, social login, profiles, comprehensive dashboards, purchase history, admin grant UI;
- subscriptions, multiple packages, multiple currencies, coupons, card-payment refunds/disputes;
- legacy cohort claiming, editing/deletion, images, social publishing, or redesign;
- Cardano functionality.

## Provider Continuity

The user reported that the existing lofi Supabase project, Render service, `cohort15.com` domain, Resend sender/email notifications, and related setup are already in place. The implementation manager must inspect and preserve the existing configuration contract before adding anything.

The only new human setup path is `docs/human-tasks/piece-of-pie-launch.md`. It distinguishes retained resources from required additive Supabase Auth, migration, Stripe, Render-variable, deployment-branch, and production-verification actions. No credentials or secret values belong in repository artifacts or chat.

## Assumptions And Risks

- Magic-link-only authentication is the smallest safe account path for the deadline.
- Existing anonymous data remains valid but is not retroactively funded or assigned to accounts.
- One six-credit package is enough to demonstrate a clear payment gate and real utility.
- Lazy expiry settlement avoids a scheduler but must run before authenticated balance reads and credit-funded mutations.
- Stripe webhook delivery can be delayed, so the browser return performs server-side retrieval and calls the same idempotent fulfillment path.
- A real live-mode payment is required for convincing final verification; Stripe test mode alone is development evidence.
- The product implementation cannot repair missed hackathon registration or weekly-post obligations. Those must be confirmed by the user in the launch checklist.

## Open Non-Blocking Questions

- Additional credit packages can be added after the event; the MVP ships one.
- Google or GitHub login can be added later; the MVP ships email magic links.
- A full account dashboard can follow; the MVP exposes balance in navigation and relevant action/payment pages.

## Next Ready Task

Next ready task: L015.

L015 establishes the durable account, session, ledger, purchase, and Stripe-event boundary required by every later task.
