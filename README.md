# Cohort15 Lofi MVP

This branch prepares a lightweight public validation product before the authenticated production MVP.

Visitors will be able to create cohort requests or show interest with a mandatory private email. A cohort's approved meeting link becomes public at quorum. Listings collect interest for seven days and remain browsable afterward.

## Setup Status

The clean lofi shell, domain policy, and isolated persistence layer are complete. Anonymous public product flows begin with L003; no production-MVP runtime code remains in this branch.

- Product rules: `docs/cohort15-lofi-mvp-spec.md`
- Plan: `plan.md`
- Canonical task ledger: `tasks.json`
- Dependency graph: `atomic-task-graph.md`
- Current status: `agent/progress/task-status.md`
- Provider setup: `docs/human-tasks/lofi-mvp-launch.md`

Next ready task: L003.

The lofi specification and L001–L010 task contracts include the validation, recurrence/DST, lifecycle, ordering, concurrency, idempotency, privacy, HTTP, and deployment boundaries required for implementation without additional product decisions. `npm run check` rejects task-ledger drift and missing inputs for ready tasks.

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

## Agent Workflow

Use `start.txt` for user-facing routing or `agent-starters/startNewManager.txt` when directly starting an implementation task. Managers select the next unblocked task from `tasks.json`, verify it, align every status-facing workflow artifact, and commit the completed task wave. `npm run check` rejects stale next-task summaries and task-graph statuses.

Old production tasks and resolved feedback issues were removed from the active workflow. Git history remains their archive.
