# Cohort15 Atomic Task Graph

## Atomic Task Rule

An atomic task is a bounded execution unit. The executor should not make workflow-level, scope-level, or design-level decisions while executing it.

Each executable task should define or tightly imply:

- Objective boundary: what exact operation is being performed.
- Input boundary: what files, schemas, endpoints, or artifacts are in scope.
- Authority boundary: what the executor may change or call.
- Evaluation boundary: what counts as done.
- Stop boundary: when the executor should stop.

## Task Graph

### Phase 1 - Product Scaffold And Domain Foundation

- T001 Scaffold runnable app foundation
  - Depends on: none
  - Objective: Choose a pragmatic web app stack for this empty product repo and create the minimal runnable application, lint/test scripts, and README setup notes.
  - Inputs: `docs/cohort15-mvp-spec-v3.md`, `plan.md`, repository tree
  - Authority: create product source, config, package, and test harness files; do not implement full product flows
  - Validation: app starts locally, baseline checks pass, README documents commands
  - Stop: stop once the foundation is runnable and ready for domain work

- T002 Implement domain types and validation rules
  - Depends on: T001
  - Objective: Add typed Cohort15 domain models and validation for event fields, recurrence, quorum, participant cap, expiry default, and link visibility policy.
  - Inputs: `docs/cohort15-mvp-spec-v3.md`, app source from T001
  - Authority: change domain/model modules and focused tests only
  - Validation: validation tests cover accepted and rejected event inputs from the spec
  - Stop: stop before persistence or UI integration

- T003 Add persistence schema and credit ledger primitives
  - Depends on: T002
  - Objective: Create storage for users, events, event interests, credit transactions, and social posts, with auditable credit balance helpers.
  - Inputs: domain model from T002, selected persistence layer from T001
  - Authority: change persistence schema, migrations/seeds, repository/data-access modules, and related tests
  - Validation: tests or scripted checks prove hold, consume, refund, and grant records affect balances as expected
  - Stop: stop before user-facing create/interest flows

### Phase 2 - Core Cohort Flow

- T004 Build create cohort flow
  - Depends on: T003
  - Objective: Let an authenticated or demo user create a cohort event by holding 2 credits and creating an open event with `expiresAt = createdAt + 14 days`.
  - Inputs: event form requirements from spec, credit ledger primitives from T003
  - Authority: change create-event UI/routes/actions/controllers and related tests
  - Validation: creator without enough credits cannot create; creator with enough credits gets an open event and 2-credit hold
  - Stop: stop before participant interest and quorum handling

- T005 Build public event feed and detail visibility
  - Depends on: T004
  - Objective: Show open/active cohort events in a public feed and event detail page while hiding `lockedEventLink` until quorum unlocks it for authorized users.
  - Inputs: event fields from spec, create flow from T004
  - Authority: change feed/detail UI/routes and visibility tests
  - Validation: public pages show public fields and never leak private links for open events
  - Stop: stop before interest mutation behavior

- T006 Build show-interest and quorum unlock flow
  - Depends on: T005
  - Objective: Let participants hold 1 credit to show interest, prevent duplicate/over-capacity interest, and activate the cohort when active interest count reaches `minQuorum`.
  - Inputs: EventInterest and CreditTransaction rules from spec, existing event detail flow
  - Authority: change interest mutation logic, quorum service, credit transaction usage, and related UI/tests
  - Validation: interest creates a 1-credit hold; quorum consumes held creator/participant credits, sets status `active`, and reveals the link only after activation
  - Stop: stop before expiry automation

- T007 Build expiry and refund processing
  - Depends on: T006
  - Objective: Expire open events past `expiresAt` that have not met quorum and refund all held creator/participant credits.
  - Inputs: expiry rule from spec, credit ledger from T003, interest flow from T006
  - Authority: change expiry job/service, admin/dev trigger if needed, and related tests
  - Validation: expired events become `expired`, held credits are refunded, and private links remain hidden
  - Stop: stop before dashboards and social promotion outbox

### Phase 3 - MVP Surfaces And Promotion Outbox

- T008 Build social promotion outbox
  - Depends on: T004
  - Objective: Generate a public-safe local social post/outbox record when a cohort is created, containing required public fields and excluding the private link.
  - Inputs: social promotion section from spec, event creation flow from T004
  - Authority: change social post model/service, create flow integration, and tests; do not add real external API posting in MVP
  - Validation: new events create local pending/posted/failed social outbox records with public event page links and no private link
  - Stop: stop after local/mock promotion is represented and verifiable

