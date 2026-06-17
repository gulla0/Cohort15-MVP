# Change Log

Append-only implementation log.

### 2026-06-17 EDT

Task:
- T014 Add production configuration and secrets boundary

Files Changed:
- `.env.example`
- `.gitignore`
- `docs/production-config.md`
- `render.yaml`
- `src/config/runtime.mjs`
- `src/server/app.mjs`
- `tests/runtime-config.test.mjs`
- `README.md`
- `tasks.json`
- `agent/knowledge/index.md`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`

Summary:
- Added dependency-free runtime config parsing and production validation.
- Wired server startup through `loadRuntimeConfig`.
- Documented required and optional production env vars for Render, Supabase, Stripe, LinkedIn, X, email, admin access, app URL, sessions, and uploads.
- Added `.env.example` and ignored local `.env*` files while keeping the example tracked.
- Expanded `render.yaml` with production mode, app URL, disabled uploads, and `sync: false` placeholders for required secrets.

Verification:
- `node --test tests/runtime-config.test.mjs` passed with 6 tests.
- `npm run check` passed with 65 tests.

### 2026-06-17 EDT

Task:
- T013 Choose and document production deployment target

Files Changed:
- `docs/deployment-render.md`
- `render.yaml`
- `src/server/app.mjs`
- `README.md`
- `plan.md`
- `tasks.json`
- `agent/knowledge/index.md`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`

Summary:
- Selected Render Web Service `cohort15-mvp` as the first production deployment target.
- Added a Render deployment runbook with official docs links, dashboard setup steps, app URL/domain assumptions, env var names, secret-handling guidance, verification steps, and rollback instructions.
- Added `render.yaml` with Node 24, `npm install`, `npm start`, `/` health check, and auto-deploy off.
- Updated the server entry point to bind to `HOST` or `0.0.0.0` while preserving `PORT`.
- Updated README, plan, task ledger, status view, and knowledge index for the Render deployment decision.

Verification:
- `npm run check` passed.

### 2026-06-16 12:48 EDT

Task:
- T012 Replace demo user selection with regular auth boundary

Files Changed:
- `src/auth/session.mjs`
- `src/ui/auth.mjs`
- `src/server/app.mjs`
- `src/ui/home.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/dashboards.mjs`
- `src/ui/styles.css`
- `tests/create-cohort.test.mjs`
- `tests/show-interest.test.mjs`
- `tests/dashboards.test.mjs`
- `tests/event-browsing.test.mjs`
- `tests/mvp-verification.test.mjs`
- `README.md`
- `tasks.json`
- `agent/knowledge/index.md`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`

Summary:
- Added dependency-free local session auth with explicit `/auth/sign-in` and `/auth/sign-out`.
- Guarded create, show-interest, and dashboard routes with session-based identity.
- Removed protected-flow reliance on posted creator IDs, participant selectors, dashboard identity query parameters, and detail-viewer query parameters.
- Preserved conservative private-link authorization for signed-in creators and committed participants.
- Updated README and route tests for the local session auth assumption.

Verification:
- Focused auth route and MVP flow tests passed.
- `npm run check` passed with 59 tests.

### 2026-06-12 21:02 EDT

Task:
- T016 Repair time-sensitive MVP verification tests

Files Changed:
- `src/server/app.mjs`
- `tests/create-cohort.test.mjs`
- `tests/mvp-verification.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`

Summary:
- Added request-handler option injection so route-level tests can pass a fixed clock into the create cohort service.
- Updated stale create-flow and MVP verification tests to use a fixed `2026-06-01T12:00:00.000Z` clock instead of depending on the real current date.
- Preserved production first-meeting validation: first meetings must still occur after the 14-day quorum window.
- Marked T016 done after verification passed.

Verification:
- `node --test tests/create-cohort.test.mjs tests/mvp-verification.test.mjs` passed with 8 tests.
- `npm run check` passed with 44 tests.

### 2026-05-31 08:55 EDT

Task:
- T011 Add durable persistence adapter

Files Changed:
- `src/persistence/store.mjs`
- `src/persistence/repositories.mjs`
- `src/persistence/seeds.mjs`
- `src/server/app.mjs`
- `tests/persistence-ledger.test.mjs`
- `README.md`
- `src/persistence/README.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a dependency-free JSON file store that persists users, events, event interests, credit transactions, and social posts behind the existing repository API.
- Wired local durable mode through `COHORT15_PERSISTENCE_FILE`, leaving in-memory state as the default.
- Updated demo seeding to create seed users and seed grant transactions only when missing, so restarts do not duplicate demo credit grants.
- Added persistence reload coverage proving event/outbox records and derived held balances survive repository reinitialization.
- Documented local persistence configuration and reset behavior.

Verification:
- `node --test tests/persistence-ledger.test.mjs` passed with 7 tests.
- `npm run check` passed with 44 tests.

### 2026-05-30 07:50 EDT

Task:
- Setup manager planning update

