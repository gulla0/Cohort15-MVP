# ISSUE-006 Session Notes

## 2026-06-13

Created from user feedback about the cohort creation form. The issue intentionally keeps form/auth/link validation work together because those changes share the `/cohorts/new` route, create service, domain validation, and create-flow tests.

## 2026-06-13 Resolution

Resolved ISSUE-006-T01 by adding `daily` recurrence, enforcing approved private meeting-link hosts in backend validation, removing the visible Creator select from `/cohorts/new`, and assigning the current demo creator in the route before calling the create service.

The implementation intentionally does not start T012 auth work. Until regular auth lands, `/cohorts/new` uses the conservative `user-creator` demo creator path and ignores any posted participant `creatorId`.

Focused verification passed with `npm test -- tests/domain-validation.test.mjs tests/create-cohort.test.mjs`. Final verification passed with `npm run lint` and `npm run check`.