- T009 Build creator and participant dashboards
  - Depends on: T006
  - Objective: Provide dashboard views for creators and participants showing relevant cohorts, statuses, credit holds, and unlocked links where allowed.
  - Inputs: event, interest, and credit data from prior tasks
  - Authority: change dashboard UI/routes and data loaders only
  - Validation: creator sees owned events; participant sees interested events; link visibility follows event status and authorization
  - Stop: stop before broad polish or analytics

- T010 Add MVP verification pass and docs
  - Depends on: T007, T008, T009
  - Objective: Add final coverage and documentation for the core success path, expiry path, credit accounting, and local operation.
  - Inputs: completed MVP tasks, README/USAGE conventions
  - Authority: change tests, docs, and small defects found during verification; avoid new feature scope
  - Validation: automated checks pass and README describes setup, run, test, seed/demo data, and known assumptions
  - Stop: stop once the MVP can be handed to user testing

### Phase 4 - Post-MVP Hardening

- T011 Add durable persistence adapter
  - Depends on: T010
  - Objective: Replace or augment the in-memory repositories with a durable local persistence adapter while preserving repository contracts and credit ledger semantics.
  - Inputs: persistence schema/repositories, credit ledger, seed data, persistence tests, MVP verification tests
  - Authority: add durable local database adapter, schema/migrations, initialization wiring, and tests; do not implement auth, payment, or social API behavior
  - Validation: users, events, interests, credit transactions, and social posts persist across app restarts; existing credit accounting still passes
  - Stop: stop once durable persistence is available behind the repository boundary and documented

- T012 Replace demo user selection with regular auth boundary
  - Depends on: T011
  - Objective: Add a regular authentication boundary so protected flows use the signed-in user instead of demo query parameters or default users.
  - Inputs: server routes, create/interest/dashboard/event-browsing services, README auth assumptions
  - Authority: add local/session auth modules, route guards, sign-in/out UI, and auth tests; do not add OAuth provider integrations unless specified
  - Validation: unauthenticated mutations and dashboards are rejected; signed-in users can create, show interest, view scoped dashboards, and see only authorized private links
  - Stop: stop once user identity is resolved through the auth boundary for all protected MVP flows

### Phase 5 - Post-MVP Monetization And Distribution

- T013 Add credit purchase package flow
  - Depends on: T011, T012
  - Objective: Add the first credit purchase flow for the documented packages, recording purchase transactions without breaking grant or hold accounting.
  - Inputs: plan credit package assumptions, credit ledger, persistence schema, dashboards, server routes
  - Authority: add credit package constants/services, purchase route/UI, purchase tests, and payment-mode docs; do not store card data or hard-code provider credentials
  - Validation: authenticated users can select `$6`/6-credit or `$12`/14-credit packages; successful local/mock purchases create auditable purchase transactions
  - Stop: stop once package purchase accounting works and payment-provider limitations are documented

- T014 Publish social outbox to configured external channels
  - Depends on: T011, T012
  - Objective: Turn the local social-promotion outbox into a publishable channel adapter flow for configured official channels.
  - Inputs: social promotion service, create flow integration, social post persistence, social promotion spec
  - Authority: add social adapter boundary, outbox processor, configuration docs, status handling, and tests; do not hard-code secrets
  - Validation: pending posts process through a configured adapter, posted/failed status is recorded, dry-run remains available, and private links are never sent
  - Stop: stop once external-channel publishing is adapter-backed, testable, and safely configurable

### Phase 6 - Post-MVP Lifecycle Controls

- T015 Add cohort completion and cancellation lifecycle handling
  - Depends on: T012
  - Objective: Implement bounded creator/admin lifecycle controls for cancelling open cohorts and completing active cohorts while preserving credit accounting and link visibility rules.
  - Inputs: domain statuses, expiry/credit refund behavior, dashboard surfaces, server routes
  - Authority: add lifecycle services, creator/admin route handlers, dashboard actions, and lifecycle tests; do not add broad moderation tooling
  - Validation: authorized users can cancel open cohorts with refunds and complete active cohorts without refunds; unauthorized lifecycle actions are rejected
  - Stop: stop once cancelled and completed lifecycle paths are implemented with tests and documented behavior

### Phase 7 - Launch Readiness

