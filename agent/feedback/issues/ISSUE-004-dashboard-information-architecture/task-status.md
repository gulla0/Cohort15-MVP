# ISSUE-004 Task Status

`tasks.json` is canonical. Keep this readable view aligned after verified changes.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-004-T01 | Remove repeated dashboard credit details | done | yes | `npm test`, `npm run lint`, and browser smoke passed. | Removed per-row creator/participant credit summaries while preserving status, schedule, quorum, and access context. |
| ISSUE-004-T02 | Simplify dashboard credit summary states | done | yes | `npm test`, `npm run lint`, and browser smoke passed. | Dashboard credit summaries now render Available, In use, and Used only; refund accounting remains internal. |
| ISSUE-004-T03 | Rename dashboard sections around user intent | done | yes | `npm test`, `npm run lint`, and browser smoke passed. | Replaced role-heavy dashboard labels with My Cohorts, My Events, Account Credits, Active Cohorts & Schedule, Created Cohorts, and Interested Cohorts. |
| ISSUE-004-T04 | Review dashboard user flow hierarchy | done | yes | `npm test`, `npm run lint`, and browser smoke passed. | Combined dashboard now reads from account credit state to active schedule, created cohorts, and interested cohorts with clearer empty states. |
