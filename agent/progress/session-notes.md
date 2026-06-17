# Session Notes

Append-only role transition and handoff log.

### 2026-06-17 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/progress/blockers.md`
- `README.md`
- `plan.md`
- `package.json`
- `src/server/app.mjs`
- current official Render docs for web services, Node deployment, deploys, health checks, rollbacks, custom domains, environment variables, and Node version configuration

Decided:
- Classified the user request as approved main implementation work and selected T013 as the next unblocked task after T012 and T016.
- Chose Render Web Service `cohort15-mvp` as the first production deployment target.
- Added a Render runbook and `render.yaml` instead of committing provider credentials or requiring dashboard setup before local work could continue.
- Bound the server entry point to `HOST` or `0.0.0.0` while preserving `PORT`, matching Render web service runtime expectations.
- Marked T013 done after verification.

Assumptions Made:
- The launch app base URL should be `https://cohort15-mvp.onrender.com` unless Render assigns a different available service URL.
- `https://app.cohort15.com` is an optional custom domain assumption only if the domain is owned and verified.
- Auto-deploy should stay off until T014-T030 production integrations and smoke tests are complete.

Next Recommended Step:
- Execute T014: add the production configuration and secrets boundary using the Render app base URL and without committing provider credentials.

### 2026-06-16 12:48 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/blockers.md`
- `plan.md`
- `atomic-task-graph.md`
- route, UI, service, persistence, and tests needed for T012

Decided:
- Classified the user request as approved main implementation work and selected T012 as the next unblocked task after T011/T016.
- Implemented a dependency-free local session cookie boundary instead of choosing an OAuth provider, because provider choice remains unspecified and the app is intentionally dependency-free.
- Kept seeded demo users available only through explicit `/auth/sign-in`, not through hidden fields, participant selectors, dashboard query params, or `viewerId` query params.
- Scoped create, interest, dashboard, and active private-link route behavior to the signed-in session user.
- Updated README, tests, task ledger, task status, change log, and knowledge index for the new auth boundary.

Assumptions Made:
- Local session auth is sufficient for T012 because the task allows the simplest local/session approach and explicitly defers provider choice.
- Session storage can be in-memory for now; durable user/event/ledger data remains handled by T011 persistence.
- `/admin/expire-cohorts` remains a local/dev operational endpoint until T020 secures admin endpoints.

Next Recommended Step:
- Execute T013, T014, T015, or T017 depending on whether product monetization/distribution, lifecycle controls, or launch-readiness documentation is the priority. T013 is the next lowest-numbered unblocked task.

### 2026-06-12 21:02 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `tests/create-cohort.test.mjs`
- `tests/mvp-verification.test.mjs`
- `src/server/app.mjs`
- `src/persistence/seeds.mjs`

Decided:
- Classified the user request as approved manager-led change/fix work and selected T016 because it was the current verification blocker before UI bug testing.
- Kept production validation intact: first meetings must remain after the 14-day quorum window.
- Added request-handler option injection so route-level tests can use the same fixed clock pattern already used by service tests.
- Wired the stale create-flow and MVP verification route tests to a fixed `2026-06-01T12:00:00.000Z` clock, making their `2026-06-20` first meeting fixture valid regardless of the real current date.
- Marked T016 done after focused route tests and full project verification passed.

Assumptions Made:
- The immediate UI bug test should use the normal dev server behavior with the real current date, while automated tests should use explicit clocks.
- T017 deployment target selection remains the next launch-readiness task after T012 auth and T016 verification repair.

Next Recommended Step:
- Start UI bug testing against the local dev server, then execute T012 when ready to continue launch hardening.

### 2026-05-31 08:55 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `src/persistence/store.mjs`
- `src/persistence/repositories.mjs`
- `src/persistence/seeds.mjs`
- `src/server/app.mjs`
- `tests/persistence-ledger.test.mjs`
- `README.md`
- `src/persistence/README.md`

Decided:
- Classified the user request as approved main implementation work and selected T011 as the next unblocked critical-path task.
- Kept durable persistence dependency-free by adding a JSON-file store behind the existing synchronous repository boundary instead of introducing a database dependency before auth/payment requirements are known.
- Wired durable local mode through `COHORT15_PERSISTENCE_FILE`, with in-memory repositories remaining the default for isolated tests and demos.
- Updated demo seeding so durable stores receive seed users and grants only when missing, preventing duplicate seed grant transactions on reload.
- Marked T011 done after focused persistence tests and full project verification passed.

