# Task Status - ISSUE-L002

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-L002-T01 | Define the 280-character portable request contract | done | yes | Canonical format, readable UTC context, Unicode length accounting, truncation priority, URL invariant, privacy boundary, and feedback behavior are explicit; boundary cases remain at most 280 code points. | Implemented before the copy UI, then refined through user preview feedback. |
| ISSUE-L002-T02 | Implement portable request copy controls | done | yes | Listing/detail controls share one private-safe payload; focused tests cover readable context, length, privacy, clipboard behavior, responsive action hierarchy, and whole-card navigation exclusions. | User preview refined card behavior and presentation before commit. |
