# Session Notes

Append-only role transition and handoff log.

### 2026-05-30 00:02 EDT

Read:
- User clarification that this is discussion and that token sales with USD plus event advertising on socials can come next if urgent, while everything else needs to be built.
- Existing `plan.md`, `tasks.json`, `atomic-task-graph.md`, and `agent/knowledge/index.md` references to MVP, tokens, and social promotion.

Decided:
- Clarified MVP scope: build core cohort creation, discovery, interest, quorum, expiry/refund, private link visibility, dashboards, token ledger, admin/demo grants, and social outbox.
- Moved USD token purchases and real external social posting to post-MVP / urgent-next.
- Recorded initial post-MVP pricing assumptions: `$6` for 6 tokens and `$12` for 14 tokens.

Assumptions Made:
- MVP should still include a social outbox so real posting can plug in later.
- MVP should still use auditable grant transactions so USD purchase grants can plug in later.

Next Recommended Step:
- Start `agent-starters/startNewManager.txt` and execute T001 from `tasks.json`.

### 2026-05-29 23:50 EDT

Read:
- `start.txt`
- `agent/router/intent-router.md`
- `README.md`
- `USAGE.md`
- `agent-starters/startSetupManager.txt`
- `schemas/main-task.schema.json`
- `docs/cohort15-mvp-spec-v3.md`
- existing `plan.md`, `tasks.json`, `atomic-task-graph.md`, `agent/knowledge/index.md`, and progress files

Decided:
- Classified the user request as setup/bootstrap because the repo contained planning placeholders and a Cohort15 MVP spec but no product implementation.
- Initialized a 10-task MVP graph covering scaffold, domain validation, persistence/token ledger, create flow, feed/detail visibility, interest/quorum, expiry/refunds, social outbox, dashboards, and final verification.
- Kept setup limited to planning and tracker artifacts per setup manager rules; product code implementation should begin with T001.

Assumptions Made:
- The first implementation task may choose a pragmatic web stack because no stack is specified.
- Real social posting is deferred until official channels and credentials are provided; initial implementation should use a local/mock social outbox.
- Seed/demo token grants are acceptable until a product token funding model is specified.
- Auth provider and deployment target are open implementation questions, not setup blockers.

Next Recommended Step:
- Start `agent-starters/startNewManager.txt` and execute T001 from `tasks.json`.

## Template

### YYYY-MM-DD HH:MM

Read:
- TODO

Decided:
- TODO

Assumptions Made:
- TODO

Next Recommended Step:
- TODO
