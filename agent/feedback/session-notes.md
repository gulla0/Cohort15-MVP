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
