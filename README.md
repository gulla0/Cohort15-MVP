# Cohort15 Lofi MVP

This branch prepares a lightweight public validation product before the authenticated production MVP.

Visitors will be able to create cohort requests or show interest with a mandatory private email. A cohort's approved meeting link becomes public at quorum. Listings collect interest for seven days and remain browsable afterward.

## Setup Status

Planning is complete; product implementation has not started. The current source still contains reusable production-MVP code that L001–L008 will simplify task by task.

- Product rules: `docs/cohort15-lofi-mvp-spec.md`
- Plan: `plan.md`
- Canonical task ledger: `tasks.json`
- Dependency graph: `atomic-task-graph.md`
- Current status: `agent/progress/task-status.md`
- Provider setup: `docs/human-tasks/lofi-mvp-launch.md`

Next ready task: L001.

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

Use `start.txt` for user-facing routing or `agent-starters/startNewManager.txt` when directly starting an implementation task. Managers select the next unblocked task from `tasks.json`, verify it, align trackers, and commit the completed task wave.

Old production tasks and resolved feedback issues were removed from the active workflow. Git history remains their archive.
