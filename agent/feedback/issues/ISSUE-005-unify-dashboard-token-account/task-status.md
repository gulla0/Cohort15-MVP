# Task Status - ISSUE-005

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-005-T01 | Unify dashboard token account presentation | done | yes | `npm test -- tests/dashboards.test.mjs tests/mvp-verification.test.mjs`, `npm run lint`, and `npm run check` passed; browser smoke verified `/dashboard`. | Combined `/dashboard` now renders one Account Tokens summary from a de-duplicated account balance instead of split Demo Creator/Demo Participant token panels. |
