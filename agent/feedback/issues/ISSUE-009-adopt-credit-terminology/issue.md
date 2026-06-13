# ISSUE-009 - Adopt Credit Terminology

## Summary

The product language now uses `credit` and `credits` throughout the repository, including app UI, source identifiers, tests, documentation, planning artifacts, and feedback workflow artifacts.

## User Impact

Users and future contributors now see one consistent vocabulary for Cohort15 balances, costs, holds, refunds, and purchase-adjacent flows.

## Affected Flow

- User-facing app copy for creating cohorts, showing interest, dashboards, refunds, purchases, and balances.
- Internal domain/service/test names where terminology is exposed or asserted.
- Repository documentation, planning artifacts, and feedback workflow artifacts.
- Durable local JSON state loading for existing development snapshots.

## Technical Area

- `src/domain/*`
- `src/persistence/*`
- `src/services/*`
- `src/server/*`
- `src/ui/*`
- `tests/*`
- `README.md`
- `docs/cohort15-mvp-spec-v3.md`
- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/**/*.md`

## Resolution

- Replaced visible app copy with credit terminology.
- Renamed ledger-facing app identifiers, constants, validators, repositories, tests, and the persistence ledger module to credit terminology.
- Renamed docs, planning ledgers, feedback artifacts, progress files, and knowledge index language to credits.
- Added read normalization for older local JSON state keys and seed grant source values so existing development snapshots load without duplicate seed grants, then persist in the current credit-shaped format.

## Scope Preserved

- Creators still use 2 credits to start a cohort.
- Participants still use 1 credit to show interest.
- Held credits are returned if quorum is not met and consumed if quorum is met.
- Ledger behavior, costs, refunds, and purchase assumptions are unchanged.

## Verification

- Repository search confirms the previous vocabulary is no longer present as a literal.
- Focused app tests passed.
- `npm run check:workflow` passed.
- `npm run check` passed.
