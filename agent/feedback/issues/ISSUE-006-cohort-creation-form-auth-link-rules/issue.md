# ISSUE-006 - Tighten Cohort Creation Form Rules

## Summary

The cohort creation form still exposes demo/user-selection mechanics and accepts overly broad meeting-link input. It should behave like a creator-only request flow, support daily recurrence, preserve the two-week first-meeting rule, and restrict private meeting links to approved providers.

## User Impact

Creators see an implementation detail in the first `Creator` field and can enter meeting links from unsupported or unsafe providers. Missing daily recurrence blocks legitimate cohort formats, and first-meeting timing must be visibly and reliably constrained to after the two-week quorum window.

## Affected Flow

- Creating a cohort request at `/cohorts/new`.
- Validating first meeting date, recurrence, and private online meeting link.
- Temporary demo identity behavior until the regular auth boundary is implemented.

## Likely Technical Area

- `src/domain/constants.mjs`
- `src/domain/validation.mjs`
- `src/services/create-cohort.mjs`
- `src/server/app.mjs`
- `src/ui/create-cohort.mjs`
- `tests/domain-validation.test.mjs`
- `tests/create-cohort.test.mjs`

## Evidence

- User feedback: the first meeting date always has to be after two weeks from creation.
- User feedback: daily should be a recurrence option.
- User feedback: meeting links should only accept Google Meet, Zoom, Microsoft Teams, Discord, and Slack.
- User feedback: remove the first creator field because only creators create requests, not participants.
- Current code already enforces `firstMeetingAt` after `expiresAt`, but the form and tests should continue proving that behavior while adjacent form changes are made.
- Current backend validation only requires `lockedEventLink` to be non-empty; the browser input is `type="url"` but there is no provider allowlist.
- Current form renders a `Creator` select fed by demo users.

## Scope

In scope:
- Keep first meeting creation constrained to after the 14-day quorum window in both UI and backend validation.
- Add `daily` as a supported recurrence value and ensure meeting-count validation still makes sense for repeating events.
- Add backend validation for approved private meeting-link domains: Google Meet, Zoom, Microsoft Teams, Discord, and Slack.
- Remove the visible first `Creator` field from the create form and route creation through the current authenticated/demo creator assumption.
- Update focused tests for recurrence, link allowlist, creator field removal, and the first-meeting rule.

Out of scope:
- Implementing full production authentication unless the resolver intentionally coordinates with T012.
- Supporting arbitrary meeting providers.
- Uploading meeting links or creating meetings through provider APIs.
- Changing the 2-credit creator cost.

## Notes

The resolver should treat the removed `Creator` field carefully because the repo still uses demo auth. If full auth is not implemented in the same wave, choose a conservative hidden/default demo creator path and document the temporary assumption.
