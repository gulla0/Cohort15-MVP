# Cohort15 Piece of Pie MVP

This branch extends the deployed Cohort15 lofi product with the smallest account, credit, and real-payment flow required for a publicly usable, payment-gated MVP.

The existing landing page, cohort directory, creation and interest flow, quorum unlock, research collection, feedback capture, Supabase persistence, Render deployment, Resend notifications, analytics, and `cohort15.com` domain remain the base. The new work adds email magic-link accounts, a one-time two-credit signup grant, credit-funded cohort actions, and one Stripe Checkout package.

## Setup Status

The local Piece of Pie implementation through L019 includes accounts, credit-funded product actions, fake-provider Stripe Checkout with exactly-once fulfillment, cohesive launch verification, and the production configuration contract. L020 remains human-run provider setup, deployment, and production verification using the indexed launch checklist.

- Canonical product rules: `docs/cohort15-piece-of-pie-mvp-spec.md`
- Historical lofi baseline: `docs/cohort15-lofi-mvp-spec.md`
- Three-day plan: `plan.md`
- Canonical task ledger: `tasks.json`
- Dependency graph: `atomic-task-graph.md`
- Current status: `agent/progress/task-status.md`
- Human/provider continuity: `docs/human-tasks/README.md`

Next ready task: L020.

A fresh user-facing chat should start only from `start.txt`. The router reads the canonical artifacts above and transitions approved planned work to the implementation manager without requiring prior chat history.

## Locked MVP

- Anonymous visitors can browse public cohorts and research.
- Supabase email magic links create authenticated accounts.
- A new account receives exactly two free credits once.
- Creating a cohort holds two credits; showing interest holds one.
- Quorum consumes holds; below-quorum expiry refunds holds.
- Insufficient balance presents a clear Buy Credits gate.
- Stripe sells one six-credit package for USD $6.
- Signed, idempotent fulfillment prevents duplicate purchase credits.
- Existing provider resources and production data are extended, not replaced.

## Intended Stack

- Node.js 24 HTTP server and ES modules
- server-rendered HTML/CSS
- existing isolated Supabase Postgres project plus Supabase Auth
- existing Render Web Service and `cohort15.com` domain
- Stripe Checkout and signed webhooks
- Resend transactional email
- Google Analytics measurement ID `G-LF22TLDSBV`

## Commands

```bash
npm run dev
npm run check
npm test
npm run lint
npm start
```

The local server defaults to `http://localhost:3000`. Production preserves the existing lofi environment contract and adds exactly `COHORT15_LOFI_SUPABASE_ANON_KEY`, `COHORT15_LOFI_STRIPE_SECRET_KEY`, `COHORT15_LOFI_STRIPE_PRICE_6_CREDITS`, and `COHORT15_LOFI_STRIPE_WEBHOOK_SECRET`. Startup fails clearly when any required production value is absent. `.env.example` and `render.yaml` enumerate the contract without embedding credentials or provider secret values.

Never commit or paste Supabase keys, Stripe keys, webhook secrets, Resend keys, session tokens, customer data, or test payment details. All dashboard, credential, migration, deployment, and production-verification steps are kept in `docs/human-tasks/piece-of-pie-launch.md`.

## Agent Workflow

Use `start.txt` as the sole fresh-chat entry point. It reads `tasks.json` and `agent/progress/task-status.md`, classifies planned work as main implementation, and transitions to `agent-starters/startNewManager.txt` after approval when needed.

Managers select the next unblocked task, verify the bounded task, align the task ledger and readable trackers, run `npm run check`, and commit the completed task wave. Workers are internal executors and are never the user's direct entry point.

The lofi implementation history remains in Git and the progress logs. The active ledger now contains only the Piece of Pie implementation and launch tasks.
