# Cohort15 Lofi MVP

This branch prepares a lightweight public validation product before the authenticated production MVP.

Visitors will be able to create cohort requests or show interest with a mandatory private email. A cohort's approved meeting link becomes public at quorum. Listings collect interest for seven days and remain browsable afterward.

The public `/research` collection hosts Cohort15 research, essays, field notes, and written product updates. Its first article is an edited synthesis of public demand signals for small, committed groups.

## Setup Status

The complete local lofi product flow, isolated production configuration, and privacy/abuse/end-to-end launch gate are implemented and verified. External provider setup and deployment are next; no production-MVP runtime code remains in this branch.

- Product rules: `docs/cohort15-lofi-mvp-spec.md`
- Plan: `plan.md`
- Canonical task ledger: `tasks.json`
- Dependency graph: `atomic-task-graph.md`
- Current status: `agent/progress/task-status.md`
- Provider setup: `docs/human-tasks/lofi-mvp-launch.md`

Next ready task: L009.

The lofi specification and task contracts include the validation, recurrence/DST, lifecycle, ordering, concurrency, idempotency, privacy, HTTP, editorial, and deployment boundaries required for implementation without additional product decisions. `npm run check` rejects task-ledger drift and missing inputs for ready tasks.

## Intended Stack

- dependency-free Node.js 24 HTTP server and ES modules
- server-rendered HTML/CSS
- isolated Supabase Postgres project
- separate Render Web Service
- Resend transactional email
- Google Analytics measurement ID `G-LF22TLDSBV`

The lofi environment must not share a Supabase project, Render service, or credentials with the later production MVP.

## Commands

```bash
npm run dev
npm run check
npm test
npm run lint
npm start
```

The local server defaults to `http://localhost:3000`.

Production starts only when all `COHORT15_LOFI_*` values in `.env.example` are
set. It uses the separate lofi Supabase project and never falls back to local
in-memory persistence. Do not reuse credentials from another Cohort15 service;
provider setup belongs in `docs/human-tasks/lofi-mvp-launch.md`.

## Agent Workflow

Use `start.txt` for user-facing routing or `agent-starters/startNewManager.txt` when directly starting an implementation task. Managers select the next unblocked task from `tasks.json`, verify it, align every status-facing workflow artifact, and commit the completed task wave. `npm run check` rejects stale next-task summaries and task-graph statuses.

Old production tasks and resolved feedback issues were removed from the active workflow. Git history remains their archive.
