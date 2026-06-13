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

### 2026-05-30 10:13

User Feedback:
- Dashboard token information is still repeated.
- There are no separate creator tokens and participant tokens.
- All tokens are the same, so the dashboard should not divide them that way.

Issue Mapping:
- New ISSUE-005: Unify Dashboard Token Account.

Reasoning:
- The feedback maps to the combined `/dashboard` Account Tokens section, which still renders two balance panels for `Demo Creator` and `Demo Participant`.
- ISSUE-004 removed row-level token repetition and old role-token strings but did not collapse the account token panels.
- The expected fix should stay in dashboard presentation and tests unless implementation discovers a data-shape issue.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-005-unify-dashboard-token-account/*`
- `agent/knowledge/index.md`

### 2026-05-31 08:19

User Feedback:
- Activate the feedback resolver and resolve the active issue.

Issue Mapping:
- Existing ISSUE-005 resolved.

Reasoning:
- ISSUE-005 was the only issue still marked not_started in the feedback index.
- The fix stays within dashboard presentation and route data shape: `/dashboard` now receives one de-duplicated account balance and renders one Account Tokens summary.
- Ledger semantics, token costs, legacy dashboard routes, Created Cohorts, Interested Cohorts, and Active Cohorts & Schedule were preserved.

Artifacts Updated:
- `src/services/dashboards.mjs`
- `src/server/app.mjs`
- `src/ui/dashboards.mjs`
- `tests/dashboards.test.mjs`
- `tests/mvp-verification.test.mjs`
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-005-unify-dashboard-token-account/*`
- `agent/knowledge/index.md`

### 2026-06-13

User Feedback:
- Cohort creation form should keep first meeting after the two-week quorum window.
- Daily should be available as a meeting recurrence option.
- Private meeting links should only allow Google Meet, Zoom, Microsoft Teams, Discord, and Slack.
- Remove the first Creator field from cohort creation because only creators create requests.
- Cohort request cards should better show capacity decision information such as max, min, and open spots, with room for the resolver to research better UX.
- Cohort request card images are too large and should be redesigned around participant decision needs.
- Cohort request cards should show the viewer's local time.
- The cohorts page needs word-based search.

Issue Mapping:
- New ISSUE-006: Tighten Cohort Creation Form Rules.
- New ISSUE-007: Improve Cohort Cards for Participant Decisions.
- New ISSUE-008: Add Word-Based Cohort Search.

Reasoning:
- Creation-form validation, recurrence, link allowlisting, and visible creator selection share the `/cohorts/new` route and create-flow tests, so they belong in one issue.
- Card capacity, image balance, participant decision hierarchy, and local time are all part of the public feed card experience and should be resolved together with design/UX research.
- Word-based search is separate route/service filtering behavior and can be implemented independently from the card redesign.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-006-cohort-creation-form-auth-link-rules/*`
- `agent/feedback/issues/ISSUE-007-cohort-card-decision-support-local-time/*`
- `agent/feedback/issues/ISSUE-008-cohort-feed-search/*`

### 2026-06-13

User Feedback:
- Replace the word `token` with `credit` throughout the repo, both in the app and outside of it.

Issue Mapping:
- New ISSUE-009: Rename Token Terminology to Credit.

Reasoning:
- This is not a duplicate of earlier dashboard token presentation issues because it changes product vocabulary repo-wide.
- The feedback spans app code, tests, docs, planning artifacts, and agent feedback/history files, so it needs a broad migration issue with an initial audit task instead of a blind search/replace.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-009-rename-token-to-credit/*`

### 2026-06-13

User Feedback:
- Assume the role of a issue resolver and start working on the first issue.

Issue Mapping:
- Existing ISSUE-006 resolved.

Reasoning:
- ISSUE-006 was the first issue still marked `not_started` in the feedback index.
- The issue was resolved without starting T012 auth by keeping the current demo creator assumption route-side and removing the visible selector from the form.
- Backend validation now owns the provider allowlist so unsupported meeting links cannot bypass the browser UI.

Artifacts Updated:
- `src/domain/constants.mjs`
- `src/domain/validation.mjs`
- `src/server/app.mjs`
- `src/ui/create-cohort.mjs`
- tests using create/event fixtures
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-006-cohort-creation-form-auth-link-rules/*`
- `agent/knowledge/index.md`

### 2026-06-12 22:08 EDT

User Feedback:
- Initiate an issue resolver and work on the next available issue.

Issue Mapping:
- Existing ISSUE-007 resolved.

Reasoning:
- ISSUE-007 was the first issue still marked `not_started` in the feedback index.
- UX research supported keeping card content compact and comparable, with repeated decision fields in predictable positions.
- The fix stayed scoped to public event browsing, feed card UI, local-time rendering, styles, and focused tests.

Artifacts Updated:
- `src/services/event-browsing.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/styles.css`
- `tests/event-browsing.test.mjs`
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-007-cohort-card-decision-support-local-time/*`
- `agent/knowledge/index.md`

### 2026-06-13

User Feedback:
- Initiate an issue resolver and work on the next available issue.

Issue Mapping:
- Existing ISSUE-008 resolved.

Reasoning:
- ISSUE-008 was the first issue still marked `not_started` in the feedback index.
- The simplest fitting implementation is server-side query filtering through `/cohorts?q=`, keeping the dependency-free app model and preserving shareable URLs.
- Search is limited to public-safe cohort fields and runs after public status filtering, so private meeting links and non-public statuses are not exposed.

Artifacts Updated:
- `src/services/event-browsing.mjs`
- `src/server/app.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/styles.css`
- `tests/event-browsing.test.mjs`
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-008-cohort-feed-search/*`
- `agent/knowledge/index.md`
