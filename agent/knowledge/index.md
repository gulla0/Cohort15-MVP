# Knowledge Index

Pointer-based context router for the lofi MVP branch. Verify against code and canonical ledgers before acting.

## Authority Map

| Artifact | Purpose | Authority |
|---|---|---|
| `docs/cohort15-lofi-mvp-spec.md` | Locked observable product behavior and boundary policy | Product source |
| `plan.md` | Scope, architecture direction, phases, and risks | Planning source |
| `tasks.json` | Main task contracts and status | Canonical main task ledger |
| `atomic-task-graph.md` | Readable task dependencies | Derived planning view |
| `agent/progress/task-status.md` | Readable task state and next ready task | Derived status view |
| `agent/feedback/issue-index.md` | Feedback issue status and issue-folder routes | Canonical issue index |
| `docs/human-tasks/README.md` | Index of dashboard, credential, operational-decision, and production-verification work | Human operations index |
| `schemas/main-task.schema.json` | Main task contract shape | Task schema |
| `schemas/routed-work-request.md` | Approved role-transition request shape | Routing schema |

Historical evidence belongs in `agent/progress/session-notes.md`, `agent/progress/change-log.md`, and issue-local logs. Do not duplicate those histories here.

## Agent Workflow Routes

- User-facing entry and intent classification: `start.txt` then `agent/router/intent-router.md`.
- Setup/bootstrap: `agent-starters/startSetupManager.txt`.
- Main implementation or bounded change/fix: `agent-starters/startNewManager.txt`.
- Feedback intake: `agent-starters/startFeedbackCreationManager.txt`.
- Feedback resolution: `agent-starters/startFeedbackResolutionManager.txt`.
- Workflow, knowledge, schema, tracker, or accessibility maintenance: `agent-starters/startWorkflowMaintenanceManager.txt`.
- Bounded internal execution delegated by a manager: `agent-starters/startWorker.txt`.

Managers own knowledge reconciliation: approved behavior changes must update the appropriate canonical product/design source before derived trackers or this index. `npm run check` validates structural handoffs.

## Context Routes

| Work type | Read first | Then inspect |
|---|---|---|
| Main task | `tasks.json`, `agent/progress/task-status.md` | Selected task inputs and write scope |
| Product behavior question | `docs/cohort15-lofi-mvp-spec.md` | Relevant service/UI code and tests |
| Feedback intake or resolution | `agent/feedback/issue-index.md`, `agent/feedback/README.md` | Only selected issue folders and affected code |
| Human/provider operation | `docs/human-tasks/README.md` | The one indexed checklist relevant to the operation |
| Workflow or knowledge drift | `start.txt`, this index, `agent-starters/startWorkflowMaintenanceManager.txt` | Router, starters, schemas, trackers, and workflow guard |

## Application Routes

| Area | Current files |
|---|---|
| Runtime | `src/server/app.mjs`, `src/config/runtime.mjs` |
| Domain | `src/domain/constants.mjs`, `src/domain/models.mjs`, `src/domain/validation.mjs` |
| Persistence | `src/persistence/store.mjs`, `src/persistence/repositories.mjs`, `src/persistence/supabase-postgres.mjs` |
| Create flow | `src/services/create-cohort.mjs`, `src/services/rate-limit.mjs`, `src/ui/create-cohort.mjs` |
| Browse/detail flow | `src/services/event-browsing.mjs`, `src/ui/home.mjs`, `src/ui/cohorts.mjs`, `src/ui/styles.css` |
| Interest flow | `src/services/show-interest.mjs`, `src/ui/cohorts.mjs`, `src/server/app.mjs` |
| Feedback flow | `src/services/feedback.mjs`, `src/ui/feedback-widget.mjs`, `src/server/app.mjs` |
| Email | `src/email/resend.mjs`, `src/services/notifications.mjs` |
| Editorial | `src/ui/research.mjs`, `tests/research.test.mjs` |
| Tests | `tests/*.test.mjs` |

## Reusable Decisions

- Stack remains dependency-free Node.js ES modules with server-rendered HTML.
- User-facing signal language may differ from internal `cohort` route/model names.
- Creation submits the browser timezone/absolute timestamp; `localDateTimeToInstant` handles DST gaps and ambiguity.
- Notification idempotency keys contain no raw email; quorum keys hash normalized recipient email.
- Supabase uses the server-only PostgREST adapter and isolated `cohort15_lofi_*` objects.
- Current visual implementation lives in the public UI modules and `src/ui/styles.css`; external source files listed in completed tasks are provenance, not active portable dependencies.

## Safety And Isolation Traps

- Never render creator or participant emails or log raw emails, IPs, secrets, private meeting links, session tokens, or provider responses containing secrets.
- Never point lofi configuration at another Cohort15 Supabase project or Render service.
- Public meeting links remain visible from quorum until the final meeting ends; schedule metadata remains public throughout.
- Expiry is computed on reads; no scheduler or expiry email is required.
- Human dashboard, credential, DNS, operational-decision, and production-verification work must be indexed under `docs/human-tasks/`.

## Current Pointers

- Main status and next task: `agent/progress/task-status.md`.
- Current blockers: `agent/progress/blockers.md`.
- Feedback backlog: `agent/feedback/issue-index.md`.
- Human operations: `docs/human-tasks/README.md`.
