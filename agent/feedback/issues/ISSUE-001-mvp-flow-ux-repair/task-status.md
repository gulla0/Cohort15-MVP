# Task Status - ISSUE-001

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-001-T01 | Repair participant interest defaults and success path | done | yes | `npm run check` passed; browser smoke verified create -> detail selected `user-participant` -> interest -> quorum unlock. | Creator rejection remains tested. |
| ISSUE-001-T02 | Simplify token wording and refund messaging | done | yes | `npm run check` passed; UI/README copy now uses simple token wording and refund reassurance. | Backend ledger terms remain internal. |
| ISSUE-001-T03 | Enforce first meeting after quorum window | done | yes | `npm run check` passed with domain/create tests for earliest date validation and create form min rendering. | First meeting must be after `createdAt + 14 days`. |
| ISSUE-001-T04 | Clarify MVP navigation and dashboard access | done | yes | `npm run check` passed; browser smoke verified success next-step links and dashboard navigation. | Home now presents MVP actions and dashboard access. |
