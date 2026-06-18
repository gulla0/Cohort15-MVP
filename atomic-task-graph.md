# Cohort15 Atomic Task Graph

## Atomic Task Rule

An atomic task is a bounded execution unit. The executor should not make workflow-level, scope-level, or design-level decisions while executing it.

Each executable task should define or tightly imply:

- Objective boundary: what exact operation is being performed.
- Input boundary: what files, schemas, endpoints, or artifacts are in scope.
- Authority boundary: what the executor may change or call.
- Evaluation boundary: what counts as done.
- Stop boundary: when the executor should stop.

## Human Setup Checklist Rule

Any task that requires human action outside the repository must start by identifying the human setup path before depending on that external setup. Its checklist or runbook must live in `docs/human-tasks/` and be linked from `docs/human-tasks/README.md`.

This applies to deployment, Supabase, Google/GitHub OAuth, Stripe, LinkedIn, X, Email, DNS, webhooks, callback URLs, hosting dashboards, production secrets, or any other provider/account setup.

The executor must:

- Research current official provider documentation or dashboard instructions when provider setup details may have changed.
- Provide exact dashboard or documentation links.
- Provide exact dashboard navigation paths.
- Provide exact callback, webhook, redirect, app URL, or DNS values to enter.
- Provide exact local file paths to edit, such as `/Users/gzero/Desktop/cohort15/cohort15-mvp/.env.local`, when local changes are needed.
- Provide exact environment variable names.
- Clearly label secrets and state that secrets should not be pasted into chat.
- Separate what the agent can implement immediately from what is blocked on human setup.
- Provide verification steps the user can run or inspect.
- End blocked external setup instructions with a clear checkpoint, such as "tell me when this is done."

The executor should continue with non-blocked local implementation when possible and stop only when external setup is genuinely required before safe progress can continue.

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

### Phase 5 - Production MVP Readiness

- T016 Repair time-sensitive MVP verification tests
  - Depends on: T011
  - Objective: Make create-flow and MVP verification tests deterministic so the 14-day quorum-window rule does not fail as calendar time advances.
  - Inputs: create-flow tests, MVP verification tests, server app wiring, create cohort service, event validation
  - Authority: update stale fixtures or add test-only/fixed-clock support; do not weaken production validation
  - Validation: route and MVP verification tests pass regardless of the real current date; full verification passes
  - Stop: stop once the stale date dependency is removed and `npm run check` passes

- T013 Choose and document production deployment target
  - Depends on: T012, T016
  - Objective: Select the first production host and document runtime, deploy, start, health check, rollback, and app URL assumptions.
  - Inputs: README, package scripts, server app, plan
  - Authority: add deployment docs and minimal host config; do not commit credentials
  - Validation: concrete target, commands, app URL/domain assumptions, and rollback/redeploy basics are documented
  - Stop: stop once a specific production deployment runbook exists

- T014 Add production configuration and secrets boundary
  - Depends on: T013
  - Objective: Define runtime configuration for production, including Supabase, Stripe, social publishing, admin access, cookies, app URL, uploads, and local/demo mode separation.
  - Inputs: server app, README, package scripts
  - Authority: add config parsing, example env docs, startup validation, and tests; do not commit real secrets
  - Validation: required/optional env vars are documented, production config fails clearly when missing, local development remains explicit, and secrets are not logged
  - Stop: stop once config and secrets handling are explicit, tested, and documented

- T015 Integrate Supabase Auth account boundary
  - Depends on: T014
  - Objective: Implement production authentication with Supabase Auth using Google login, GitHub login, and optional magic-link/email login while preserving local seeded auth only for development.
  - Inputs: auth/session modules, server routes, auth UI, README
  - Authority: add Supabase auth adapter/callback handling, session integration, auth UI, tests, and docs
  - Validation: production users can sign in/out, protected routes use Supabase-backed identity, seeded users are development-only, and anonymous/wrong-user access is rejected
  - Stop: stop once production auth identity replaces demo users for production protected flows

