# ISSUE-003 - Combine Dashboards and Separate Navigation

## Summary

Creator and participant dashboard options were split across two separate pages, and the top navigation placed product links directly beside the app name.

## User Impact

Users have to understand two dashboard destinations and can confuse app identity with navigation actions because all links are grouped together.

## Affected Flow

- Global navigation from home, cohort feed, cohort detail, create cohort, and dashboards.
- Dashboard review after creating a cohort or showing interest.

## Likely Technical Area

- `src/ui/dashboards.mjs`
- `src/server/app.mjs`
- shared topbar markup in `src/ui/*.mjs`
- `src/ui/styles.css`
- dashboard and MVP route tests

## Evidence

User feedback on 2026-05-30:
- "Both the dashboards need to be on the same page instead of 2 separate dashboards."
- "Make the navigation options be on the other end of the page. They are confusing when put beside the name of the app."

## Scope

In scope:
- Add one combined dashboard page.
- Update navigation to show one dashboard destination.
- Visually separate the app name from navigation links.
- Keep old dashboard routes available for compatibility.
- Update tests for combined dashboard behavior.

Out of scope:
- Authentication/account switching redesign.
- Dashboard filtering, sorting, or analytics expansion.
- New visual brand system.

## Notes

This issue was implemented immediately after intake because the user requested activation and gave concrete change requirements.
