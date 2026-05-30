# Feedback Session Notes

Append-only feedback intake and resolution notes.

## Template

### YYYY-MM-DD HH:MM

User Feedback:
- TODO

Issue Mapping:
- new / existing / duplicate

Reasoning:
- TODO

Artifacts Updated:
- TODO

### 2026-05-30 08:45

User Feedback:
- Current frontend is very weak.
- Core MVP flows should be checked end to end; user currently cannot show interest in events.
- Replace wording like staking with simple token language: use 2 tokens to start cohort, use 1 token to show interest.
- The banner may say all tokens are returned if quorum is not met.
- Calendar should not allow passed dates and should only allow dates after the two-week time limit.
- Navigation is weird; participant and creator dashboard availability is unclear.
- Event creators should be able to add an image, with the attached image as the default.

Issue Mapping:
- New ISSUE-001: Repair MVP Flow UX.
- New ISSUE-002: Add Event Images.

Reasoning:
- Flow/copy/date/navigation feedback shares a user journey and should be resolved together because the fixes overlap in the MVP UI and route tests.
- Event imagery touches the domain model, default asset serving, create form, and feed/detail/dashboard rendering, so it should be tracked separately.
- Browser intake reproduced the interest failure as a UI default problem: the interest form selected `Demo Creator`, triggering the existing creator self-interest rejection.
- Browser/source intake confirmed no `min` on the first meeting input and no backend minimum date rule.
- Repository search found no existing event image field.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-001-mvp-flow-ux-repair/*`
- `agent/feedback/issues/ISSUE-002-event-images/*`