Files Changed:
- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added post-MVP task wave T011-T015 for durable persistence, regular auth boundary, credit purchase packages, external social publishing adapters, and cancellation/completion lifecycle controls.
- Updated the human-readable atomic graph and compact adjacency view.
- Updated the plan with new post-MVP phases, urgent-next items, open implementation questions, and the new suggested first sprint.
- Updated task status and knowledge routes so the next manager can start with T011 without rediscovering the current MVP state.

Verification:
- `tasks.json` parsed successfully as JSON.
- `npm run check` passed with 36 tests.

### 2026-05-30 07:42 EDT

Task:
- T010 Add MVP verification pass and docs

Files Changed:
- `tests/mvp-verification.test.mjs`
- `README.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added full MVP verification coverage for the create/promote/privacy/quorum/dashboard success path.
- Added full MVP verification coverage for the create/interest/expiry/refund path, including public discovery removal and private-link non-leakage.
- Expanded README handoff documentation for local demo users, credit grants, MVP flow, expiry trigger, local social outbox, post-MVP credit packages, and known assumptions.
- Marked T010 done, completing the current main MVP task ledger.

Verification:
- `npm run check` passed with 36 tests.
- `npm run dev` started at `http://localhost:3000` after sandbox escalation.
- In-app browser smoke verified the create page and successful cohort creation state without exposing the private link. Browser feed/unlock follow-up was blocked by browser URL policy; automated tests cover that flow end to end.

### 2026-05-30 00:59 EDT

Task:
- T007 Build expiry and refund processing
- T008 Build social promotion outbox
- T009 Build creator and participant dashboards

Files Changed:
- `src/services/expire-cohorts.mjs`
- `src/services/social-promotion.mjs`
- `src/services/dashboards.mjs`
- `src/services/create-cohort.mjs`
- `src/server/app.mjs`
- `src/ui/dashboards.mjs`
- `src/ui/styles.css`
- `tests/expire-cohorts.test.mjs`
- `tests/social-promotion.test.mjs`
- `tests/dashboards.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added expiry processing for overdue open cohorts that marks events expired, refunds creator and participant holds through credit transactions, and marks active interests refunded.
- Added `POST /admin/expire-cohorts` as a local/dev manual expiry trigger with optional ISO `now` parameter.
- Added a social promotion outbox service and create-flow integration that creates pending local posts with public cohort details and no private links.
- Added creator and participant dashboard services, routes, renderers, and responsive dashboard summary styling.
- Marked T007, T008, and T009 done, unblocking T010.

Verification:
- `npm run check` passed.
- In-app browser smoke checked `/dashboard/creator?userId=user-creator` and `/dashboard/participant?userId=user-participant` on `http://localhost:3000`.

### 2026-05-30 00:48 EDT

Task:
- T006 Build show-interest and quorum unlock flow

Files Changed:
- `src/services/show-interest.mjs`
- `src/services/event-browsing.mjs`
- `src/server/app.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/styles.css`
- `tests/show-interest.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a show-interest service that records 1-credit participant holds, rejects duplicate active/consumed interest, rejects participant-cap overflow, and activates cohorts when quorum is met.
- Added quorum activation behavior that consumes held creator and participant credits, marks active interests consumed, and updates event status to active.
- Added a POST interest route and detail-page interest UI using the existing demo-user auth path.
- Updated active-link authorization so consumed participants can still view unlocked private links.
- Marked T006 done and unblocked T007 and T009.

Verification:
- `npm run check` passed.
- Browser smoke tested create -> detail -> stake interest -> quorum unlock on `http://localhost:3001`.

### 2026-05-30 00:41 EDT

Task:
- T005 Build public event feed and detail visibility

Files Changed:
- `src/services/event-browsing.mjs`
- `src/server/app.mjs`
- `src/ui/cohorts.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- `tests/event-browsing.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a public event browsing service that lists open/active cohorts and serializes detail views through the locked-link visibility policy.
- Added `GET /cohorts` and `GET /cohorts/:id` routes with feed/detail renderers and navigation updates.
- Added tests confirming public feed/detail pages do not leak locked links and active links are visible to authorized viewers.
- Marked T005 done and unblocked T006.

Verification:
- `npm run check` passed.

### 2026-05-30 00:33 EDT

Task:
- T004 Build create cohort flow

Files Changed:
- `src/services/create-cohort.mjs`
- `src/server/app.mjs`
- `src/ui/create-cohort.mjs`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- `tests/create-cohort.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a create cohort service that builds valid open events, requires an existing creator, and records a 2-credit creator hold through the ledger.
- Added a demo-backed `GET/POST /cohorts/new` route with form rendering, validation error surfacing, and success rendering that does not expose the private link.
- Added create-flow tests for credit holds, default expiry, insufficient-credit rejection, validation failures, and UI response behavior.
- Marked T004 done and unblocked T005 and T008.

Verification:
- `npm run check` passed.

### 2026-05-30 00:28 EDT

Task:
- T003 Add persistence schema and credit ledger primitives

Files Changed:
- `src/persistence/schema.mjs`
- `src/persistence/store.mjs`
- `src/persistence/repositories.mjs`
- `src/persistence/credit-ledger.mjs`
- `src/persistence/seeds.mjs`
- `tests/persistence-ledger.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added explicit persistence schema metadata for users, events, event interests, credit transactions, and social posts, including a future purchase source path.
- Added dependency-free in-memory repositories that validate domain records and enforce unique event interest per user/event.
- Added credit ledger primitives for grants, holds, consumes, refunds, insufficient-credit checks, and derived available/held balances.
- Added demo seed users with starting credits issued through grant transactions.
- Marked T003 done and unblocked T004.

