# Task Status - ISSUE-013

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-013-T01 | Lighten and hide create-form placeholders on focus | done | yes | `node --test tests/create-cohort.test.mjs` passed; browser smoke confirmed unfocused placeholder color `rgb(184, 176, 164)` and focused input/textarea placeholders transparent with opacity `0`. | Related to resolved ISSUE-010 placeholder content; this issue covers contrast and focus behavior only. |
