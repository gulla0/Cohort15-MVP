# Session Notes - ISSUE-013

Append-only.

### 2026-06-16

User Feedback:
- The placeholder text in the cohort request form is too dark.
- Placeholder text has to be very light.
- Placeholder text has to disappear when the user clicks on that field.

Issue Mapping:
- New ISSUE-013.

Reasoning:
- This is related to ISSUE-010, which added meaningful placeholder examples, but it is not a duplicate because the new feedback concerns placeholder visual weight and focus behavior.
- The likely implementation can stay in create-form markup/styles and should not change validation, image upload, or placeholder content semantics.

Artifacts Updated:
- `agent/feedback/issues/ISSUE-013-create-form-placeholder-contrast-focus/*`
- `agent/feedback/issue-index.md`
- `agent/feedback/session-notes.md`
- `agent/knowledge/index.md`

### 2026-06-16

User Feedback:
- Resolve the next available feedback issue.

Issue Mapping:
- Existing ISSUE-013 resolved.

Reasoning:
- ISSUE-013 was the first `not_started` issue in the feedback index.
- Standards-based CSS was enough: scoped create-form placeholder rules preserve the meaningful ISSUE-010 examples when fields are empty and unfocused, then hide placeholder pseudo-elements during focus without changing validation or image upload behavior.

Artifacts Updated:
- `src/ui/styles.css`
- `tests/create-cohort.test.mjs`
- `agent/feedback/issues/ISSUE-013-create-form-placeholder-contrast-focus/*`
- `agent/feedback/issue-index.md`
- `agent/feedback/session-notes.md`
- `agent/knowledge/index.md`
