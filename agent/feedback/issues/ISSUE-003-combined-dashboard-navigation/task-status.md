# Task Status - ISSUE-003

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-003-T01 | Combine dashboard surfaces | done | yes | `src/ui/dashboards.mjs`, `src/server/app.mjs`, `tests/dashboards.test.mjs` | Added `/dashboard` while keeping legacy dashboard URLs. |
| ISSUE-003-T02 | Separate navigation from app name | done | yes | `src/ui/*.mjs`, `src/ui/styles.css` | Grouped nav links in `.topbar-links` opposite `.brand-link`. |
