# ISSUE-011 Session Notes

## 2026-06-16

Created from user feedback asking for semi-relevant cohort search matches. This is related to resolved ISSUE-008 but tracked separately because it changes search relevance and ranking rather than adding the original search control.

## 2026-06-16

Resolved ISSUE-011-T01 by replacing boolean public-field search filtering with deterministic search scoring in `src/services/event-browsing.mjs`. Exact token matches rank first, substring matches follow, and small edit-distance matches allow typo-tolerant results such as `tost` surfacing a `test` cohort lower in the list. Search still requires every query word to match a public-safe field and still excludes private meeting links and non-public cohorts.
