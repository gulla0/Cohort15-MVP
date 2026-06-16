# ISSUE-012 - Add Buy Credits Navigation Placeholder

## Summary

The navigation should include a `Buy Credits` button as a placeholder before the real payment flow is built. It should be visible now, but wiring to actual payment gates can wait for the credit purchase work.

## User Impact

Users need a clear path that indicates where credit purchasing will live. Without a visible entry point, credits feel like an internal balance rather than something the product will let users replenish.

## Affected Flow

- Primary app navigation.
- Credit account and future purchase flow discovery.
- Later integration with T013 credit package purchases.

## Likely Technical Area

- `src/ui/home.mjs`
- shared navigation/header rendering
- `src/server/app.mjs` if a placeholder route is added
- `src/ui/styles.css`
- navigation or route tests

## Evidence

- User feedback: add a `Buy Credits` button on the nav bar.
- User feedback: this is a placeholder for now and can be wired up when real payment gates are created.
- Main task T013 already tracks the real credit purchase package flow, but the navigation placeholder can be handled as a smaller feedback issue.

## Scope

In scope:
- Add a visible `Buy Credits` nav button or link.
- Route it to a safe placeholder page or disabled/coming-soon state that does not imply real payment is live.
- Keep copy clear that purchasing is not active yet if a placeholder page is used.
- Preserve existing navigation clarity and responsive behavior.
- Add focused tests for the nav entry and placeholder behavior.

Out of scope:
- Implementing real payment processing.
- Creating purchase transactions.
- Selecting a payment provider.
- Changing credit package pricing beyond referencing the documented future packages if helpful.

## Notes

Coordinate wording with T013. The placeholder should not create credits or claim a transaction succeeded.
