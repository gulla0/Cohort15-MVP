# Session Notes - ISSUE-005

Append-only.

### 2026-05-30 10:13 EDT

Read:
- `agent/feedback/issue-index.md`
- `agent/feedback/session-notes.md`
- `agent/knowledge/index.md`
- `src/ui/dashboards.mjs`
- `src/services/dashboards.mjs`
- `tests/dashboards.test.mjs`
- `tests/mvp-verification.test.mjs`
- `agent/feedback/issues/ISSUE-004-dashboard-information-architecture/*`

User Feedback:
- Dashboard token information is repeated.
- There are no separate creator tokens and participant tokens.
- All tokens are the same, so the dashboard should not divide them that way.

Issue Mapping:
- New ISSUE-005: Unify Dashboard Token Account.

Reasoning:
- ISSUE-004 removed row-level token repetition and old role-token copy, but the combined dashboard still renders two account-token panels under `Account Tokens`.
- This is distinct from refund-state cleanup and row-level copy cleanup because it targets the dashboard's account token model.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/session-notes.md`
- `agent/feedback/issues/ISSUE-005-unify-dashboard-token-account/*`
- `agent/knowledge/index.md`
