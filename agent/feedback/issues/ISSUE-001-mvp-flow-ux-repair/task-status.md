# Task Status - ISSUE-001

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-001-T01 | Repair participant interest defaults and success path | not_started | yes | Browser intake found default selected user is creator and immediate submit fails. | Keep creator rejection intact. |
| ISSUE-001-T02 | Simplify token wording and refund messaging | not_started | yes | UI source contains staking/held/consumed wording. | Backend ledger terms can remain internal. |
| ISSUE-001-T03 | Enforce first meeting after quorum window | not_started | yes | Browser/source check found no `min` on first meeting input and no backend minimum date validation. | Interpret as first meeting after `createdAt + 14 days`. |
| ISSUE-001-T04 | Clarify MVP navigation and dashboard access | not_started | no | Browser intake found home lacks dashboard links and page nav is inconsistent. | Depends on flow/copy decisions from T01-T02. |
