# ISSUE-005 - Unify Dashboard Token Account

## Summary

The combined dashboard still presents token balances as separate creator and participant panels. The product uses one token ledger and one token type, so the dashboard should not imply separate creator tokens and participant tokens.

## User Impact

Users have to parse two repeated token sections even though all tokens are the same. This makes the account state feel more complicated than it is and suggests a false distinction between creator and participant token balances.

## Affected Flow

- Reviewing token availability on the combined `/dashboard` page.
- Understanding whether tokens can be used to create cohorts or show interest.

## Likely Technical Area

- `src/ui/dashboards.mjs`
- `src/services/dashboards.mjs`
- `tests/dashboards.test.mjs`
- `tests/mvp-verification.test.mjs`

## Evidence

- User feedback: "In the dashboard, the token are repeated. There are no creator tokens and participant tokens. Its all the same tokens, so there is no point for this division."
- Current combined dashboard renders `Account Tokens` with separate balance panels for `Demo Creator` and `Demo Participant`.
- ISSUE-004 removed row-level token repetition and old `creator tokens:` / `participant tokens:` copy, but it did not remove the two account-token panels in the combined dashboard.

## Scope

In scope:
- Replace the combined dashboard's split creator/participant token presentation with a single account-token presentation.
- Keep token labels focused on `Available`, `In use`, and `Used`.
- Update dashboard tests so they reject separate creator/participant token account panels.
- Preserve the underlying token ledger semantics unless a later auth/account task changes identity behavior.

Out of scope:
- Replacing the token ledger model.
- Implementing real auth or account merging.
- Changing the 2-token create cost or 1-token interest cost.
- Reworking created/interested cohort sections unless required by the token presentation.

## Notes

This issue builds on ISSUE-004. The remaining problem is not row-level token copy; it is the account-token summary implying two token buckets.
