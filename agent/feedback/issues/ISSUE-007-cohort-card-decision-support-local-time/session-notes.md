# ISSUE-007 Session Notes

## 2026-06-13

Created from user feedback about cohort request cards after publication. This was separated from create-form validation because it is a participant-facing discovery and decision-support issue.

## 2026-06-12 22:08 EDT

Resolved ISSUE-007-T01.

Read:
- `agent/feedback/issues/ISSUE-007-cohort-card-decision-support-local-time/*`
- `src/services/event-browsing.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/styles.css`
- `tests/event-browsing.test.mjs`
- `tests/mvp-verification.test.mjs`

Research used:
- Nielsen Norman Group's card guidance: cards are useful for short grouped summaries, but repeated comparable information should be predictable because cards can be less scannable than list-like layouts.

Decided:
- Keep the feed card pattern but make decision-critical fields stable and repeated: Starts, Open spots, and Quorum.
- Add capacity metadata in the browsing service so UI cards do not infer participant counts from presentation-only state.
- Reduce feed image dominance by switching desktop cards to a compact thumbnail column while preserving a stacked mobile layout.
- Render UTC time as the no-JavaScript fallback and enhance browser-side to the viewer's local timezone with an accessible timezone label.

Verification:
- `node --test tests/event-browsing.test.mjs tests/mvp-verification.test.mjs` passed.
- Browser smoke passed on `/cohorts` at desktop and 390px mobile with no horizontal overflow.
- `npm run lint` passed.
- `npm run check` passed with 49 tests.
