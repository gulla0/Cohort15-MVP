# Cohort15 MVP

Cohort15 is an online cohort-event platform. Creators stake 2 tokens to publish a cohort, participants stake 1 token to show interest, and quorum unlocks the private online link.

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

This executes the repository lint check and the Node test suite.

## MVP Boundary

Build now: demo/auth path, token ledger, admin/demo token grants, create cohort, show interest, quorum unlock, expiry/refund, hidden private links before unlock, feed/detail pages, dashboards, and a local social-promotion outbox.

Post-MVP: USD token sales, real external social posting, chat, profiles, reputation, AI matching, waitlists, calendar integrations, moderation tooling, and in-person events.

## Agent Workflow

The repo still includes the bounded agent workflow files. Use `start.txt` for routed work, `tasks.json` as the canonical task ledger, and `agent/progress/task-status.md` as the readable status view.
