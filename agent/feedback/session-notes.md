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

### 2026-06-16

User Feedback:
- The cohort request form placeholder text is too dark; it should be very light and disappear when the user clicks into the field.
- The Buy Credits button needs to align with the other navbar options.

Issue Mapping:
- New ISSUE-013: Lighten Create Form Placeholders.
- New ISSUE-014: Align Buy Credits Navigation.

Reasoning:
- ISSUE-013 is related to resolved ISSUE-010 placeholder guidance, but not a duplicate because it concerns placeholder contrast and focus behavior.
- ISSUE-014 is related to resolved ISSUE-012 Buy Credits placeholder work, but not a duplicate because it concerns visual alignment of the existing nav item.
- Both issues are UI-focused and can be resolved independently without adding feedback tasks to the main task ledger.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-013-create-form-placeholder-contrast-focus/*`
- `agent/feedback/issues/ISSUE-014-buy-credits-nav-alignment/*`
- `agent/knowledge/index.md`

### 2026-06-16

User Feedback:
- Initialize a feedback resolver and start resolving the first available unresolved issue.

Issue Mapping:
- Existing ISSUE-012 resolved.

Reasoning:
- ISSUE-012 was the first `not_started` issue in the feedback index after ISSUE-011.
- The fix creates discovery for the future credit purchase flow without implementing payment, credit grants, purchase transactions, or provider selection.
- The shared topbar keeps primary navigation consistent across home, feed/detail, create, and dashboard surfaces.

Artifacts Updated:
- `src/ui/home.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/dashboards.mjs`
- `src/server/app.mjs`
- `src/ui/styles.css`
- `tests/foundation.test.mjs`
- `tests/dashboards.test.mjs`
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-012-buy-credits-nav-placeholder/*`
- `agent/knowledge/index.md`

### 2026-06-16

User Feedback:
- Initialize a feedback resolver and start resolving the first available unresolved issue.

Issue Mapping:
- Existing ISSUE-011 resolved.

Reasoning:
- ISSUE-011 was the first `not_started` issue in the feedback index after ISSUE-010.
- The fix builds on ISSUE-008 search by keeping `/cohorts?q=` server-side and public-safe while changing the service filter into deterministic scoring.
- Exact token matches rank above substring matches, and small edit-distance matches allow typo-tolerant results such as `tost` returning a `test` cohort lower in the list.

Artifacts Updated:
- `src/services/event-browsing.mjs`
- `tests/event-browsing.test.mjs`
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-011-fuzzy-cohort-search/*`
- `agent/knowledge/index.md`

### 2026-06-16

User Feedback:
- Initialize a feedback resolver and start resolving the first available unresolved issue.

Issue Mapping:
- Existing ISSUE-010 resolved.

Reasoning:
- ISSUE-010 was the first `not_started` issue in the feedback index.
- The two issue-local tasks overlapped on `/cohorts/new`, so they were resolved sequentially in one wave: realistic placeholders first, then local image selection.
- The local-image approach stays dependency-free and route-side: multipart uploads are validated, saved under `/assets/uploads`, and converted to the existing app-relative `imageUrl` field so downstream feed/detail/dashboard rendering remains unchanged.

Artifacts Updated:
- `src/ui/create-cohort.mjs`
- `src/ui/styles.css`
- `src/server/app.mjs`
- `src/domain/constants.mjs`
- `tests/create-cohort.test.mjs`
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-010-create-form-guidance-and-image-upload/*`
- `agent/knowledge/index.md`

### 2026-06-16

User Feedback:
- The cohort request form needs meaningful placeholders that show users what belongs in each field.
- The custom event image input should use the familiar local file-picker pattern where users click a box and choose an image from their system.
- Cohort search should include semi-relevant typo-tolerant matches, such as returning a `test` cohort for `tost`, with exact matches ranked first.
- Add a `Buy Credits` button to the nav bar as a placeholder until real payment gates are wired.

Issue Mapping:
- New ISSUE-010: Improve Create Form Guidance and Image Upload.
- New ISSUE-011: Add Fuzzy Cohort Search Matches.
- New ISSUE-012: Add Buy Credits Navigation Placeholder.

Reasoning:
- Form placeholders and image input are grouped because both affect the creator request form, but they are split into two issue-local tasks due to different implementation risk.
- Fuzzy search is related to resolved ISSUE-008 but is not a duplicate because it changes ranking and typo-tolerance beyond the existing exact word search.
- The Buy Credits nav entry is separate from T013 because the user asked for a placeholder now, not the payment implementation.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-010-create-form-guidance-and-image-upload/*`
- `agent/feedback/issues/ISSUE-011-fuzzy-cohort-search/*`
- `agent/feedback/issues/ISSUE-012-buy-credits-nav-placeholder/*`
- `agent/knowledge/index.md`

### 2026-05-30 08:45

User Feedback:
- Current frontend is very weak.
- Core MVP flows should be checked end to end; user currently cannot show interest in events.
- Replace wording like staking with simple credit language: use 2 credits to start cohort, use 1 credit to show interest.
- The banner may say all credits are returned if quorum is not met.
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
- ISSUE-001 changes keep backend ledger semantics intact while simplifying user-facing credit language.
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
- The dashboard repeats credit information and does not need that repetition.
- Credit sections should be Available, In use, and Used; Returned should not be shown.
- `Creator dashboard` and `user dashboard` wording is not user-friendly.
- Dashboard page needs a general user-flow review.
- User confirmed content-based naming direction: `My Cohorts`, `My Events`, or `Dashboard` depending on what the page contains.
- User proposed created cohorts, interested cohorts, and active cohorts with schedules as a clearer content model.

Issue Mapping:
- New ISSUE-004: Improve Dashboard Information Architecture and Language.

Reasoning:
- This feedback builds on ISSUE-003's combined dashboard but is not a duplicate. ISSUE-003 addressed route/navigation structure; this issue addresses the combined dashboard's content hierarchy, labels, and credit presentation.
- The requested credit presentation is UI copy/presentation work. Internal ledger refund accounting should remain intact.
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
- The changes are presentation-focused: dashboard UI now avoids duplicated credit details and role-heavy labels while preserving ledger refund accounting and existing route compatibility.
- The combined dashboard hierarchy now leads with account credit state, then active cohorts and schedule, then created cohorts and interested cohorts.

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
- Dashboard credit information is still repeated.
- There are no separate creator credits and participant credits.
- All credits are the same, so the dashboard should not divide them that way.

Issue Mapping:
- New ISSUE-005: Unify Dashboard Credit Account.

Reasoning:
- The feedback maps to the combined `/dashboard` Account Credits section, which still renders two balance panels for `Demo Creator` and `Demo Participant`.
- ISSUE-004 removed row-level credit repetition and old role-credit strings but did not collapse the account credit panels.
- The expected fix should stay in dashboard presentation and tests unless implementation discovers a data-shape issue.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-005-unify-dashboard-credit-account/*`
- `agent/knowledge/index.md`

### 2026-05-31 08:19

User Feedback:
- Activate the feedback resolver and resolve the active issue.

Issue Mapping:
- Existing ISSUE-005 resolved.

Reasoning:
- ISSUE-005 was the only issue still marked not_started in the feedback index.
- The fix stays within dashboard presentation and route data shape: `/dashboard` now receives one de-duplicated account balance and renders one Account Credits summary.
- Ledger semantics, credit costs, legacy dashboard routes, Created Cohorts, Interested Cohorts, and Active Cohorts & Schedule were preserved.

Artifacts Updated:
- `src/services/dashboards.mjs`
- `src/server/app.mjs`
- `src/ui/dashboards.mjs`
- `tests/dashboards.test.mjs`
- `tests/mvp-verification.test.mjs`
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-005-unify-dashboard-credit-account/*`
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
- Migrate the repo to credit terminology throughout the app and non-app artifacts.

Issue Mapping:
- New ISSUE-009: Adopt Credit Terminology.

Reasoning:
- This is not a duplicate of earlier dashboard credit presentation issues because it changes product vocabulary repo-wide.
- The feedback spans app code, tests, docs, planning artifacts, and agent feedback/history files, so it needs a broad migration issue with an initial audit task instead of a blind search/replace.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-009-adopt-credit-terminology/*`

### 2026-06-13

User Feedback:
- Initiate an issue resolver and work on the next available issue.

Issue Mapping:
- Existing ISSUE-009 resolved.

Reasoning:
- ISSUE-009 was the first issue still marked `not_started` in the feedback index.
- The migration touched app source, tests, docs, planning artifacts, feedback artifacts, and progress/knowledge files, so it was handled as one sequential wave.
- Durable local JSON compatibility was the main implementation risk; older snapshot keys and seed grant source values are normalized on read and written back in the current credit-shaped format.

Artifacts Updated:
- `src/domain/*`
- `src/persistence/*`
- `src/services/*`
- `src/ui/*`
- `tests/*`
- docs, planning, progress, knowledge, and feedback artifacts
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-009-adopt-credit-terminology/*`

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
