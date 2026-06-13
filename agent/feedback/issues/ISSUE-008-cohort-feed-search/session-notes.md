# ISSUE-008 Session Notes

## 2026-06-13

Created from user feedback requesting word-based search on the cohorts page. This was separated from card redesign because search is a distinct filtering behavior with its own route/service tests.

## 2026-06-13

Resolved ISSUE-008-T01 by adding `/cohorts?q=` server-side word search. Search matches case-insensitive words across public-safe cohort fields including title, description, category, topic, audience, skill, and additional details. The implementation keeps feed visibility restricted to open/active cohorts and never searches or renders private meeting links in public results.

Verification passed with `node --test tests/event-browsing.test.mjs`, `npm run lint`, and `npm run check`.
