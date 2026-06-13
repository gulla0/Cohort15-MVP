# ISSUE-007 Change Log

## 2026-06-13

- Created issue-local planning artifacts.

## 2026-06-12 22:08 EDT

- Added public event capacity summaries in `src/services/event-browsing.mjs`.
- Redesigned public cohort feed cards in `src/ui/cohorts.mjs` and `src/ui/styles.css` around compact imagery, status/capacity labels, and stable Starts/Open spots/Quorum decision fields.
- Added browser-local time enhancement for cohort time elements with a UTC server-rendered fallback for non-JavaScript contexts.
- Added focused event browsing assertions for capacity summaries, card decision content, and local-time fallback markup.
- Verified with focused tests, `npm run lint`, browser smoke at desktop and 390px mobile, and `npm run check`.
