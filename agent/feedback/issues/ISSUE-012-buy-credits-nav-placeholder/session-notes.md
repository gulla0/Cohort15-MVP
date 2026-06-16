# ISSUE-012 Session Notes

## 2026-06-16

Created from user feedback asking for a `Buy Credits` button in the navigation. The issue is scoped as a placeholder only and explicitly leaves payment gates to T013.

## 2026-06-16

Resolved ISSUE-012-T01 by extracting the duplicated topbar into `renderTopbar`, adding a visible `Buy Credits` nav entry across primary app pages, and routing it to `/credits/buy`.

The placeholder page states that credit purchasing is not live, collects no payment, and adds no credits. Real payment handling, purchase transactions, and provider selection remain in T013.

Verification:
- `node --test tests/foundation.test.mjs`
- `node --test tests/dashboards.test.mjs`
- Browser smoke: home nav click to `http://localhost:3002/credits/buy`
