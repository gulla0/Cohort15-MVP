# Task Graph - ISSUE-001

## Issue Summary

Repair the MVP frontend so creators and participants can complete the core create, browse, interest, unlock, and dashboard journey without knowing backend/demo-user details.

## Tasks

- ISSUE-001-T01 Repair participant interest defaults and success path
  - Depends on: none
- ISSUE-001-T02 Simplify token wording and refund messaging
  - Depends on: none
- ISSUE-001-T03 Enforce first meeting after quorum window
  - Depends on: none
- ISSUE-001-T04 Clarify MVP navigation and dashboard access
  - Depends on: ISSUE-001-T01, ISSUE-001-T02

## Dependency Order

```text
ISSUE-001-T01
ISSUE-001-T02
ISSUE-001-T03
ISSUE-001-T04
```

## Expected Write Scopes

| Task | Files Expected | Overlap Risk |
|---|---|---|
| ISSUE-001-T01 | `src/ui/cohorts.mjs`, `src/server/app.mjs`, interest/MVP tests | medium |
| ISSUE-001-T02 | UI copy modules and affected tests | low |
| ISSUE-001-T03 | validation/create modules and tests | medium |
| ISSUE-001-T04 | page navigation modules, styles, dashboard/MVP tests | medium |

## Next Unblocked Tasks

- None. All issue tasks are done.
