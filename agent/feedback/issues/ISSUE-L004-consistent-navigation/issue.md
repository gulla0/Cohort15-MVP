# ISSUE-L004 - Simplify And Standardize Shared Navigation

## Summary

Replace duplicated, inconsistent page headers with a shared navigation system that prioritizes Browse and Create, keeps Research visible but de-emphasized, and groups signed-in account actions behind the credit control.

## User Impact

The current header gives navigation destinations, credit state, purchasing, and sign-out similar visual weight. Items also differ by page, so visitors cannot form a stable model of where controls will appear.

## Affected Flow

Landing, cohort detail, cohort creation, research, authentication, credit purchase, and checkout-result pages on desktop and mobile.

## Likely Technical Area

- `docs/cohort15-piece-of-pie-mvp-spec.md`
- `src/ui/auth.mjs`
- all UI modules that render `.topbar`
- `src/ui/styles.css`
- navigation assertions across UI tests

## Evidence

- Headers are independently assembled in `home.mjs`, `cohorts.mjs`, `create-cohort.mjs`, `research.mjs`, `auth.mjs`, and `credits.mjs`.
- Some pages omit Browse or Research, some include a Create button or status pill, and signed-in views append balance, Buy credits, and Sign out as separate peers.
- The approved direction is Browse and Create as primary navigation, Research retained with less emphasis, and a clickable credit/account control containing Buy credits and Sign out.

## Scope

In scope:
- One shared header/navigation renderer used consistently by all server-rendered pages.
- Visible Browse, Create a cohort, and de-emphasized Research destinations.
- Anonymous Sign in control.
- Signed-in credit/account control that exposes Buy credits and Sign out accessibly.
- Coherent current-page treatment and responsive behavior.

Out of scope:
- A full account dashboard, profile menu, purchase history, new routes, or broader site redesign.
- Removing Research from navigation entirely.

## Notes

Resolution must preserve CSRF-protected sign-out and keep the available credit count visible. A native accessible disclosure pattern is preferable to bespoke menu behavior when it meets keyboard and mobile requirements.
