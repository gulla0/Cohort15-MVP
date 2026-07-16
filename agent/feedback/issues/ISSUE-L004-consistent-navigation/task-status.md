# Task Status - ISSUE-L004

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-L004-T01 | Define the shared navigation contract | done | yes | Canonical header hierarchy, current states, disclosure behavior, keyboard/focus handling, and responsive rules defined; `git diff --check` passed. | Covers every current shell and auth state. |
| ISSUE-L004-T02 | Build and adopt the shared navigation renderer | done | yes | Shared renderer adopted by every full page; focused tests and `npm run check` passed with 111 tests; desktop/mobile browser smoke passed without overflow or console errors. | Canonical hierarchy, auth disclosure, current states, and responsive behavior verified. |
