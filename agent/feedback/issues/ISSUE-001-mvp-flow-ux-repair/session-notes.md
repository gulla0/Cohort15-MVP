# Session Notes - ISSUE-001

Append-only issue-local notes.

### 2026-05-30 08:45 EDT

User Feedback:
- Current frontend is weak.
- User cannot show interest in events.
- Avoid words like staking; use simple token wording.
- Calendar allows dates that are already passed and should only allow dates after the two-week time limit.
- Navigation is weird and dashboard access is unclear.

Observed:
- Automated `npm run check` passed before intake, so existing backend service coverage is green.
- Browser flow reproduced interest failure caused by the demo interest dropdown defaulting to `Demo Creator`.
- Selecting `Demo Participant` manually completed the interest and quorum unlock path.
- Create form has no `min` attribute for `firstMeetingAt`.
- Domain validation only checks valid dates, not the earliest allowed first meeting date.
- Home page still reads like a scaffold and does not expose dashboard links.

Decision:
- Create this as a UX repair feedback issue rather than main implementation work.
- Keep issue tasks local to the feedback issue.