Assumptions Made:
- JSON-file persistence is sufficient for this local post-MVP hardening step because the task asks for durable local persistence and does not require concurrent production writes.
- Later auth, purchase, and social publishing tasks should continue using repository contracts rather than reaching into the JSON storage format.

Next Recommended Step:
- Execute T012: replace demo query/default-user identity with a regular auth/session boundary for protected flows.

### 2026-05-30 07:50 EDT

Read:
- `start.txt`
- `agent-starters/startSetupManager.txt`
- `README.md`
- `USAGE.md`
- `schemas/main-task.schema.json`
- `agent/router/intent-router.md`
- `plan.md`
- `tasks.json`
- `atomic-task-graph.md`
- `agent/knowledge/index.md`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/blockers.md`
- `agent/progress/change-log.md`
- `docs/cohort15-mvp-spec-v3.md`

Decided:
- Classified the user request as approved setup/bootstrap work because the user explicitly asked to activate the setup manager and add the next atomic task graph set.
- Preserved T001-T010 as the completed MVP ledger and added T011-T015 as the next post-MVP task wave.
- Ordered the next wave as durable persistence first, then auth, then credit purchases/social publishing/lifecycle controls.
- Updated the plan, atomic task graph, task ledger, readable task status, knowledge index, and progress logs.

Assumptions Made:
- The next set should target urgent post-MVP gaps already recorded in the plan and knowledge index rather than adding speculative features.
- Durable persistence should precede auth, purchase, and external publishing work because those flows need stable user, ledger, and outbox records.
- Payment provider, auth provider, durable store, official social channels, and social credentials remain unspecified and should be handled as documented implementation assumptions during their tasks.

Next Recommended Step:
- Execute T011 with `agent-starters/startNewManager.txt`: add durable persistence behind the existing repository boundary.

### 2026-05-30 07:42 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- current service, server, UI, README, and test modules needed for T010

Decided:
- Classified the user request as approved main implementation work and selected T010 as the only remaining unblocked task.
- Added one focused MVP verification test file covering both handoff-critical paths: creation through social outbox, feed/detail privacy, quorum activation, dashboards, and expiry/refund processing.
- Expanded README handoff documentation with demo users, local flow steps, manual expiry trigger, local social outbox behavior, MVP boundary, post-MVP credit packages, and known assumptions.
- Marked T010 done after full verification passed.

Assumptions Made:
- The README should document the current in-memory/demo-auth MVP honestly instead of implying production persistence, scheduler, auth, or social API behavior.
- The browser policy block during feed/unlock smoke does not block T010 because the new automated verification covers the feed, detail, quorum unlock, dashboard, and expiry/refund behavior end to end.

Next Recommended Step:
- Hand the MVP to user testing or begin post-MVP planning for real auth, durable persistence, USD credit purchases, and external social posting.

### 2026-05-30 00:59 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/blockers.md`
- `docs/cohort15-mvp-spec-v3.md`
- existing service, persistence, server, UI, and test modules touched by T007-T009

Decided:
- Classified the user request as approved main implementation work and selected the remaining unblocked implementation wave: T007, T008, and T009.
- Added expiry/refund processing for overdue open cohorts, with a dev/admin POST trigger and refund transactions rather than balance mutation.
- Added local social promotion outbox generation on cohort creation, keeping real social APIs post-MVP and excluding private links from post text.
- Added creator and participant dashboards with MVP credit summaries and private-link visibility routed through the existing authorization serializer.

Assumptions Made:
- The admin expiry route is a local/dev trigger for MVP verification, not a production scheduler or auth model.
- The local social outbox uses a pending post on platform `x` as the first official-channel placeholder.
- Dashboard user selection continues the existing demo query/default-user auth path until regular auth is specified.

Next Recommended Step:
- Execute T010: final MVP verification pass and docs update now that T007, T008, and T009 are complete.

### 2026-05-30 00:48 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/blockers.md`
- `docs/cohort15-mvp-spec-v3.md`
- `src/domain/constants.mjs`
- `src/domain/validation.mjs`
- `src/persistence/repositories.mjs`
- `src/persistence/credit-ledger.mjs`
- `src/persistence/seeds.mjs`
- `src/services/create-cohort.mjs`
- `src/services/event-browsing.mjs`
- `src/server/app.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/styles.css`
- existing tests