Verification:
- `npm run check` passed.

### 2026-05-30 00:18 EDT

Task:
- T002 Implement domain types and validation rules

Files Changed:
- `src/domain/constants.mjs`
- `src/domain/models.mjs`
- `src/domain/validation.mjs`
- `tests/domain-validation.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added spec-aligned domain constants for event categories, statuses, recurrence, social post status, interest status, credit transaction type, and social platform values.
- Added JSDoc domain model typedefs for Event, EventInterest, CreditTransaction, and SocialPost.
- Added domain validators, 14-day default expiry calculation, event builder defaults, and a locked-link serializer that hides private links for open events.
- Added focused domain tests for enum alignment, event validation, expiry defaults, link visibility, and related object validators.
- Marked T002 done and unblocked T003.

Verification:
- `npm run check` passed.

### 2026-05-30 00:13 EDT

Task:
- T001 Scaffold runnable app foundation

Files Changed:
- `package.json`
- `README.md`
- `src/domain/constants.mjs`
- `src/persistence/README.md`
- `src/server/app.mjs`
- `src/ui/home.mjs`
- `src/ui/styles.css`
- `scripts/lint.mjs`
- `tests/foundation.test.mjs`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a runnable dependency-free Node.js web app foundation with clear domain, persistence, server, and UI directories.
- Added baseline lint and Node test runner scripts.
- Replaced the starter README with Cohort15 setup, run, verification, source layout, and MVP boundary notes.
- Marked T001 done and unblocked T002.

Verification:
- `npm run check` passed.
- `npm run dev` started at `http://localhost:3000`.
- In-app browser verified the page title, H1, and scaffold sections.

### 2026-05-30 00:02 EDT

Task:
- Clarify MVP boundary after user discussion

Files Changed:
- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/knowledge/index.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`

Summary:
- Updated setup artifacts so MVP includes all core cohort behavior, admin/demo credit grants, and a social outbox.
- Moved USD credit sales and real external social posting to post-MVP / urgent-next.
- Recorded initial credit package assumptions: `$6` for 6 credits and `$12` for 14 credits.

Verification:
- `python3 -m json.tool tasks.json` passed.
- Custom schema-required-field and dependency-reference check passed for 10 tasks.
- Searched planning artifacts for payment/social wording and confirmed USD sales plus real external social posting are marked post-MVP.

### 2026-05-29 23:50 EDT

Task:
- Setup/bootstrap from Cohort15 MVP spec

Files Changed:
- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/knowledge/index.md`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`

Summary:
- Replaced starter placeholders with Cohort15-specific planning artifacts and a small executable MVP task graph.
- Recorded product assumptions, context routes, and first implementation handoff.

Verification:
- `python3 -m json.tool tasks.json` passed.
- Custom schema-required-field and dependency-reference check passed for 10 tasks.
- Task IDs were checked across `tasks.json`, `atomic-task-graph.md`, and `agent/progress/task-status.md`.

### 2026-06-17 EDT

Task:
- Production MVP dependency graph planning update

Files Changed:
- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Rebuilt the remaining launch graph as production-ready MVP scope instead of mock/post-MVP scope.
- Added explicit tasks for production deployment, config/secrets, Supabase Auth, Supabase Postgres, production session/CSRF hardening, admin controls, real Stripe purchases and webhook idempotency, LinkedIn/X/Email social publishing, social admin controls, production credit bootstrap, upload hardening, logging/audit, lifecycle launch decision, security/privacy review, and production MVP smoke testing.
- Updated planning docs so Stripe payments and LinkedIn/X/Email publishing are production-MVP requirements, not deferrable post-MVP work.

Verification:
- Dependency-reference validation for `tasks.json` passed.
- `npm run check` passed with 59 tests.

### 2026-06-17 EDT

Task:
- Add Human Setup Checklist standard

Files Changed:
- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/progress/task-status.md`
- `agent/progress/session-notes.md`
- `agent/progress/change-log.md`
- `agent/knowledge/index.md`

Summary:
- Added a project-wide standard requiring exact Human Setup Checklists for provider-dependent or external human setup tasks.
- Required future agents to include official/current links, dashboard paths, callback/webhook/redirect values, local file paths, env var names, secret warnings, verification steps, and clear checkpoints before depending on human setup.
- Applied the standard to remaining production-MVP tasks T013-T030, excluding completed T016.

Verification:
- Dependency-reference validation for `tasks.json` passed.
- `git diff --check` passed.
- `npm run check` passed with 59 tests.

## Template

### YYYY-MM-DD HH:MM

Task:
- TODO

Files Changed:
- TODO

Summary:
- TODO

Verification:
- TODO
