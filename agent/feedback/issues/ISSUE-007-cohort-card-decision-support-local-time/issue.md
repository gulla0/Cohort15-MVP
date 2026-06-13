# ISSUE-007 - Improve Cohort Cards for Participant Decisions

## Summary

Cohort request cards need to better support participant decision-making. They should communicate capacity and availability, reduce oversized image dominance, and display times in the viewer's local time instead of fixed UTC.

## User Impact

Potential participants cannot quickly tell how many seats are available or whether a cohort is close to quorum/capacity. Oversized images compete with decision-critical details, and UTC timestamps create scheduling ambiguity.

## Affected Flow

- Browsing the public `/cohorts` page.
- Reviewing a cohort request card before opening detail or showing interest.
- Reading first meeting and expiry times.

## Likely Technical Area

- `src/services/event-browsing.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/styles.css`
- `tests/event-browsing.test.mjs`
- `tests/mvp-verification.test.mjs`

## Evidence

- User feedback: display cards should show max, min, and open spots, but the resolver may propose better UX solutions.
- User feedback: cohort request card images are too big.
- User feedback: cards should be designed around what potential participants need to decide whether to join.
- User feedback: cohort request cards should display the viewer's local time.
- Current `formatDateTime` in `src/ui/cohorts.mjs` formats dates with `timeZone: 'UTC'`.
- Current feed cards show status, quorum needed, title, description, topic, skill, and first meeting, but not max participants or open spots.

## Scope

In scope:
- Redesign public cohort cards so capacity/quorum/open spots are clear and scannable.
- Reduce or rebalance image sizing so images support rather than dominate the decision surface.
- Display first-meeting time in the viewer's local timezone on the client side, with accessible fallback text if JavaScript is unavailable.
- Use current UX research or credible design references during resolution before finalizing the card layout.
- Update tests and/or browser smoke checks to cover card content and local-time rendering behavior.

Out of scope:
- Changing the underlying quorum or max participant rules.
- Building a full recommendation or ranking system.
- Replacing the event detail page unless card changes require shared helper updates.
- Adding real geolocation or user profile timezone settings.

## Notes

The resolver should not blindly implement exactly `max/min/open spots` if a better participant-facing presentation emerges from UX research. The acceptance bar is that capacity and timing are clearer for a participant deciding whether to show interest.
