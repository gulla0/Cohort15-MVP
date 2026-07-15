# Piece of Pie MVP Task Status

`tasks.json` is canonical. The active ledger is intentionally reset to the account, credit, payment, and launch extension; completed lofi history remains in Git and progress logs.

| Task | Title | Status | Dependencies Ready | Evidence |
|---|---|---|---|---|
| L015 | Add account and credit persistence foundation | done | yes | Local/Supabase account, session, immutable-ledger, purchase, Stripe-event, nullable-link, migration, concurrency, and idempotency coverage; `npm run check` passed with 88 tests. |
| L016 | Implement magic-link accounts and signup credits | done | yes | Supabase magic-link adapter, digest-backed eight-hour sessions, CSRF sign-out, safe returns, exactly-once grant, signed-in balance UI, and privacy/failure coverage; `npm run check` passed with 93 tests. |
| L017 | Credit-gate cohort creation and interest | not_started | yes | Ready after L016. |
| L018 | Implement Stripe checkout and idempotent fulfillment | not_started | no | Pending L017. |
| L019 | Complete the Piece of Pie local launch gate | not_started | no | Pending L018. |
| L020 | Configure, deploy, and verify the live payment MVP | not_started | no | Pending L019 and indexed human/provider work. |

Next ready task: L017.

Provider continuity: the user reported the existing lofi Supabase, Render, `cohort15.com`, Resend/email, and related human setup in place. New provider actions must extend those resources through `docs/human-tasks/piece-of-pie-launch.md`.
