# ISSUE-001 - Repair MVP Flow UX

## Summary

The current frontend technically supports the MVP cohort flow, but the user-facing experience is weak and confusing. The participant interest flow can fail on the first attempt because the interest form defaults to the creator. The UI uses internal credit ledger wording such as "stake", "held", and "consumed" instead of simple product language. The create form allows invalid meeting dates. Navigation does not make it clear when creator and participant dashboards are available.

## User Impact

Users cannot reliably complete the core MVP journey without knowing implementation details. A creator can create a cohort, but the next step is not obvious. A participant can land on an event and fail to show interest because the form defaults to the creator. Users also see confusing credit language and can create cohorts with dates that should not be accepted.

## Affected Flow

- Home and primary navigation
- Create cohort form and success state
- Public cohort feed
- Cohort detail and show-interest form
- Creator dashboard
- Participant dashboard

## Likely Technical Area

- `src/ui/home.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/dashboards.mjs`
- `src/ui/styles.css`
- `src/domain/validation.mjs`
- `src/services/create-cohort.mjs`
- `src/server/app.mjs`
- Relevant route and service tests under `tests/`

## Evidence

- Browser check on 2026-05-30 confirmed the show-interest form defaults to `Demo Creator` on a creator-owned event. Submitting immediately returns "Creators cannot show interest in their own cohort."
- Selecting `Demo Participant` manually allows interest to be recorded, quorum to be met, and the private link to unlock, so the core service works but the UI default is wrong.
- The create form `firstMeetingAt` input has no `min` attribute.
- Domain validation checks that `firstMeetingAt` is a valid date, but does not enforce a minimum meeting date.
- Home navigation does not expose dashboards. Dashboard pages have more complete navigation than home/create/feed/detail pages.
- User-facing copy currently includes terms such as "stake", "staked", "held", and "consumed".

## Scope

In scope:
- Make the participant interest path work by default for demo users.
- Replace internal staking/ledger wording with simple credit language.
- Add copy that clearly says all credits are returned if quorum is not met.
- Enforce the meeting date rule in both UI and backend validation.
- Make navigation and post-action next steps clear across MVP pages.
- Verify the create-to-interest-to-dashboard journey end to end.

Out of scope:
- Real authentication.
- Durable persistence.
- Credit purchases.
- External social publishing.
- Non-MVP account/profile features.

## Product Decisions

- Use simple wording: "Use 2 credits to start cohort" and "Use 1 credit to show interest."
- The banner may say that all credits are returned if the cohort does not meet quorum.
- Meeting dates should only be selectable after the two-week quorum window. Interpret this as first meeting date must be after `createdAt + 14 days` unless the user revises the rule.

## Notes

This issue should be resolved before post-MVP hardening work because it affects whether the MVP can be demonstrated coherently.
