# Change Log

Append-only implementation log.

### 2026-05-30 00:41 EDT

Task:
- T005 Build public event feed and detail visibility

Files Changed:
- `src/services/event-browsing.mjs`
- `src/server/app.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- `tests/event-browsing.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a public event browsing service that lists open/active cohorts and serializes detail views through the locked-link visibility policy.
- Added `GET /cohorts` and `GET /cohorts/:id` routes with feed/detail renderers and navigation updates.
- Added tests confirming public feed/detail pages do not leak locked links and active links are visible to authorized viewers.
- Marked T005 done and unblocked T006.

Verification:
- `npm run check` passed.

### 2026-05-30 00:33 EDT

Task:
- T004 Build create cohort flow

Files Changed:
- `src/services/create-cohort.mjs`
- `src/server/app.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- `tests/create-cohort.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a create cohort service that builds valid open events, requires an existing creator, and records a 2-token creator hold through the ledger.
- Added a demo-backed `GET/POST /cohorts/new` route with form rendering, validation error surfacing, and success rendering that does not expose the private link.
- Added create-flow tests for token holds, default expiry, insufficient-token rejection, validation failures, and UI response behavior.
- Marked T004 done and unblocked T005 and T008.

Verification:
- `npm run check` passed.

### 2026-05-30 00:28 EDT

Task:
- T003 Add persistence schema and token ledger primitives

Files Changed:
- `src/persistence/schema.mjs`
- `src/persistence/store.mjs`
- `src/persistence/repositories.mjs`
- `src/persistence/token-ledger.mjs`
- `src/persistence/seeds.mjs`
- `tests/persistence-ledger.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added explicit persistence schema metadata for users, events, event interests, token transactions, and social posts, including a future purchase source path.
- Added dependency-free in-memory repositories that validate domain records and enforce unique event interest per user/event.
- Added token ledger primitives for grants, holds, consumes, refunds, insufficient-token checks, and derived available/held balances.
- Added demo seed users with starting tokens issued through grant transactions.
- Marked T003 done and unblocked T004.

Verification:
- `npm run check` passed.

### 2026-05-30 00:18 EDT

Task:
- T002 Implement domain types and validation rules

Files Changed:
- `src/domain/constants.mjs`
- `src/domain/models.mjs`
- `src/domain/validation.mjs`
- `tests/domain-validation.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added spec-aligned domain constants for event categories, statuses, recurrence, social post status, interest status, token transaction type, and social platform values.
- Added JSDoc domain model typedefs for Event, EventInterest, TokenTransaction, and SocialPost.
- Added domain validators, 14-day default expiry calculation, event builder defaults, and a locked-link serializer that hides private links for open events.
- Added focused domain tests for enum alignment, event validation, expiry defaults, link visibility, and related object validators.
- Marked T002 done and unblocked T003.

Verification:
- `npm run check` passed.

### 2026-05-30 00:13 EDT

Task:
- T001 Scaffold runnable app foundation

Files Changed:
- `package.json`
- `README.md`
- `src/domain/constants.mjs`
- `src/persistence/README.md`
- `src/server/app.mjs`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- `scripts/lint.mjs`
- `tests/foundation.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a runnable dependency-free Node.js web app foundation with clear domain, persistence, server, and UI directories.
- Added baseline lint and Node test runner scripts.
- Replaced the starter README with Cohort15 setup, run, verification, source layout, and MVP boundary notes.
- Marked T001 done and unblocked T002.

Verification:
- `npm run check` passed.
- `npm run dev` started at `http://localhost:3000`.
- In-app browser verified the page title, H1, and scaffold sections.

### 2026-05-30 00:02 EDT

Task:
- Clarify MVP boundary after user discussion

Files Changed:
- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/knowledge/index.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`

Summary:
- Updated setup artifacts so MVP includes all core cohort behavior, admin/demo token grants, and a social outbox.
- Moved USD token sales and real external social posting to post-MVP / urgent-next.
- Recorded initial token package assumptions: `$6` for 6 tokens and `$12` for 14 tokens.

Verification:
- `python3 -m json.tool tasks.json` passed.
- Custom schema-required-field and dependency-reference check passed for 10 tasks.
- Searched planning artifacts for payment/social wording and confirmed USD sales plus real external social posting are marked post-MVP.

### 2026-05-29 23:50 EDT

Task:
- Setup/bootstrap from Cohort15 MVP spec

Files Changed:
- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/knowledge/index.md`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`

Summary:
- Replaced starter placeholders with Cohort15-specific planning artifacts and a small executable MVP task graph.
- Recorded product assumptions, context routes, and first implementation handoff.

Verification:
- `python3 -m json.tool tasks.json` passed.
- Custom schema-required-field and dependency-reference check passed for 10 tasks.
- Task IDs were checked across `tasks.json`, `atomic-task-graph.md`, and `agent/progress/task-status.md`.

## Template

### YYYY-MM-DD HH:MM

Task:
- TODO

Files Changed:
- TODO

Summary:
- TODO

Verification:
- TODO
