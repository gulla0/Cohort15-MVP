# Session Notes - ISSUE-014

Append-only.

### 2026-06-16

User Feedback:
- The Buy Credits button needs to be aligned with the other options on the navbar.

Issue Mapping:
- New ISSUE-014.

Reasoning:
- This is related to ISSUE-012, which added the placeholder route/nav entry, but it is not a duplicate because the new feedback concerns visual alignment.
- The expected fix should stay in shared topbar markup/styles and preserve the non-payment placeholder boundary.

Artifacts Updated:
- `agent/feedback/issues/ISSUE-014-buy-credits-nav-alignment/*`
- `agent/feedback/issue-index.md`
- `agent/feedback/session-notes.md`
- `agent/knowledge/index.md`

### 2026-06-16

User Feedback:
- Initialize the feedback resolver and resolve the next available issue.

Issue Mapping:
- Existing ISSUE-014 resolved.

Reasoning:
- ISSUE-014 was the first unresolved issue in the feedback index.
- The alignment problem was addressed in the shared topbar styles: all nav links now share inline-flex vertical centering and a common min-height, while the Buy Credits link keeps only its CTA visual treatment.
- Mobile wrapping now starts nav rows from the same edge so the Buy Credits placeholder remains coherent at narrow widths.
- The safe `/credits/buy` placeholder remains non-payment-only and does not grant credits.

Artifacts Updated:
- `src/ui/styles.css`
- `tests/foundation.test.mjs`
- `agent/feedback/issues/ISSUE-014-buy-credits-nav-alignment/*`
- `agent/feedback/issue-index.md`
- `agent/feedback/session-notes.md`
- `agent/knowledge/index.md`
