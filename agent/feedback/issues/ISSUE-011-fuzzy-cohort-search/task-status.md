# Task Status - ISSUE-011

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-011-T01 | Add fuzzy public cohort search ranking | done | yes | `node --test tests/event-browsing.test.mjs` passed. | Added dependency-free public-field scoring so exact matches rank above substring and typo-tolerant matches. |
