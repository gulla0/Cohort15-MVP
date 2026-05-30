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
| T007 | Build expiry and refund processing | not_started | yes |  | Depends on T006. |
| T008 | Build social promotion outbox | not_started | yes |  | Depends on T004. |
| T009 | Build creator and participant dashboards | not_started | yes |  | Depends on T006. |
| T010 | Add MVP verification pass and docs | not_started | no |  | Depends on T007, T008, and T009. |
