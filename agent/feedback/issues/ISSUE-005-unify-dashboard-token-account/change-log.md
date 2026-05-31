# Change Log - ISSUE-005

Append-only.

### 2026-05-30 10:13 EDT

- Created ISSUE-005 from user feedback about repeated dashboard token panels and false creator/participant token division.
- Added one issue-local implementation task to unify the combined dashboard Account Tokens presentation.

### 2026-05-31 08:19 EDT

- Added a combined dashboard service result that returns one de-duplicated account token balance for the combined `/dashboard` route.
- Replaced split Account Tokens balance panels with one Available/In use/Used summary.
- Updated dashboard and MVP verification tests to reject Demo Creator/Demo Participant token account headings and duplicate token state panels.
- Verified with focused tests, lint, full check, and a browser smoke check of `/dashboard`.
