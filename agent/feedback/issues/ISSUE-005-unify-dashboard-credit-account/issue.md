# ISSUE-005 - Unify Dashboard Credit Account

## Summary

The combined dashboard still presents credit balances as separate creator and participant panels. The product uses one credit ledger and one credit type, so the dashboard should not imply separate creator credits and participant credits.

## User Impact

Users have to parse two repeated credit sections even though all credits are the same. This makes the account state feel more complicated than it is and suggests a false distinction between creator and participant credit balances.

## Affected Flow

- Reviewing credit availability on the combined `/dashboard` page.
- Understanding whether credits can be used to create cohorts or show interest.

## Likely Technical Area

- `src/ui/dashboards.mjs`
- `src/services/dashboards.mjs`
- `tests/dashboards.test.mjs`
- `tests/mvp-verification.test.mjs`

## Evidence

- User feedback: "In the dashboard, the credit are repeated. There are no creator credits and participant credits. Its all the same credits, so there is no point for this division."
- Current combined dashboard renders `Account Credits` with separate balance panels for `Demo Creator` and `Demo Participant`.
- ISSUE-004 removed row-level credit repetition and old `creator credits:` / `participant credits:` copy, but it did not remove the two account-credit panels in the combined dashboard.

## Scope

In scope:
- Replace the combined dashboard's split creator/participant credit presentation with a single account-credit presentation.
- Keep credit labels focused on `Available`, `In use`, and `Used`.
- Update dashboard tests so they reject separate creator/participant credit account panels.
- Preserve the underlying credit ledger semantics unless a later auth/account task changes identity behavior.

Out of scope:
- Replacing the credit ledger model.
- Implementing real auth or account merging.
- Changing the 2-credit create cost or 1-credit interest cost.
- Reworking created/interested cohort sections unless required by the credit presentation.

## Notes

This issue builds on ISSUE-004. The remaining problem is not row-level credit copy; it is the account-credit summary implying two credit buckets.
