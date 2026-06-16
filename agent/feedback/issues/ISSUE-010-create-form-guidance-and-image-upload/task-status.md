# Task Status - ISSUE-010

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-010-T01 | Add meaningful create-form placeholders | done | yes | `node --test tests/create-cohort.test.mjs` and `npm run check` passed. | Added realistic Cohort15 placeholders for key create-form text, number, link, and detail fields. |
| ISSUE-010-T02 | Support familiar local image selection | done | yes | `node --test tests/create-cohort.test.mjs` and `npm run check` passed. | Replaced the visible image URL/path input with a file picker; valid PNG/JPG/GIF/WebP uploads are saved under `/assets/uploads`, blank uploads keep the default image. |
