# ISSUE-014 - Align Buy Credits Navigation

## Summary

The `Buy Credits` navigation button is not aligned with the other navbar options and should visually line up with the rest of the primary nav.

## User Impact

When one nav item sits out of alignment, the navigation feels unfinished and draws attention away from the actual product flows. The Buy Credits placeholder should look like part of the same navigation system even before payment is implemented.

## Affected Flow

- Primary app navigation.
- The `Buy Credits` placeholder entry added for future credit purchases.

## Likely Technical Area

- shared navigation/topbar rendering in `src/ui/home.mjs`
- pages importing or rendering navigation: `src/ui/cohorts.mjs`, `src/ui/create-cohort.mjs`, `src/ui/dashboards.mjs`
- `src/ui/styles.css`
- route/navigation tests if markup changes

## Evidence

- User feedback: the Buy Credits button needs to be aligned with the other options on the navbar.
- Related resolved issue: ISSUE-012 added the Buy Credits placeholder route/nav entry, but this follow-up concerns visual alignment.

## Scope

In scope:
- Align the `Buy Credits` nav option with the other primary navbar options.
- Preserve the safe `/credits/buy` placeholder behavior from ISSUE-012.
- Keep responsive/mobile navigation usable.
- Add focused test coverage or browser smoke evidence where practical.

Out of scope:
- Implementing real payment processing.
- Creating purchase transactions or granting credits.
- Changing credit package pricing.
- Redesigning the full navigation system beyond the alignment fix.

## Notes

The resolver should inspect the shared topbar first so the alignment fix is applied consistently across pages.
