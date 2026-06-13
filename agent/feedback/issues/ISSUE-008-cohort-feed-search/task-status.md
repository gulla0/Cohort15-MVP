# ISSUE-008 Task Status

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-008-T01 | Add public cohort word search | done | yes | `node --test tests/event-browsing.test.mjs`, `npm run lint`, and `npm run check` passed. | Added `/cohorts?q=` search across public-safe cohort fields with clear no-results UI and preserved visibility rules. |
