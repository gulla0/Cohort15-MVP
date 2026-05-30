# Session Notes - ISSUE-003

## 2026-05-30

User requested feedback intake and two concrete UX changes:
- Put creator and participant dashboards on the same page.
- Move navigation options away from the app name.

Implementation notes:
- Added combined `/dashboard` route with default demo creator and participant users.
- Kept `/dashboard/creator` and `/dashboard/participant` in place for compatibility.
- Updated post-create and post-interest next-step links to point to `/dashboard`.
- Updated topbar markup across duplicated page shells.
