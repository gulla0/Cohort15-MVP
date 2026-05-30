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

- T003 Add persistence schema and token ledger primitives
  - Depends on: T002
  - Objective: Create storage for users, events, event interests, token transactions, and social posts, with auditable token balance helpers.
  - Inputs: domain model from T002, selected persistence layer from T001
  - Authority: change persistence schema, migrations/seeds, repository/data-access modules, and related tests
  - Validation: tests or scripted checks prove hold, consume, refund, and grant records affect balances as expected
  - Stop: stop before user-facing create/interest flows

### Phase 2 - Core Cohort Flow

- T004 Build create cohort flow
  - Depends on: T003
  - Objective: Let an authenticated or demo user create a cohort event by holding 2 tokens and creating an open event with `expiresAt = createdAt + 14 days`.
  - Inputs: event form requirements from spec, token ledger primitives from T003
  - Authority: change create-event UI/routes/actions/controllers and related tests
  - Validation: creator without enough tokens cannot create; creator with enough tokens gets an open event and 2-token hold
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
  - Objective: Let participants hold 1 token to show interest, prevent duplicate/over-capacity interest, and activate the cohort when active interest count reaches `minQuorum`.
  - Inputs: EventInterest and TokenTransaction rules from spec, existing event detail flow
  - Authority: change interest mutation logic, quorum service, token transaction usage, and related UI/tests
  - Validation: interest creates a 1-token hold; quorum consumes held creator/participant tokens, sets status `active`, and reveals the link only after activation
  - Stop: stop before expiry automation

- T007 Build expiry and refund processing
  - Depends on: T006
  - Objective: Expire open events past `expiresAt` that have not met quorum and refund all held creator/participant tokens.
  - Inputs: expiry rule from spec, token ledger from T003, interest flow from T006
  - Authority: change expiry job/service, admin/dev trigger if needed, and related tests
  - Validation: expired events become `expired`, held tokens are refunded, and private links remain hidden
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
  - Objective: Provide dashboard views for creators and participants showing relevant cohorts, statuses, token holds, and unlocked links where allowed.
  - Inputs: event, interest, and token data from prior tasks
  - Authority: change dashboard UI/routes and data loaders only
  - Validation: creator sees owned events; participant sees interested events; link visibility follows event status and authorization
  - Stop: stop before broad polish or analytics

- T010 Add MVP verification pass and docs
  - Depends on: T007, T008, T009
  - Objective: Add final coverage and documentation for the core success path, expiry path, token accounting, and local operation.
  - Inputs: completed MVP tasks, README/USAGE conventions
  - Authority: change tests, docs, and small defects found during verification; avoid new feature scope
  - Validation: automated checks pass and README describes setup, run, test, seed/demo data, and known assumptions
  - Stop: stop once the MVP can be handed to user testing

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
```