Decided:
- Selected T006 as the next wave because it is the critical-path task after T005 and unlocks expiry/refund plus dashboards.
- Added a dedicated show-interest service that validates open cohorts, existing participants, duplicate active/consumed interest, participant caps, and credit availability before recording the interest hold.
- Kept quorum activation in the interest service: when active interest count reaches `minQuorum`, the event becomes active, creator and participant holds are consumed, and active interests become consumed.
- Updated event browsing so consumed participants remain authorized to view active private links.

Assumptions Made:
- Demo user selection on the detail page remains the temporary auth path for interest actions.
- Once quorum is met, consumed interests still represent committed participants for active-link authorization.
- Creators cannot show interest in their own cohort.

Next Recommended Step:
- Execute T007: build expiry and refund processing for open events past `expiresAt`, refunding creator and participant holds and keeping expired private links hidden.

### 2026-05-30 00:41 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `docs/cohort15-mvp-spec-v3.md`
- `src/domain/validation.mjs`
- `src/persistence/repositories.mjs`
- `src/server/app.mjs`
- `src/ui/home.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/styles.css`
- existing tests

Decided:
- Classified the user request as approved main implementation work.
- Selected T005 as the next wave because it was the critical-path unblocked task after T004.
- Added a dedicated event browsing service so public feed/detail visibility can be tested without embedding rules directly in routes.
- Kept mutation behavior out of scope; participant interest and quorum unlock remain T006.

Assumptions Made:
- Until full auth is implemented, detail routes can accept a demo `viewerId` query parameter to exercise the existing creator/interested-user link visibility policy.
- The public feed should list only `open` and `active` events; expired/cancelled/completed cohorts are not public discovery items for this MVP surface.

Next Recommended Step:
- Execute T006: build show-interest and quorum unlock flow on top of the new detail page and existing credit ledger.

### 2026-05-30 00:33 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/blockers.md`
- `docs/cohort15-mvp-spec-v3.md`
- `src/domain/constants.mjs`
- `src/domain/validation.mjs`
- `src/persistence/repositories.mjs`
- `src/persistence/credit-ledger.mjs`
- `src/persistence/seeds.mjs`
- `src/server/app.mjs`
- `src/ui/home.mjs`

Decided:
- Classified the user request as approved main implementation work.
- Selected T004 as the next wave because T003 was done and T004 was the critical-path unblocked task.
- Implemented create cohort behavior through a small service layer and demo-backed HTTP form route.
- Kept the route scoped to creation, validation, and creator credit holds; feed/detail, participant interest, quorum, and social outbox remain separate tasks.

Assumptions Made:
- Demo seed users are the temporary auth path for this wave because regular auth provider remains unspecified.
- The create success page should not display the private event link; it reports the link remains locked until quorum.

Next Recommended Step:
- Execute T005: build public event feed and detail visibility using the created events and existing locked-link serializer.

### 2026-05-30 00:28 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `atomic-task-graph.md`
- `agent/progress/blockers.md`
- `agent/progress/change-log.md`
- `docs/cohort15-mvp-spec-v3.md`
- `src/domain/constants.mjs`
- `src/domain/models.mjs`
- `src/domain/validation.mjs`
- `tests/domain-validation.test.mjs`

Decided:
- Classified the user request as approved main implementation work.
- Selected T003 as the next wave because T001 and T002 were done and T003 was the only unblocked critical-path task.
- Kept persistence dependency-free by adding in-memory repositories plus explicit schema metadata instead of introducing a database package.
- Implemented credit balances as values derived from auditable grant, hold, consume, refund, and future purchase transaction records.

Assumptions Made:
- MVP persistence can start as in-memory storage because the selected scaffold is dependency-free and later database migration can follow the schema metadata.
- Credit transaction amounts are positive; ledger semantics derive held, consumed, refunded, and available balances by transaction type.

Next Recommended Step:
- Execute T004: build the create cohort flow using the repository and credit ledger APIs from T003.

### 2026-05-30 00:18 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `docs/cohort15-mvp-spec-v3.md`
- `src/domain/constants.mjs`
- `tests/foundation.test.mjs`

Decided:
- Classified the user request as approved main implementation work.
- Selected T002 as the next wave because T001 was done and T002 was the only unblocked critical-path task.
- Kept the wave scoped to dependency-free domain modules and focused tests, with no persistence or UI integration.

Assumptions Made:
- With no TypeScript toolchain in the dependency-free scaffold, typed domain concepts are represented with JSDoc typedefs and frozen enum constants.
- Locked links should remain hidden for open events and should be visible after activation only to the creator or viewers already associated with interest.

