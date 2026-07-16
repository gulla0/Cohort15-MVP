# Session Notes - ISSUE-L004

Append-only.

## 2026-07-15 - Intake

- Browse and Create a cohort are the primary destinations.
- Research stays in the header but is visually de-emphasized.
- Signed-in balance remains visible and becomes the coherent account control for Buy credits and Sign out.
- Navigation must stop changing structure from page to page.

## 2026-07-16 - Shared navigation contract

- Locked one header information architecture for every full page: brand, Browse cohorts, Create a cohort, Research & Field Notes, then the auth/account region.
- Kept the settled available credit count permanently visible while moving Buy credits and CSRF-protected Sign out into a native disclosure.
- Defined route-family current states plus keyboard, focus, outside-click, and mobile behavior before implementation.

## 2026-07-16 - Shared renderer completed

- Added one shared renderer for landing, cohort detail, cohort creation, research, sign-in, Buy Credits, and checkout-result pages.
- Browse cohorts and Create a cohort now share primary emphasis; Research remains visible with quieter treatment on every page.
- Anonymous visitors see Sign in. Signed-in visitors always see settled available credits and can open Buy credits followed by CSRF-protected Sign out.
- Focused tests, the full 111-test repository check, and anonymous desktop/mobile browser smoke passed without horizontal overflow or console errors.
