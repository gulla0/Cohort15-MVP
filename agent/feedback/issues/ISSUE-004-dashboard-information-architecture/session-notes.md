# ISSUE-004 Session Notes

Append-only issue-local notes.

### 2026-05-30 09:51 EDT

User Feedback:
- The dashboard repeats token information and does not need that repetition.
- Token sections should be Available, In use, and Used; Returned should not be shown.
- `Creator dashboard` and `user dashboard` wording is not user-friendly.
- Dashboard page needs a general user-flow review.
- User confirmed content-based naming direction: `My Cohorts`, `My Events`, or `Dashboard` depending on what the page contains.
- User proposed created cohorts, interested cohorts, and active cohorts with schedules as a clearer content model.

Issue Mapping:
- New ISSUE-004: Improve Dashboard Information Architecture and Language.

Reasoning:
- This feedback builds on ISSUE-003's combined dashboard but is not a duplicate. ISSUE-003 addressed route/navigation structure; this issue addresses the combined dashboard's content hierarchy, labels, and token presentation.
- The requested token presentation is UI copy/presentation work. Internal ledger refund accounting should remain intact.
- Active cohorts and schedules should likely come first because they are more time-sensitive than passive created/interested lists.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/session-notes.md`
- `agent/feedback/issues/ISSUE-004-dashboard-information-architecture/*`

### 2026-05-30 10:06 EDT

User Feedback:
- Resolve the available feedback issues.

Issue Mapping:
- Existing ISSUE-004 resolved.

Reasoning:
- ISSUE-004 was the only open feedback issue.
- The fix stayed in dashboard presentation and test coverage. Ledger refund semantics and token summary data remain intact, but dashboard UI no longer renders Returned or repeated per-row token summaries.
- The combined dashboard now follows the requested content model: account tokens, active cohorts and schedule, created cohorts, and interested cohorts.

Artifacts Updated:
- `src/ui/dashboards.mjs`
- `src/ui/styles.css`
- `src/ui/home.mjs`
- `tests/dashboards.test.mjs`
- `tests/mvp-verification.test.mjs`
- ISSUE-004 tracking files