Next Recommended Step:
- Execute T003: add persistence schema/repositories and credit ledger primitives using the domain validators from T002.

### 2026-05-30 00:13 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `plan.md`
- `docs/cohort15-mvp-spec-v3.md`

Decided:
- Classified the user request as approved main implementation work.
- Selected T001 as the first wave because it was the only unblocked implementation task.
- Chose a dependency-free Node.js HTTP + ES modules scaffold so the app, lint, and tests can run locally without package downloads.

Assumptions Made:
- A dependency-free Node app is the pragmatic starting stack until product needs justify a larger framework.
- T001 should stop at a runnable foundation and not implement domain validation or product flows.

Next Recommended Step:
- Execute T002: implement Cohort15 domain models and validation rules in `src/domain` with focused tests.

### 2026-05-30 00:02 EDT

Read:
- User clarification that this is discussion and that credit sales with USD plus event advertising on socials can come next if urgent, while everything else needs to be built.
- Existing `plan.md`, `tasks.json`, `atomic-task-graph.md`, and `agent/knowledge/index.md` references to MVP, credits, and social promotion.

Decided:
- Clarified MVP scope: build core cohort creation, discovery, interest, quorum, expiry/refund, private link visibility, dashboards, credit ledger, admin/demo grants, and social outbox.
- Moved USD credit purchases and real external social posting to post-MVP / urgent-next.
- Recorded initial post-MVP pricing assumptions: `$6` for 6 credits and `$12` for 14 credits.

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
- Initialized a 10-task MVP graph covering scaffold, domain validation, persistence/credit ledger, create flow, feed/detail visibility, interest/quorum, expiry/refunds, social outbox, dashboards, and final verification.
- Kept setup limited to planning and tracker artifacts per setup manager rules; product code implementation should begin with T001.

Assumptions Made:
- The first implementation task may choose a pragmatic web stack because no stack is specified.
- Real social posting is deferred until official channels and credentials are provided; initial implementation should use a local/mock social outbox.
- Seed/demo credit grants are acceptable until a product credit funding model is specified.
- Auth provider and deployment target are open implementation questions, not setup blockers.

Next Recommended Step:
- Start `agent-starters/startNewManager.txt` and execute T001 from `tasks.json`.

### 2026-06-17 EDT

Read:
- `start.txt`
- `agent-starters/startNewManager.txt`
- `agent/knowledge/index.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `atomic-task-graph.md`
- `plan.md`

Decided:
- Treated the user request as manager planning work for a production-ready MVP dependency graph.
- Incorporated user decisions that Stripe is required for MVP payments, Supabase Auth is required with Google and GitHub login plus optional magic-link/email login, Supabase Postgres is the production datastore, and MVP social publishing targets LinkedIn, X, and Email.
- Replaced the old mock/post-MVP launch tasks with T013-T030 covering deployment, config/secrets, Supabase Auth, Supabase Postgres, session/CSRF hardening, admin controls, Stripe purchases and webhooks, selected social publishing, credit bootstrap, upload hardening, logging/audit, lifecycle decision, security review, and production smoke testing.
- Preserved completed T001-T012 and T016 evidence while aligning the human-readable graph, status view, plan, and knowledge index to the new production-MVP boundary.

Assumptions Made:
- The deployment target is still open and should be selected before provider callback URLs, Stripe webhook configuration, and social credentials are finalized.
- Magic-link/email login is optional in production config, while Google and GitHub login are required.
- LinkedIn, X, and Email are the complete MVP social scope unless the user changes launch-channel priority.

Next Recommended Step:
- Execute T013: choose and document the production deployment target.

### 2026-06-17 EDT

Read:
- User clarification that provider-dependent work should give exact human steps, links, file paths, env var names, and checkpoints.
- `tasks.json`
- `atomic-task-graph.md`
- `plan.md`
- `agent/knowledge/index.md`

Decided:
- Added a project-wide Human Setup Checklist standard for any task that requires human action outside the repository.
- Applied the checklist requirement to every remaining production-MVP task T013-T030 except already-completed T016.
- Required future agents to use current official provider docs or dashboard links, exact dashboard navigation, exact callback/webhook/redirect values, exact local file paths, exact env var names, secret warnings, verification steps, and clear continue/block checkpoints.

Assumptions Made:
- Provider setup instructions should be operator-grade and should not ask the user to paste secrets into chat.
- Future agents should continue any local implementation that is not blocked by external provider setup.

Next Recommended Step:
- Execute T013 with the new Human Setup Checklist standard.

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
