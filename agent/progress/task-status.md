# Task Status

`tasks.json` is canonical. Keep this readable view aligned after verified changes.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| T001 | Scaffold runnable app foundation | done | yes | `npm run check` passed; dev server started at `http://localhost:3000`; browser verified title/H1/scaffold sections. | Selected dependency-free Node.js HTTP + ES modules foundation. |
| T002 | Implement domain types and validation rules | done | yes | `npm run check` passed with focused domain validation tests. | Added JSDoc models, spec enums, validators, expiry defaulting, and locked-link visibility serialization. |
| T003 | Add persistence schema and token ledger primitives | not_started | yes |  | Depends on T002. |
| T004 | Build create cohort flow | not_started | no |  | Depends on T003. |
| T005 | Build public event feed and detail visibility | not_started | no |  | Depends on T004. |
| T006 | Build show-interest and quorum unlock flow | not_started | no |  | Depends on T005. |
| T007 | Build expiry and refund processing | not_started | no |  | Depends on T006. |
| T008 | Build social promotion outbox | not_started | no |  | Depends on T004. |
| T009 | Build creator and participant dashboards | not_started | no |  | Depends on T006. |
| T010 | Add MVP verification pass and docs | not_started | no |  | Depends on T007, T008, and T009. |
