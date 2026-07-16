# Feedback Session Notes

Feedback history was reset for the lofi MVP branch on 2026-06-18. Git history retains prior production-MVP feedback.

## Template

### YYYY-MM-DD HH:MM

User Feedback:
- TODO

Issue Mapping:
- new / existing / duplicate

Reasoning:
- TODO

Artifacts Updated:
- TODO

### 2026-07-15 22:27 EDT

User Feedback:
- Make the landing page explain the product and credit system instinctively without lengthy mechanics.
- Add small examples from familiar cohort categories so a first-time visitor immediately connects the product concept to real uses.
- Make each cohort request portable as a useful condensed public card that can be copied and shared anywhere, with the full payload no longer than a free-account tweet.
- Reduce feedback to a general-text page followed by the existing founder/contact page, and never open the dialog automatically.
- Replace the crowded, inconsistent header with a coherent navigation system.

Issue Mapping:
- New `ISSUE-L001` for landing and credit messaging.
- New `ISSUE-L002` for portable cohort-request copy.
- New `ISSUE-L003` for the intentional two-page feedback flow.
- New `ISSUE-L004` for consistent shared navigation.

Reasoning:
- The concerns have different user outcomes and implementation areas, so they remain independently resolvable feedback issues.
- The user approved value-first landing copy, a 280-character portable text payload with more than a bare URL, click-only feedback opening, and a header centered on Browse, Create, de-emphasized Research, and grouped account actions.
- Familiar landing examples belong to the messaging issue because they clarify what a cohort is; they must be labeled as examples rather than presented as live requests.
- `docs/cohort15-piece-of-pie-mvp-spec.md` remains the canonical product source and must be updated during resolution where the approved interaction changes its current UI contract.

Artifacts Updated:
- `agent/feedback/issue-index.md`
- `agent/feedback/issues/ISSUE-L001-landing-credit-messaging/`
- `agent/feedback/issues/ISSUE-L002-portable-cohort-requests/`
- `agent/feedback/issues/ISSUE-L003-intentional-two-page-feedback/`
- `agent/feedback/issues/ISSUE-L004-consistent-navigation/`

### 2026-07-15 22:38 EDT

User Feedback:
- Resolve the first available feedback issue.

Issue Mapping:
- Resolved `ISSUE-L001` as the first `not_started` issue in the canonical index.

Reasoning:
- The two issue-local tasks were sequential and tightly coupled: the canonical wording contract had to be locked before the landing implementation could be verified.
- The final hierarchy leads with the group-forming value, uses clearly illustrative examples rather than fake listings, and explains the complete credit bargain in plain language.

Artifacts Updated:
- `docs/cohort15-piece-of-pie-mvp-spec.md`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- `tests/foundation.test.mjs`
- `agent/feedback/issues/ISSUE-L001-landing-credit-messaging/`
- `agent/feedback/issue-index.md`

### 2026-07-15 22:57 EDT

User Feedback:
- Start the resolution manager and resolve the first available issue, then request consent before committing.

Issue Mapping:
- Resolved `ISSUE-L002` as the first `not_started` issue in the canonical index.

Reasoning:
- The issue-local tasks remained sequential: the precise 280-code-point and privacy contract had to be canonical before the shared generator and controls could be tested.
- One shared generator keeps listing and detail payloads identical and keeps the meeting link and private identity outside every copied lifecycle state.
- Commit is intentionally deferred until explicit user consent, overriding the manager's normal automatic closeout commit.

Artifacts Updated:
- `docs/cohort15-piece-of-pie-mvp-spec.md`
- `src/server/app.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- `tests/event-browsing.test.mjs`
- `agent/feedback/issues/ISSUE-L002-portable-cohort-requests/`
- `agent/feedback/issue-index.md`

Follow-up Review:
- The user approved the overall card but found the compact schedule/status line difficult to read.
- Replaced the ISO/semicolon/shorthand presentation with a human-readable UTC date and ` · `-separated facts while preserving the 280-code-point ceiling and included cohort URL.
- The user then identified visual crowding between the card's details link and copy action.
- Rebalanced the card action row so navigation remains primary and the compact copy action is visibly secondary, with responsive stacking on narrow screens.
- Removed the details-link arrow after the refreshed preview showed that it visually connected the link to the adjacent copy button.
- Final review retained the arrow as an explicit second-page cue, preserved opposite-end desktop and stacked mobile action placement, and made non-interactive card clicks open the request page without intercepting copy or text selection.

### 2026-07-16 00:18 EDT

User Feedback:
- Start the resolution manager and resolve the first available issue.
- Explain any database change plan and the effect on current data.
- During review, clarify save failures, own them as a product failure, and name the exact recovery action.

Issue Mapping:
- Resolved `ISSUE-L003` as the first `not_started` issue in the canonical index.

Reasoning:
- The existing nullable `whyOrWhyNot` field safely stores the new general response, so no migration is needed and historical survey values remain untouched.
- The two issue tasks were sequential: compatibility and canonical behavior were locked before replacing the widget.
- Save failure copy now tells visitors their response remains in the form and directs them to `Next` or `Send feedback` as appropriate.
- `Next` now submits the general feedback immediately; the second page only adds optional contact details to the same completed response.

Artifacts Updated:
- `docs/cohort15-piece-of-pie-mvp-spec.md`
- `src/ui/feedback-widget.mjs`
- `tests/feedback.test.mjs`
- `agent/feedback/issues/ISSUE-L003-intentional-two-page-feedback/`
- `agent/feedback/issue-index.md`
