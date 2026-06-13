# ISSUE-004 - Improve Dashboard Information Architecture and Language

## Summary

The combined dashboard repeats credit information, includes an unnecessary `Returned` credit section, and uses role labels like `Creator dashboard` and `Participant dashboard` that do not communicate the page purpose in a user-friendly way.

## User Impact

Users have to parse repeated credit states and product-internal role language before understanding what the dashboard is for or what to do next.

## Affected Flow

- Returning to the dashboard after creating a cohort.
- Returning to the dashboard after showing interest in a cohort.
- Reviewing credit availability and cohort participation state from the combined `/dashboard` page.

## Likely Technical Area

- `src/ui/dashboards.mjs`
- `src/services/dashboards.mjs`
- `src/ui/styles.css`
- `tests/dashboards.test.mjs`
- `tests/mvp-verification.test.mjs`

## Evidence

User feedback on 2026-05-30:
- "The dashboard has repeated info like credits etc. No need for that."
- "The credits sections should be available, in use, used. No need for returned."
- "The words creator and user dashboard are not good. Think of better ways to communicate the idea better and more user friendly."
- "In general there should be a user flow review for the dashboard page."
- User confirmed the direction: "`My Cohorts` / `My Events` / `Dashboard` depending on what the page actually contains."
- User proposed a clearer dashboard content model: created cohorts, interested cohorts, and active cohorts with schedules.

Current code evidence:
- `src/ui/dashboards.mjs` renders `Returned` in `balancePanel`.
- `src/ui/dashboards.mjs` repeats per-row credit copy with `creator credits: ... returned` and `participant credits: ... returned`.
- `src/ui/dashboards.mjs` renders `Creator dashboard` and `Participant dashboard` as page/panel labels.

## Scope

In scope:
- Remove repeated credit details from dashboard content where the balance summary already covers the same concept.
- Limit the credit summary sections to `Available`, `In use`, and `Used`.
- Replace dashboard role labels with friendlier page sections based on content, such as `My Cohorts` and `My Events`.
- Consider section labels and hierarchy around `Active Cohorts & Schedule`, `Created Cohorts`, and `Interested Cohorts`.
- Review and adjust the dashboard page hierarchy so a user can quickly understand account state, cohort ownership, event interest, and next actions.
- Update tests that assert old dashboard labels or credit copy.

Out of scope:
- Replacing the credit ledger model or refund accounting.
- Implementing durable persistence, real auth, purchases, or analytics.
- Redesigning navigation outside the dashboard flow unless needed for dashboard entry/return wording.
- Changing cohort creation or interest business rules.

## Notes

This issue should preserve backend ledger semantics. The request is about what the dashboard communicates, not whether refund transactions continue to exist internally.

Preferred information architecture direction after discussion:
- Lead with active cohorts and schedules because those are the most time-sensitive.
- Follow with created cohorts and interested cohorts as content-based sections.
- Avoid role-heavy section names like `Creator dashboard` and `Participant dashboard`.