- T017 Add Supabase Postgres production persistence adapter
  - Depends on: T014, T015
  - Objective: Move production persistence from local JSON to Supabase Postgres while preserving repository contracts and transaction-derived credit ledger semantics.
  - Inputs: persistence schema, repositories, store, credit ledger, README
  - Authority: add Supabase Postgres adapter, schema/migrations or SQL docs, repository wiring, tests, and docs; do not embed credentials
  - Validation: users, cohorts, interests, credit transactions, social posts, purchases, and auth-linked records persist in Supabase Postgres; credit writes are safe under concurrent usage
  - Stop: stop once production persistence is selectable, documented, and covered by tests or a documented integration path

- T018 Harden production sessions and CSRF behavior
  - Depends on: T015, T017
  - Objective: Make authenticated browser mutations launch-safe with production cookie/session settings and CSRF protection or an explicit equivalent strategy.
  - Inputs: auth/session modules, server routes, UI forms, README
  - Authority: add session/cookie hardening, CSRF controls, route tests, and docs
  - Validation: secure production cookie behavior, session expiration/sign-out invalidation, and invalid session/CSRF rejection are tested or documented
  - Stop: stop once session and mutation protection are production-MVP safe

- T019 Secure admin and operational endpoints
  - Depends on: T014, T015, T018
  - Objective: Lock down administrative operations including cohort expiry, social publishing operations, and payment/social operational retries.
  - Inputs: server app, expiry service, README
  - Authority: add admin authorization checks, admin role/config handling, route tests, and operational docs
  - Validation: unauthenticated and non-admin users cannot invoke admin operations; authorized admin or operational callers can process expiry
  - Stop: stop once all operational endpoints are protected and documented

- T020 Implement Stripe credit purchase packages
  - Depends on: T014, T015, T017
  - Objective: Replace the Buy Credits placeholder with real Stripe-backed purchases for `$6`/6-credit and `$12`/14-credit packages.
  - Inputs: credit ledger, persistence schema, server routes, UI, README
  - Authority: add Stripe checkout integration, purchase service, purchase routes/UI, ledger purchase transactions, tests, and docs; do not store card data or hard-code secrets
  - Validation: authenticated users can buy both packages; successful verified payment creates auditable credit transactions; failed/cancelled payments do not grant credits
  - Stop: stop once Stripe-backed package purchases work in production mode and local/test mode is documented

- T021 Add Stripe webhook idempotency and purchase reconciliation
  - Depends on: T020
  - Objective: Make Stripe fulfillment reliable by handling webhooks, duplicate events, pending/failed states, and reconciliation metadata.
  - Inputs: server app, persistence schema/repositories, credit ledger
  - Authority: add webhook route, purchase state persistence, idempotency checks, reconciliation docs, and tests
  - Validation: duplicate Stripe events do not double-grant credits; payment states are represented; credit grants happen only after verified payment success
  - Stop: stop once Stripe fulfillment is idempotent and auditable

- T022 Configure MVP social channels
  - Depends on: T014
  - Objective: Define the MVP social publishing scope and credentials for LinkedIn, X, and Email.
  - Inputs: social promotion service, README, plan
  - Authority: add social configuration docs, channel constants/config, and format constraints
  - Validation: LinkedIn, X, and Email are documented as launch channels; required credentials/env vars and dry-run/live behavior are documented
  - Stop: stop once selected social channels and configuration requirements are explicit

- T023 Implement LinkedIn, X, and Email social publishing adapters
  - Depends on: T017, T022
  - Objective: Publish pending social outbox records through LinkedIn, X, and Email adapters with persisted status handling and no private-link leakage.
  - Inputs: social promotion service, repositories, server app, README
  - Authority: add adapter boundary, selected channel adapters, outbox processor, status persistence, tests, and docs; do not hard-code credentials
  - Validation: pending posts process through configured adapters; posted/failed status persists; tests prove private links are never published
  - Stop: stop once selected MVP channels can publish or dry-run through configured adapters

- T024 Add admin controls for social publishing
  - Depends on: T019, T023
  - Objective: Restrict live social publishing and retry operations to admin or operational authorization.
  - Inputs: server app, social promotion service, dashboards/admin UI, README
  - Authority: add admin social routes/controls, retry/process handlers, authorization tests, and docs
  - Validation: admins can process/retry pending social posts; non-admin users cannot trigger live publishing; failures are visible without exposing secrets/private links
  - Stop: stop once live social publishing is operationally controlled

