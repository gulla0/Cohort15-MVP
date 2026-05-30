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

### 2026-05-30 08:51

User Feedback:
- Resolve all issues in the feedback section.

Issue Mapping:
- Existing ISSUE-001 resolved.
- Existing ISSUE-002 resolved.

Reasoning:
- The two issues overlapped on create/detail/feed/dashboard surfaces, so they were resolved in one sequential wave.
- ISSUE-001 changes keep backend ledger semantics intact while simplifying user-facing token language.
- ISSUE-002 uses URL/path image support and the provided local PNG as the default, avoiding upload/storage scope expansion.

Artifacts Updated:
- Product source and tests for validation, create, feed/detail, dashboards, styles, README, and asset serving.
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-001-mvp-flow-ux-repair/*`
- `agent/feedback/issues/ISSUE-002-event-images/*`

### 2026-05-30 09:10

User Feedback:
- Both dashboards should be on the same page instead of split across two dashboard destinations.
- Navigation options should be on the other end of the page because their current placement beside the app name is confusing.

Issue Mapping:
- New ISSUE-003: Combine Dashboards and Separate Navigation.

Reasoning:
- This is a distinct dashboard/navigation usability issue, not a duplicate of the earlier dashboard availability feedback.
- The implementation touches shared topbar markup and dashboard route/rendering behavior, so it should be tracked as one issue with two local tasks.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-003-combined-dashboard-navigation/*`

### 2026-05-30 09:51

User Feedback:
- The dashboard repeats token information and does not need that repetition.
- Token sections should be Available, In use, and Used; Returned should not be shown.
- `Creator dashboard` and `user dashboard` wording is not user-friendly.
- Dashboard page needs a general user-flow review.
- User confirmed content-based naming direction: `My Cohorts`, `My Events`, or `Dashboard` depending on what the page contains.
- User proposed created cohorts, interested cohorts, and active cohorts with schedules as a clearer content model.

Issue Mapping:
- New ISSUE-004: Improve Dashboard Information Architecture and Language.

Reasoning:
- This feedback builds on ISSUE-003's combined dashboard but is not a duplicate. ISSUE-003 addressed route/navigation structure; this issue addresses the combined dashboard's content hierarchy, labels, and token presentation.
- The requested token presentation is UI copy/presentation work. Internal ledger refund accounting should remain intact.
- Active cohorts and schedules should likely come first because they are more time-sensitive than passive created/interested lists.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-004-dashboard-information-architecture/*`

### 2026-05-30 10:06

User Feedback:
- Assume the role of feedback resolver and resolve the available issues.

Issue Mapping:
- Existing ISSUE-004 resolved.

Reasoning:
- ISSUE-004 was the only issue still marked not_started in the feedback index.
- The changes are presentation-focused: dashboard UI now avoids duplicated token details and role-heavy labels while preserving ledger refund accounting and existing route compatibility.
- The combined dashboard hierarchy now leads with account token state, then active cohorts and schedule, then created cohorts and interested cohorts.

Artifacts Updated:
- `src/ui/dashboards.mjs`
- `src/ui/styles.css`
- `src/ui/home.mjs`
- `tests/dashboards.test.mjs`
- `tests/mvp-verification.test.mjs`
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-004-dashboard-information-architecture/*`
