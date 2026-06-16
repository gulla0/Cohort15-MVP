# ISSUE-010 Change Log

## 2026-06-16

- Created issue-local planning artifacts for create-form placeholders and familiar local image selection.
- Resolved ISSUE-010-T01 by adding meaningful Cohort15-specific placeholders to the cohort creation form without changing submitted values or validation rules.
- Resolved ISSUE-010-T02 by switching the visible event image control to a local file picker, accepting PNG/JPG/GIF/WebP uploads up to 2 MB, storing selected files under `/assets/uploads`, serving uploaded assets, and preserving the default image fallback when no file is selected.
- Verified with `node --test tests/create-cohort.test.mjs` and `npm run check`.
