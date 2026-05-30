# Change Log

Append-only implementation log.

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
