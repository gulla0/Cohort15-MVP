# Task Status - ISSUE-014

Issue-local `tasks.json` is canonical. Keep this readable view aligned.

| Task ID | Title | Status | Dependencies Satisfied | Evidence | Notes |
|---|---|---|---|---|---|
| ISSUE-014-T01 | Align Buy Credits with navbar options | done | yes | `npm test -- tests/foundation.test.mjs` passed; browser smoke verified desktop nav items share top/height/center and 390px mobile nav wraps without overflow. | Shared topbar links now use consistent flex centering; Buy Credits keeps its non-payment placeholder route and CTA styling. |
