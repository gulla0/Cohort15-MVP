# Cohort15 MVP

Cohort15 is an online cohort-event platform. Creators use 2 credits to start a cohort, participants use 1 credit to show interest, and quorum unlocks the private online link.

This repository currently uses a dependency-free Node.js web app foundation so the MVP can run and verify locally without package downloads. Product work is tracked in `tasks.json`; `docs/cohort15-mvp-spec-v3.md` is the product behavior source.

## Requirements

- Node.js 24 or newer
- npm 11 or newer

## Commands

```bash
npm run dev
npm run check
npm test
npm run lint
npm start
```

The dev server starts at [http://localhost:3000](http://localhost:3000) by default. Override the port with:

```bash
PORT=4000 npm run dev
```

## Source Layout

- `src/domain`: domain constants, models, and validation rules
- `src/persistence`: database schema, repositories, seed data, and credit ledger primitives
- `src/server`: HTTP entry points and server-side app wiring
- `src/ui`: rendered UI modules and styles
- `tests`: Node test runner coverage
- `scripts`: local project tooling

## Verification

Run the baseline project verification:

```bash
npm run check
```

This executes the repository lint check, the agent workflow guardrail, and the Node test suite.

## Production Deployment Target

The first production deployment target is a Render Web Service named `cohort15-mvp`. The initial runbook is in [docs/deployment-render.md](/Users/gzero/Desktop/cohort15/cohort15-mvp/docs/deployment-render.md), and the starter service configuration is captured in [render.yaml](/Users/gzero/Desktop/cohort15/cohort15-mvp/render.yaml).
The production configuration and secrets boundary is documented in [docs/production-config.md](/Users/gzero/Desktop/cohort15/cohort15-mvp/docs/production-config.md).

Initial production assumptions:

- Runtime: Node 24
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/`
- Generated app URL: `https://cohort15-mvp.onrender.com`, unless Render assigns a different available service URL
- Existing domain use: `cohort15.com` already hosts the pre-release landing page on Netlify
- Custom domain options: keep the app on the Render URL, move `cohort15.com` from Netlify to Render, or use a subdomain such as `https://app.cohort15.com`
- Production startup validation: set `COHORT15_APP_ENV=production` or `NODE_ENV=production`; missing required Supabase, Stripe, social, admin, app URL, upload, or session values fail startup clearly

Do not commit provider credentials or paste secrets into chat. Production secrets and required environment variables are documented in the production configuration runbook.

Production auth for T015 uses Supabase Auth with Google and GitHub providers. The app keeps local seeded-account sign-in available only outside production mode; in production `/auth/sign-in` starts Supabase provider flows and `/auth/callback` exchanges the Supabase identity into the app session.

## Local Demo Data

The app seeds two demo users every time the in-memory app state starts:

| User | ID | Starting grant |
|---|---|---|
| Demo Creator | `user-creator` | 6 credits |
| Demo Participant | `user-participant` | 6 credits |

Seed credits are recorded as grant transactions, not mutable balance fields. Local development auth is explicit: open `/auth/sign-in`, choose one of these seeded users, and the app stores that identity in a local session cookie.

## Local Persistence

By default, the app uses isolated in-memory state and resets whenever the process restarts. To keep users, cohorts, interests, credit transactions, and social outbox records across local restarts, point `COHORT15_PERSISTENCE_FILE` at a JSON state file:

```bash
COHORT15_PERSISTENCE_FILE=.local/cohort15-state.json npm run dev
```

If the file does not exist, the app creates it and seeds the demo users once with grant transactions. To reset local durable state, stop the server and delete the configured JSON file.

## MVP Flow

1. Start the app with `npm run dev`.
2. Open `/auth/sign-in`, sign in as `user-creator`, then open `/cohorts/new` and create a cohort.
3. Confirm `/cohorts` and `/cohorts/:id` show public cohort details but hide the private online link while the event is open.
4. Sign out, sign in as `user-participant`, then show interest; this uses 1 participant credit while quorum is pending.
5. When interest reaches quorum, the event becomes active, creator and participant credits are used, and the private link is visible only to the creator and committed participants.
6. Use `POST /admin/expire-cohorts?now=<ISO date>` to process overdue open cohorts that did not reach quorum. Expiry returns creator and participant credits through refund transactions.
7. Check `/dashboard` while signed in to see the current user's cohort status, credit summary, and authorized unlocked links.

Creators can optionally provide an event image URL/path. Blank image fields use the local default image at `/assets/default-cohort.png`.

Creating a cohort also writes a local social-promotion outbox record with public-safe content. It includes public event fields and the public cohort URL, and it excludes the private online link.

## MVP Boundary

Build now: local session auth path, credit ledger, admin/demo credit grants, create cohort, show interest, quorum unlock, expiry/refund, hidden private links before unlock, feed/detail pages, dashboards, and a local social-promotion outbox.

Production-MVP launch work still includes Supabase Postgres persistence, hardened sessions/CSRF, admin controls, Stripe credit sales, LinkedIn/X/Email publishing, credit bootstrap policy, production upload hardening, audit/health checks, lifecycle controls, security review, and smoke testing. Later product scope includes chat, profiles, reputation, AI matching, waitlists, calendar integrations, moderation tooling, and in-person events. The first documented credit package assumptions are `$6` for 6 credits and `$12` for 14 credits.

## Known Assumptions

- Local persistence is in-memory by default. Restarting the dev server resets demo data unless `COHORT15_PERSISTENCE_FILE` is set.
- Auth uses a dependency-free local session cookie and seeded local users in development; production mode uses Supabase Auth for Google and GitHub sign-in.
- The admin expiry endpoint is a local/dev trigger, not a production scheduler or authorization model.
- Private links stay hidden for open cohorts. Active cohort links are visible only to the creator and committed participants.
- Social promotion is local outbox generation only; real external posting is intentionally out of scope for this MVP.

## Agent Workflow

The repo still includes the bounded agent workflow files. Use `start.txt` for routed work, `tasks.json` as the canonical task ledger, and `agent/progress/task-status.md` as the readable status view.

`npm run check` also verifies that resolved feedback issues in `agent/feedback/issue-index.md` are reflected in `agent/knowledge/index.md`. If that guardrail fails after issue resolution, update the knowledge index with the reusable context before handoff.

Agent managers should commit successful completed task or issue waves after verification and tracker updates. Worker agents should not commit unless the manager explicitly assigns that responsibility.
