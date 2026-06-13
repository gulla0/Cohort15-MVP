# ISSUE-008 - Add Word-Based Cohort Search

## Summary

The cohorts page needs a word-based search so users can quickly filter public cohort requests.

## User Impact

As the number of cohorts grows, users must manually scan every card. This slows discovery and makes it harder to find cohorts by topic, title, description, audience, or skill.

## Affected Flow

- Browsing and filtering the public `/cohorts` page.

## Likely Technical Area

- `src/services/event-browsing.mjs`
- `src/server/app.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/styles.css`
- `tests/event-browsing.test.mjs`

## Evidence

- User feedback: "In the cohorts page a word based search should be implemented to be able to quickly filter through cohorts."
- Current `/cohorts` route renders all public open/active cohorts without a search query or client/server filtering control.

## Scope

In scope:
- Add a word-based search input on `/cohorts`.
- Filter public cohorts by meaningful text fields such as title, description, topic, category, audience, and skill.
- Preserve open/active visibility and private-link hiding rules.
- Keep empty and no-results states clear.
- Update focused tests for filtering behavior.

Out of scope:
- Full-text ranking, stemming, typo tolerance, saved searches, or external search services.
- Filtering private/hidden fields such as locked meeting links.
- Admin-only search across non-public cohort statuses.

## Notes

The resolver should choose the simplest search implementation that fits the dependency-free app. A server-side query parameter is likely enough for the MVP unless implementation discovers a stronger reason for client-side filtering.
