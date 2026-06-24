# Feedback Production Migration

This checklist applies after the first-party feedback feature is approved, committed, pushed, and deployed.

Do not paste credentials, API keys, feedback contact data, or secret values into chat, logs, issue files, or committed repository files.

## Human Setup Checklist

1. Open the isolated `cohort15-lofi-mvp` Supabase project.
2. Open `SQL Editor` -> `New query`.
3. Run `/Users/gzero/Desktop/cohort15/cohort15-mvp/supabase/migrations/20260624000000_cohort15_lofi_feedback.sql`.
4. Verify the new table is named `cohort15_lofi_feedback`.
5. Verify row level security is enabled and access remains service-role only.
6. Deploy the approved branch to the existing isolated Render service.
7. Open `https://cohort15.com`, submit a test feedback response, and confirm a row appears in `cohort15_lofi_feedback`.
8. Confirm public pages do not display feedback contact information.

Report only:

- whether the feedback table exists;
- whether RLS/service-role-only posture is intact;
- whether a test feedback submission reached the table;
- whether public pages kept feedback/contact data private.
