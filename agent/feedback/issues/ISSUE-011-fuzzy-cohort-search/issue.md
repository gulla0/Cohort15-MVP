# ISSUE-011 - Add Fuzzy Cohort Search Matches

## Summary

The cohort search should return close or semi-relevant matches, not only exact word matches. Exact matches should stay ranked first, while less exact fuzzy matches should still appear lower in the result list.

## User Impact

Users can miss relevant cohorts because of minor typos, spelling variation, or partial wording. For example, a search for `tost` should still surface a `test` cohort, with exact `test` matches ranked above weaker matches.

## Affected Flow

- Public cohort discovery at `/cohorts`.
- Search requests through `/cohorts?q=...`.
- Ranking and display of public cohort cards.

## Likely Technical Area

- `src/services/event-browsing.mjs`
- `src/server/app.mjs`
- `src/ui/cohorts.mjs`
- `tests/event-browsing.test.mjs`
- `tests/mvp-verification.test.mjs`

## Evidence

- User feedback: search should include semi-relevant matches.
- User example: searching `tost` should still show a `test` cohort.
- User feedback: exact matches should show on top, less relevant matches at the bottom.
- ISSUE-008 already added exact public-safe word search; this issue extends that behavior with fuzzy relevance and ranking.

## Scope

In scope:
- Add dependency-free fuzzy matching suitable for current MVP search.
- Rank exact word or strong substring matches ahead of weaker fuzzy matches.
- Keep search limited to public-safe cohort fields.
- Preserve open/active public visibility rules and private-link protection.
- Add focused tests for typo matching, exact-first ranking, and no private-link leakage.

Out of scope:
- Adding a hosted search service.
- Adding heavyweight search dependencies unless the project stack changes.
- Searching private meeting links or non-public cohorts.
- Personalized recommendations or AI matching.

## Notes

The resolver should keep the matching predictable and testable. A simple edit-distance or token-similarity approach is likely enough for this app until a production search backend is selected.