- T016 Repair time-sensitive MVP verification tests
  - Depends on: T011
  - Objective: Make create-flow and MVP verification tests deterministic so the 14-day quorum-window rule does not fail as calendar time advances.
  - Inputs: create-flow tests, MVP verification tests, server app wiring, create cohort service, event validation
  - Authority: update stale fixtures or add test-only/fixed-clock support; do not weaken production validation
  - Validation: route and MVP verification tests pass regardless of the real current date; full verification passes
  - Stop: stop once the stale date dependency is removed and `npm run check` passes

- T017 Choose and document deployment target
  - Depends on: T012, T016
  - Objective: Select the first web app deployment target and document the runtime, build, start, persistence, and environment assumptions.
  - Inputs: README, package scripts, server app, plan
  - Authority: add deployment docs and minimal host config; do not commit credentials
  - Validation: target, commands, environment variables, persistence assumptions, and rollback/redeploy basics are documented
  - Stop: stop once a specific deployment runbook exists

- T018 Add production-grade persistence plan and adapter
  - Depends on: T012, T017
  - Objective: Move launch persistence beyond local JSON while preserving repository contracts and credit ledger auditability.
  - Inputs: persistence schema, repositories, store, credit ledger, README
  - Authority: add provider-backed persistence adapter, schema/migrations, configuration docs, and tests; do not embed credentials
  - Validation: launch datastore persists users, events, interests, transactions, and social posts; credit balances remain transaction-derived
  - Stop: stop once launch persistence is selected, implemented or explicitly staged, and documented

- T019 Add environment and secrets configuration boundary
  - Depends on: T017
  - Objective: Define safe runtime configuration for auth, persistence, payment, social publishing, and deployment.
  - Inputs: server app, README, package scripts
  - Authority: add config parsing, example env docs, startup validation, and tests; do not commit real secrets
  - Validation: required/optional env vars are documented, launch config fails clearly when missing, and local development remains explicit
  - Stop: stop once config and secrets handling are explicit, tested, and documented

- T020 Secure admin and operational endpoints
  - Depends on: T012, T019
  - Objective: Lock down administrative actions such as cohort expiry processing so public users cannot invoke operational endpoints.
  - Inputs: server app, expiry service, README
  - Authority: add admin authorization checks, route tests, and operational docs
  - Validation: unauthorized admin requests are rejected; authorized admin or operational callers can process expiry
  - Stop: stop once admin endpoints are protected and documented

- T021 Add launch logging and monitoring hooks
  - Depends on: T017, T019
  - Objective: Add basic operational visibility through request/error logs, health behavior, and monitoring documentation.
  - Inputs: server app, README
  - Authority: add minimal structured logging and health/readiness docs; avoid logging private links or secrets
  - Validation: logs are useful and do not expose sensitive values; monitoring checklist is documented
  - Stop: stop once minimal launch observability exists

- T022 Complete launch privacy and security review
  - Depends on: T012, T018, T019, T020, T021
  - Objective: Review launch-critical privacy and security behavior around private links, auth, credit accounting, admin operations, logs, and social content.
  - Inputs: domain, services, server, persistence, tests, README
  - Authority: make focused fixes for confirmed launch blockers and document residual risks
  - Validation: private links are verified hidden from public pages, social posts, logs, and unauthorized users; findings are fixed or tracked
  - Stop: stop once launch-critical privacy and security findings are addressed or tracked

- T023 Create production launch smoke-test checklist
  - Depends on: T013, T014, T015, T018, T020, T022
  - Objective: Create and run a production-oriented smoke-test checklist covering launch-critical user and operator flows.
  - Inputs: README, USAGE, MVP spec, tests
  - Authority: add manual or scripted smoke checklist and record verification notes
  - Validation: checklist covers sign-in, credit balance, purchase, create, discovery, interest, quorum, expiry, cancellation, completion, dashboard, social publishing, admin operation, and private-link visibility
  - Stop: stop once launch smoke testing is documented and ready to execute against the selected environment

## Compact Adjacency View

```text
T001 -> T002
T002 -> T003
T003 -> T004
T004 -> T005, T008
T005 -> T006
T006 -> T007, T009
T007 -> T010
T008 -> T010
T009 -> T010
T010 -> T011
T011 -> T012, T016
T012 -> T013, T014, T015, T017, T018, T020, T022
T016 -> T017
T017 -> T018, T019, T021
T019 -> T020, T021, T022
T018 -> T022, T023
T020 -> T022, T023
T021 -> T022
T013 -> T023
T014 -> T023
T015 -> T023
T022 -> T023
```
