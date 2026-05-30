# Task Status

`tasks.json` is canonical. Keep this readable view aligned after verified changes.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| T001 | Scaffold runnable app foundation | done | yes | `npm run check` passed; dev server started at `http://localhost:3000`; browser verified title/H1/scaffold sections. | Selected dependency-free Node.js HTTP + ES modules foundation. |
| T002 | Implement domain types and validation rules | done | yes | `npm run check` passed with focused domain validation tests. | Added JSDoc models, spec enums, validators, expiry defaulting, and locked-link visibility serialization. |
| T003 | Add persistence schema and token ledger primitives | done | yes | `npm run check` passed with persistence and token ledger tests. | Added dependency-free in-memory repositories, schema metadata, demo grants, and auditable ledger helpers. |
| T004 | Build create cohort flow | done | yes | `npm run check` passed with create-flow service and route tests. | Added demo-backed create form, 2-token creator hold, default expiry, validation surfacing, and hidden-link success rendering. |
| T005 | Build public event feed and detail visibility | done | yes | `npm run check` passed with event browsing service and route visibility tests. | Added public feed/detail routes, hidden locked links for open events, and active-link reveal for authorized viewers. |
| T006 | Build show-interest and quorum unlock flow | done | yes | `npm run check` passed; browser smoke tested create, stake interest, quorum activation, and unlocked private link on `http://localhost:3001`. | Added show-interest service, POST route, detail UI, quorum token consumption, and consumed-participant link authorization. |
| T007 | Build expiry and refund processing | done | yes | `npm run check` passed with expiry/refund service and route tests. | Added overdue open cohort expiry, creator/participant refund transactions, refunded interests, and dev/admin expiry trigger. |
| T008 | Build social promotion outbox | done | yes | `npm run check` passed with social promotion outbox tests. | Create cohort now writes a pending local outbox post with public cohort details and no private link. |
| T009 | Build creator and participant dashboards | done | yes | `npm run check` passed; browser smoke checked `/dashboard/creator` and `/dashboard/participant`. | Added dashboard data loader, routes, UI, token summaries, and authorized unlocked-link rendering. |
| T010 | Add MVP verification pass and docs | done | yes | `npm run check` passed with 36 tests; dev server started at `http://localhost:3000`; browser smoke verified create page and success state. | Added full MVP success and expiry/refund verification coverage plus README handoff docs. Browser feed/unlock smoke was blocked by browser URL policy, but automated coverage exercises that path end to end. |
| T011 | Add durable persistence adapter | not_started | yes | Pending. | First post-MVP hardening task; preserve repository contracts and token ledger semantics while adding restart-safe storage. |
| T012 | Replace demo user selection with regular auth boundary | not_started | no | Pending. | Depends on T011; protected flows should use signed-in users instead of query/default demo identity. |
| T013 | Add token purchase package flow | not_started | no | Pending. | Depends on T011 and T012; start from `$6`/6-token and `$12`/14-token packages with local/mock payment unless a provider is selected. |
| T014 | Publish social outbox to configured external channels | not_started | no | Pending. | Depends on T011 and T012; implement adapter-backed publishing with dry-run/mock mode and no private-link leakage. |
| T015 | Add cohort completion and cancellation lifecycle handling | not_started | no | Pending. | Depends on T012; implement cancellation refunds and active cohort completion for already-modeled statuses. |
