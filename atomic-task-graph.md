# Cohort15 Piece of Pie MVP Atomic Task Graph

`tasks.json` is canonical. This file is the readable dependency view for the active three-day build. Completed lofi task history remains in Git and progress logs.

## Execution Graph

```text
L015 Account and credit persistence foundation (done)
  └─ L016 Magic-link accounts and signup credits (not_started)
       └─ L017 Credit-gated creation and interest (not_started)
            └─ L018 Stripe checkout and idempotent fulfillment (not_started)
                 └─ L019 Piece of Pie local launch gate (not_started)
                      └─ L020 Live provider setup, deployment, and verification (not_started)
```

## Atomic Task Contracts

### L015 — Add account and credit persistence foundation

- Depends on: none
- Status: done
- Owns: users, hashed sessions, immutable ledger, purchases, Stripe events, nullable account links, additive migration, local/Supabase atomic primitives
- Delivers: concurrency-safe account provisioning, two-credit grant idempotency, balances, holds, consumes, refunds, and purchase fulfillment boundaries
- Stops before: authentication routes, product gating, and Stripe HTTP calls

### L016 — Implement magic-link accounts and signup credits

- Depends on: L015
- Status: not_started
- Owns: Supabase magic-link adapter, app sessions, CSRF, auth routes/UI, shared signed-in navigation
- Delivers: verified email account creation, exactly-once two-credit grant, secure eight-hour session, safe sign-out and return paths
- Stops before: changing cohort creation/interest semantics

### L017 — Credit-gate cohort creation and interest

- Depends on: L016
- Status: not_started
- Owns: authenticated mutation boundary, account-derived private emails, atomic holds, quorum consumption, lazy expiry refunds, insufficient-credit notices
- Delivers: real two-credit creation and one-credit interest utility while preserving public lofi behavior and legacy data
- Stops before: Stripe checkout

### L018 — Implement Stripe checkout and idempotent fulfillment

- Depends on: L017
- Status: not_started
- Owns: one six-credit/$6 package, Checkout Session creation, raw signed webhook, verified return reconciliation, shared fulfillment, payment UI
- Delivers: exactly-once verified purchase credits with no card handling or browser-controlled pricing
- Stops before: live Stripe/Render/Supabase dashboard configuration

### L019 — Complete the Piece of Pie local launch gate

- Depends on: L018
- Status: not_started
- Owns: cohesive balance/payment-gate UX, production runtime contract, end-to-end and regression verification, launch-blocking fixes
- Delivers: locally verified account → grant → use → payment gate → purchase → use flow with existing lofi features intact
- Stops before: human provider mutations and real payment

### L020 — Configure, deploy, and verify the live payment MVP

- Depends on: L019
- Status: not_started
- Owns: indexed human Supabase Auth/migration, Stripe, Render branch/env, deployment, live payment/use smoke, non-secret evidence
- Delivers: publicly usable `cohort15.com` payment-gated MVP and verified live payment utility
- Stops on: passing launch evidence or a precisely documented human/provider blocker

## Execution Rules

- Start every fresh user-facing chat through `start.txt`; prior conversation is not required.
- Execute exactly one task per implementation chat unless the user explicitly changes the workflow.
- The implementation manager selects the next unblocked task from `tasks.json`; workers do not select tasks.
- Consult `main` only as read-only reference. Do not merge or cherry-pick it into this branch.
- Reconcile observable behavior with `docs/cohort15-piece-of-pie-mvp-spec.md` before implementation.
- After implementation and verification, update `tasks.json`, this graph, `README.md`, `plan.md`, `workflow-sheet.md`, `agent/progress/task-status.md`, session notes, change log, and relevant knowledge pointers.
- Run `npm run check` and commit each successful task wave separately.
- External provider work follows `docs/human-tasks/piece-of-pie-launch.md`; never place credentials or secret values in repository artifacts or chat.
