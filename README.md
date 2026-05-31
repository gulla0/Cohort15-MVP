# Cohort15 MVP

Cohort15 is an online cohort-event platform. Creators use 2 tokens to start a cohort, participants use 1 token to show interest, and quorum unlocks the private online link.

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
```

The dev server starts at [http://localhost:3000](http://localhost:3000) by default. Override the port with:

```bash
PORT=4000 npm run dev
```

## Source Layout

- `src/domain`: domain constants, models, and validation rules
- `src/persistence`: database schema, repositories, seed data, and token ledger primitives
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

## Local Demo Data

The app seeds two demo users every time the in-memory app state starts:

| User | ID | Starting grant |
|---|---|---|
| Demo Creator | `user-creator` | 6 tokens |
| Demo Participant | `user-participant` | 6 tokens |

Seed tokens are recorded as grant transactions, not mutable balance fields. The temporary MVP auth path uses these user IDs in forms and query parameters, for example `/dashboard?creatorUserId=user-creator&participantUserId=user-participant`.

## Local Persistence

By default, the app uses isolated in-memory state and resets whenever the process restarts. To keep users, cohorts, interests, token transactions, and social outbox records across local restarts, point `COHORT15_PERSISTENCE_FILE` at a JSON state file:

```bash
COHORT15_PERSISTENCE_FILE=.local/cohort15-state.json npm run dev
```

If the file does not exist, the app creates it and seeds the demo users once with grant transactions. To reset local durable state, stop the server and delete the configured JSON file.

## MVP Flow

1. Start the app with `npm run dev`.
2. Open `/cohorts/new` and create a cohort as `user-creator`.
3. Confirm `/cohorts` and `/cohorts/:id` show public cohort details but hide the private online link while the event is open.
4. Show interest as `user-participant`; this uses 1 participant token while quorum is pending.
5. When interest reaches quorum, the event becomes active, creator and participant tokens are used, and the private link is visible only to the creator and committed participants.
6. Use `POST /admin/expire-cohorts?now=<ISO date>` to process overdue open cohorts that did not reach quorum. Expiry returns creator and participant tokens through refund transactions.
7. Check `/dashboard` for creator and participant cohort status, token summaries, and authorized unlocked links.

Creators can optionally provide an event image URL/path. Blank image fields use the local default image at `/assets/default-cohort.png`.

Creating a cohort also writes a local social-promotion outbox record with public-safe content. It includes public event fields and the public cohort URL, and it excludes the private online link.

## MVP Boundary

Build now: demo/auth path, token ledger, admin/demo token grants, create cohort, show interest, quorum unlock, expiry/refund, hidden private links before unlock, feed/detail pages, dashboards, and a local social-promotion outbox.

Post-MVP: USD token sales, real external social posting, chat, profiles, reputation, AI matching, waitlists, calendar integrations, moderation tooling, and in-person events. The first documented token package assumptions are `$6` for 6 tokens and `$12` for 14 tokens.

## Known Assumptions

- Persistence is in-memory for the MVP. Restarting the dev server resets demo data.
- Auth is represented by demo user IDs until a real provider is selected.
- The admin expiry endpoint is a local/dev trigger, not a production scheduler or authorization model.
- Private links stay hidden for open cohorts. Active cohort links are visible only to the creator and committed participants.
- Social promotion is local outbox generation only; real external posting is intentionally out of scope for this MVP.

## Agent Workflow

The repo still includes the bounded agent workflow files. Use `start.txt` for routed work, `tasks.json` as the canonical task ledger, and `agent/progress/task-status.md` as the readable status view.

`npm run check` also verifies that resolved feedback issues in `agent/feedback/issue-index.md` are reflected in `agent/knowledge/index.md`. If that guardrail fails after issue resolution, update the knowledge index with the reusable context before handoff.

Agent managers should commit successful completed task or issue waves after verification and tracker updates. Worker agents should not commit unless the manager explicitly assigns that responsibility.