- T025 Define production credit bootstrap policy
  - Depends on: T015, T017, T020
  - Objective: Remove production reliance on demo seed grants by defining how real users receive credits at launch.
  - Inputs: seed data, credit ledger, README
  - Authority: change credit bootstrap behavior/config, seed behavior, docs, and tests
  - Validation: new-user credit policy is documented; demo seed grants are development-only; production credits come from Stripe purchases or explicit admin/launch grants
  - Stop: stop once production starting credit behavior is explicit and auditable

- T026 Harden or constrain production image uploads
  - Depends on: T014, T017
  - Objective: Make event image uploads safe for production, or explicitly disable custom uploads in production while preserving default/URL image behavior.
  - Inputs: server upload handling, create cohort UI, README
  - Authority: add upload storage/config, validation hardening, static serving policy, tests, and docs
  - Validation: production upload mode is documented; uploads are safely stored or disabled; file type/size/path protections are tested
  - Stop: stop once production upload behavior is safe or intentionally constrained

- T027 Add production logging, audit, and health checks
  - Depends on: T014, T017, T019, T021, T023
  - Objective: Add minimal operational visibility for health, errors, auth/admin failures, credit ledger movements, Stripe purchases, and social publishing without leaking sensitive data.
  - Inputs: server app, credit ledger, social promotion service, README
  - Authority: add logging helpers, health/readiness behavior, audit events, monitoring docs, and tests where practical
  - Validation: health endpoint is production-suitable; payment/credit/admin/social actions have minimal audit trail; sensitive values are excluded from logs
  - Stop: stop once MVP operations are diagnosable without leaking sensitive data

- T028 Decide and implement MVP lifecycle controls
  - Depends on: T019
  - Objective: Implement or explicitly defer launch lifecycle actions for cancelled and completed cohorts, with at minimum an operational cancellation/refund path if needed.
  - Inputs: expiry service, server app, dashboards, README
  - Authority: add lifecycle decision doc, cancel/complete services if implemented, route/UI controls if implemented, and tests
  - Validation: launch decision is documented; implemented cancellation refunds held credits; implemented completion does not refund consumed credits; deferred scope has an operational workaround
  - Stop: stop once lifecycle launch scope is implemented or explicitly deferred

- T029 Complete production MVP security and privacy review
  - Depends on: T018, T019, T021, T024, T026, T027, T028
  - Objective: Review launch-critical behavior after real auth, Supabase persistence, Stripe payments, selected social publishing, admin controls, uploads, and logging are in place.
  - Inputs: domain, persistence, services, server, UI, tests, README
  - Authority: make focused fixes for launch blockers and document residual risks
  - Validation: auth/session/CSRF, private-link leakage, credit/Stripe integrity, admin authorization, social publishing, uploads, and logging privacy are reviewed
  - Stop: stop once launch-blocking privacy/security findings are fixed or explicitly accepted

- T030 Run production MVP smoke test
  - Depends on: T029
  - Objective: Create and run the final production-MVP smoke checklist against the selected production-like environment.
  - Inputs: README, USAGE, tests, deployment docs
  - Authority: add smoke checklist, verification notes, and small blocker fixes if found
  - Validation: sign-in, Stripe purchase, create, feed/search/detail, interest, quorum, dashboard, expiry/refund, private-link authorization, LinkedIn/X/Email publishing, admin protection, and log privacy pass
  - Stop: stop once production MVP smoke passes or launch blockers are reported

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
T012, T016 -> T013
T013 -> T014
T014 -> T015, T022, T026
T015 -> T017, T018, T019, T020, T025
T017 -> T018, T020, T023, T025, T026, T027
T018 -> T019, T029
T019 -> T024, T027, T028, T029
T020 -> T021, T025
T021 -> T027, T029
T022 -> T023
T023 -> T024, T027
T024 -> T029
T026 -> T029
T027 -> T029
T028 -> T029
T029 -> T030
```
