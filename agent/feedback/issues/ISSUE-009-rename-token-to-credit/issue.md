# ISSUE-009 - Rename Token Terminology to Credit

## Summary

The product should stop using the word `token` and use `credit` instead throughout the repository, including the app UI and non-app artifacts.

## User Impact

The current vocabulary does not match the intended product language. Users and future contributors see `token` across screens, docs, tests, plans, and agent workflow files, which creates inconsistent terminology and makes future product messaging harder to align.

## Affected Flow

- User-facing app copy for creating cohorts, showing interest, dashboards, refunds, purchases, and balances.
- Internal domain/service/test names where terminology is exposed or expected by tests.
- Repository documentation, planning artifacts, and feedback workflow artifacts.

## Likely Technical Area

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

## Evidence

- User feedback: "I want the word token to be removed from the repo and replaced with the word credit. This should happen throughout the repo both in the app and the outside of it."
- Repository search found hundreds of `token` references across source, tests, README, spec, planning files, task ledgers, and resolved feedback artifacts.
- Current code has domain constants and ledger concepts named around `TOKEN_TRANSACTION_TYPES`, `CREATE_EVENT_TOKEN_COST`, and `SHOW_INTEREST_TOKEN_COST`.

## Scope

In scope:
- Replace user-facing `token`/`tokens` wording with `credit`/`credits`.
- Rename tests, docs, specs, planning artifacts, and feedback artifacts so repo language consistently uses credits.
- Rename internal code identifiers where practical, especially constants, service names, test descriptions, and ledger-facing terms.
- Preserve behavior: creators use 2 credits, participants use 1 credit, held credits are returned if quorum is not met, and consumed if quorum is met.
- Update tests to assert credit terminology and reject visible token wording.

Out of scope:
- Changing balances, costs, ledger accounting, purchase pricing, or refund semantics.
- Introducing a real payment provider.
- Removing historical Git commit messages.
- Rewriting external package names or third-party terminology if any appears and should remain vendor-specific.

## Notes

This is intentionally broad. The resolver should plan the migration carefully because a naive search/replace may break code identifiers, JSON state compatibility, or historical issue evidence. It is acceptable to keep compatibility aliases internally if needed, but visible app and repository language should converge on `credit`.
