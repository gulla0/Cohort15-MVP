# Knowledge Index

This file helps agents decide what context to load before planning or execution.

It is advisory. Code, verified behavior, and canonical ledgers override this index when they disagree.

## Canonical Artifacts

| Artifact | Purpose | Authority |
|---|---|---|
| `docs/cohort15-mvp-spec-v3.md` | Cohort15 product rules and MVP scope | Product behavior source |
| `plan.md` | Product constraints, phases, MVP cut, and assumptions | Product planning source |
| `atomic-task-graph.md` | Human-readable dependency graph | Planning reference |
| `tasks.json` | Machine-readable task ledger | Canonical task status and task contracts |
| `agent/progress/task-status.md` | Human-readable task status | Derived/working view |
| `agent/progress/session-notes.md` | Handoff and decisions | Supporting log |
| `agent/progress/change-log.md` | Append-only setup/implementation log | Supporting log |
| `agent/progress/blockers.md` | Known blockers | Supporting log |
| `agent/feedback/issue-index.md` | Feedback backlog | Canonical issue-level feedback status |

## Repository Areas

| Area | Files / Directories | Notes | Confidence |
|---|---|---|---|
| Agent routing and role prompts | `start.txt`, `agent/router/intent-router.md`, `agent-starters/*.txt` | Defines router, setup manager, implementation manager, feedback managers, and worker roles. | high |
| Product specification | `docs/cohort15-mvp-spec-v3.md` | Defines Cohort15 MVP rules, fields, validation, lifecycle, flows, and scope. | high |
| Main planning artifacts | `plan.md`, `atomic-task-graph.md`, `tasks.json` | Initialized for Cohort15 MVP. `tasks.json` is canonical. | high |
| Progress tracking | `agent/progress/*.md` | Tracks task status, session decisions, blockers, and changes. | high |
| Feedback tracking | `agent/feedback/*`, `templates/feedback-issue/*` | Issue-local feedback workflow exists. ISSUE-001, ISSUE-002, ISSUE-003, and ISSUE-004 were resolved on 2026-05-30. ISSUE-005 was resolved on 2026-05-31 by unifying the combined dashboard credit account presentation. ISSUE-006 was resolved on 2026-06-13 by tightening cohort creation recurrence, meeting-link, first-meeting, and creator-field behavior. ISSUE-007 was resolved on 2026-06-12 by redesigning public cohort cards around participant decision cues and browser-local time. ISSUE-008 was resolved on 2026-06-13 by adding public-safe word search on `/cohorts?q=`. ISSUE-009 was resolved on 2026-06-13 by adopting credit terminology across app, tests, docs, planning, and feedback artifacts. ISSUE-010 was resolved on 2026-06-16 by adding realistic create-form placeholders and a validated local image file picker. ISSUE-011 was resolved on 2026-06-16 by adding exact-first fuzzy public cohort search ranking. ISSUE-012 is a not_started feedback issue for a Buy Credits nav placeholder. | high |
| Product application code | `package.json`, `src/domain`, `src/persistence`, `src/services`, `src/server`, `src/ui`, `tests`, `scripts`, `public/assets/default-cohort.png` | T001 created a dependency-free Node.js HTTP + ES modules foundation; T003 added in-memory persistence repositories and credit ledger primitives; T004 added the create cohort service and demo-backed create route; T005 added public cohort feed/detail routes and visibility service; T006 added show-interest/quorum activation; T007-T009 added expiry/refunds, local social outbox, and dashboards; T010 added MVP end-to-end verification coverage and README handoff docs. Feedback resolution added event images, clearer navigation/copy, participant-default interest flow, first-meeting validation, a combined `/dashboard` route with legacy dashboard URLs preserved, one Account Credits summary on `/dashboard`, daily cohort recurrence, meeting-link provider allowlisting, no visible creator selector on `/cohorts/new`, public cohort cards with service-backed capacity summaries, Starts/Open spots/Quorum decision fields, compact imagery, browser-local time enhancement, `/cohorts?q=` word search and exact-first fuzzy ranking across public-safe cohort fields, repo-wide credit terminology with local JSON compatibility normalization, and a multipart create-form image picker that stores validated local uploads under `/assets/uploads`. T011 added dependency-free durable local JSON-file persistence behind the repository boundary through `COHORT15_PERSISTENCE_FILE`; T016 repaired stale date-sensitive route tests with fixed-clock request handler option injection; T012-T015 remain planned for auth, purchases, social publishing, and lifecycle controls. | high |

## Context Routes

Use these routes to avoid broad rediscovery.

| Task Type | Read First | Then Read | Avoid Unless Needed |
|---|---|---|---|
| Setup/bootstrap | `start.txt`, `agent-starters/startSetupManager.txt`, `docs/cohort15-mvp-spec-v3.md` | `plan.md`, `tasks.json`, `atomic-task-graph.md`, progress files | product source until T001 creates it |
| Main implementation task | `tasks.json`, `agent/progress/task-status.md`, this index | Files listed in the task `inputs` and `write_scope`; `docs/cohort15-mvp-spec-v3.md` for product behavior | unrelated future tasks and feedback issue folders |
| Stack/scaffold task | T001 in `tasks.json`, `plan.md`, `README.md`, `USAGE.md` | Current repo tree; selected framework docs if needed | implementing domain flows beyond scaffold |
| Domain model/validation | T002 in `tasks.json`, `docs/cohort15-mvp-spec-v3.md` sections for Event, validation, related objects | `src/domain/constants.mjs`, `src/domain/models.mjs`, `src/domain/validation.mjs`, `tests/domain-validation.test.mjs` | UI routes and dashboards |
| Persistence/credit ledger | T003 in `tasks.json`, spec sections for EventInterest and CreditTransaction | `src/persistence/schema.mjs`, `src/persistence/repositories.mjs`, `src/persistence/credit-ledger.mjs`, `src/persistence/seeds.mjs`, `tests/persistence-ledger.test.mjs` | social posting UI unless tied to schema |
| Create cohort flow | T004 in `tasks.json`, creator flow in spec | `src/persistence/repositories.mjs`, `src/persistence/credit-ledger.mjs`, `src/persistence/seeds.mjs`, event validation modules | participant interest, expiry, dashboards |
| Feed/detail/link visibility | T005 in `tasks.json`, online-only and locked link sections in spec | `src/services/create-cohort.mjs`, `src/server/app.mjs`, `src/ui/create-cohort.mjs`, and visibility/data-loader modules | social posting and expiry services |
| Interest/quorum flow | T006 in `tasks.json`, participant and quorum flows in spec | `src/services/show-interest.mjs`, `src/services/event-browsing.mjs`, `src/ui/cohorts.mjs`, credit ledger, event detail route, interest tests | dashboards except where needed for test setup |
| Expiry/refund processing | T007 in `tasks.json`, expiry and quorum-not-met sections in spec | Credit ledger and interest modules | social channel integration |
| Social promotion outbox | T008 in `tasks.json`, automated social promotion section in spec, MVP boundary in `plan.md` | Event creation flow and social post outbox persistence | real external API clients during MVP |
| Dashboards | T009 in `tasks.json`, creator and participant flow sections in spec | Event, interest, credit data loaders | analytics, profiles, chat |
| Durable persistence hardening | T011 in `tasks.json`, `src/persistence/store.mjs`, `src/persistence/repositories.mjs`, `src/persistence/seeds.mjs`, `src/server/app.mjs` | JSON-file mode is enabled with `COHORT15_PERSISTENCE_FILE`; in-memory state remains default. Tests should use isolated temp files for durable coverage. | auth, payments, social APIs unless the task explicitly reaches them |
| Auth boundary | T012 in `tasks.json`, server route handlers, create/interest/dashboard services | Existing demo-user query/default-user paths and private-link authorization tests | OAuth provider specifics unless selected |
| Credit purchases | T013 in `tasks.json`, credit package assumptions in `plan.md`, credit ledger modules | Dashboard/credit summary surfaces and persistence schema if purchase metadata is needed | real card handling or provider credentials unless specified |
| External social publishing | T014 in `tasks.json`, `src/services/social-promotion.mjs`, social post persistence | Configuration docs and mock/dry-run adapter tests | hard-coded secrets or real API calls in tests |
| Lifecycle controls | T015 in `tasks.json`, domain statuses, expiry/refund service, dashboards | Server route guards and private-link visibility rules | broad moderation tooling |
| Time-sensitive route tests | T016 in `tasks.json`, `src/server/app.mjs`, create-flow and MVP verification tests | `createRequestHandler(state, { now })` can inject a fixed clock into the create cohort service so tests do not depend on the real calendar date. | weakening first-meeting validation to satisfy stale tests |
| Feedback intake | `agent/feedback/issue-index.md`, this index | Relevant existing issue folders | main task ledger unless mapping feedback to implementation |
| Feedback resolution | Issue folder `tasks.json`, issue `task-status.md`, this index | Code in issue `files_expected` | unrelated issue folders |
| Public cohort search | ISSUE-008 in `agent/feedback/issue-index.md`, `src/services/event-browsing.mjs`, `src/server/app.mjs` | Search is server-side through `/cohorts?q=` and should stay limited to public-safe fields. | private meeting links and non-public statuses |
| Create-form guidance and image upload feedback | ISSUE-010 in `agent/feedback/issue-index.md`, `src/ui/create-cohort.mjs`, `src/server/app.mjs` | Resolved: `/cohorts/new` uses realistic placeholders and a multipart `eventImage` file picker. Valid PNG/JPG/GIF/WebP uploads up to 2 MB are saved locally and passed as app-relative `imageUrl`; blank uploads keep `/assets/default-cohort.png`. | full media library or cloud uploads |
| Fuzzy cohort search feedback | ISSUE-011 in `agent/feedback/issue-index.md`, `src/services/event-browsing.mjs`, `tests/event-browsing.test.mjs` | Resolved: `/cohorts?q=` scores public-safe field matches with exact tokens first, substring matches next, and small edit-distance matches below so typos like `tost` can surface `test` cohorts. Every query word must still match a public-safe field. | hosted search service, private links |
| Buy Credits placeholder feedback | ISSUE-012 in `agent/feedback/issue-index.md`, `src/ui/home.mjs`, `src/server/app.mjs` | Add nav placeholder only; real payment gates and credit purchase transactions remain T013. | implementing payment provider or granting credits |

## Prior Learnings

- The repo began as an agent architecture starter kit, not a product implementation.
- The Cohort15 spec is comprehensive enough to initialize implementation tasks without blocking clarification.
- T001 chose a dependency-free Node.js HTTP + ES modules foundation with scripts: `npm run dev`, `npm run check`, `npm test`, and `npm run lint`.
- T002 represents typed domain concepts with JSDoc typedefs because the scaffold has no TypeScript compile step.
- T002 added domain validators in `src/domain/validation.mjs`; persistence and services should reuse these instead of duplicating spec enum or recurrence/link rules.
- T003 added dependency-free in-memory persistence via `createRepositories`, explicit schema metadata in `src/persistence/schema.mjs`, demo grants in `src/persistence/seeds.mjs`, and credit ledger helpers in `src/persistence/credit-ledger.mjs`.
- Credit ledger transaction amounts are positive. Available, held, consumed, and refunded balances are derived by transaction type rather than by mutating user balances.
- Locked event links are serialized as hidden for open events; once active, the current conservative policy reveals links only to creators or interested viewers supplied to the serializer.
- Social promotion should start as a local/mock outbox unless official channels and credentials are provided.
- Credit purchase is post-MVP; seed/admin grant transactions are part of MVP.
- Initial post-MVP credit packages are `$6` for 6 credits and `$12` for 14 credits.
- Real automated social posting is post-MVP; MVP should generate local public-safe outbox content.
- Create cohort currently uses demo seed users as the temporary auth path and `GET/POST /cohorts/new` as the creation surface.
- The create success view intentionally reports that the private link is locked and does not render `lockedEventLink`.
- Public discovery is implemented through `src/services/event-browsing.mjs`, `GET /cohorts`, and `GET /cohorts/:id`; it lists open/active events and keeps locked links hidden unless an active event is viewed by an authorized demo `viewerId`.
- Show interest is implemented through `src/services/show-interest.mjs` and `POST /cohorts/:id/interest`; it uses demo users, records a 1-credit participant hold, rejects duplicate active/consumed interest and cap overflow, and activates the event at quorum.
- Quorum activation consumes the creator's 2-credit hold and each active participant's 1-credit hold, then marks active interests `consumed`; consumed participants remain authorized to view active private links.
- Expiry processing lives in `src/services/expire-cohorts.mjs` and is exposed for local/dev use at `POST /admin/expire-cohorts`; it only processes open events past `expiresAt`, refunds held creator/participant credits, and marks active interests `refunded`.
- Social promotion is local/mock in `src/services/social-promotion.mjs`; create cohort enqueues a pending `x` outbox post with public event fields and a public cohort URL, never the private link.
- Creator and participant dashboards live at `/dashboard/creator` and `/dashboard/participant`; they use the existing demo `userId` query/default-user path and existing locked-link serializer for authorization.
- MVP handoff verification lives in `tests/mvp-verification.test.mjs`; it covers create/promote/privacy/quorum/dashboard success behavior and create/interest/expiry/refund behavior across the HTTP handler and in-memory repositories.
- README now documents local demo users, seed credit grants, MVP flow, manual expiry trigger, local social outbox behavior, post-MVP credit package assumptions, and known MVP assumptions.
- Feedback resolution on 2026-05-30 added `imageUrl` to events, defaulting blank images to `/assets/default-cohort.png` and allowing custom http(s) or app-relative image values.
- Visible MVP UI copy should use plain credit wording: creators use 2 credits to start a cohort, participants use 1 credit to show interest, and credits are returned if quorum is not met.
- The create flow now enforces firstMeetingAt after the 14-day quorum window in backend validation and renders a `datetime-local` min value in the form.
- The cohort detail interest form should prefer a non-creator demo participant. Creator self-interest remains rejected in the service.
- Primary navigation now consistently exposes cohorts, create, creator dashboard, and participant dashboard.
- Feedback resolution on 2026-05-30 completed ISSUE-004: dashboard UI now avoids repeated row-level credit summaries, renders only Available/In use/Used credit states, and uses content-based dashboard sections: Account Credits, Active Cohorts & Schedule, Created Cohorts, and Interested Cohorts. Legacy dashboard routes remain supported.
- Feedback resolution on 2026-05-31 completed ISSUE-005: the combined dashboard Account Credits section now renders one Available/In use/Used credit summary from a de-duplicated account balance, not separate Demo Creator and Demo Participant credit panels.
- Feedback resolution on 2026-06-13 completed ISSUE-006: cohort creation supports `daily` recurrence, accepts private meeting links only from approved https Google Meet, Zoom, Microsoft Teams, Discord, and Slack hosts, removes the visible Creator selector, and assigns the temporary `user-creator` demo creator route-side until T012 auth replaces the demo identity path.
- Feedback resolution on 2026-06-12 completed ISSUE-007: public cohort cards now use service-backed capacity summaries and stable decision fields for Starts, Open spots, and Quorum; feed images are compact thumbnails on desktop and stacked on mobile; cohort times render with UTC fallback and browser-local enhancement.
- Feedback resolution on 2026-06-13 completed ISSUE-008: `/cohorts?q=` now filters public open/active cohorts by case-insensitive words across public-safe fields including title, description, category, topic, audience, skill, and additional details; private meeting links are not searched or exposed.
- Feedback resolution on 2026-06-13 completed ISSUE-009: the repository now uses credit terminology across app copy, code identifiers, tests, docs, planning, and feedback artifacts; `src/persistence/store.mjs` normalizes earlier local JSON snapshot keys and seed grant source values into the current credit-shaped store.
- T011 durable persistence uses `createJsonFileStore` in `src/persistence/store.mjs`, keeps repository methods synchronous, persists on successful writes, revives `*At` date fields on load, and stores credit balances as auditable transaction records rather than mutable balance fields.
- Durable local mode is opt-in with `COHORT15_PERSISTENCE_FILE=.local/cohort15-state.json npm run dev`. The app seeds demo users and seed grant transactions only when missing, so reloading an existing state file does not duplicate grants.
- Route-level tests that create cohorts should inject a fixed clock with `createRequestHandler(state, { now })` when asserting first-meeting behavior. Production validation still requires `firstMeetingAt` after the 14-day quorum window.
- The next planned task wave is T012-T015. T012 removes demo query/default-user identity from protected flows. T013 and T014 depend on durable/auth foundations. T015 can follow the auth boundary and uses already-modeled `cancelled` and `completed` statuses.
- Feedback intake on 2026-06-16 added ISSUE-010 for meaningful create-form placeholders and local image file selection, ISSUE-011 for exact-first fuzzy cohort search, and ISSUE-012 for a Buy Credits navigation placeholder that must not create or grant credits.
- Feedback resolution on 2026-06-16 completed ISSUE-010: the create form now renders realistic Cohort15 placeholders and posts as multipart form data with a standard local image file picker; uploads are MIME/size validated, saved under `/assets/uploads`, served as static assets, and default image behavior remains unchanged when no image is selected.
- Feedback resolution on 2026-06-16 completed ISSUE-011: public cohort search now uses deterministic scoring in `src/services/event-browsing.mjs`; exact token matches rank before substring matches, typo-tolerant edit-distance matches rank lower, and matching remains limited to public-safe fields.

## Assumptions And Uncertainty

- Regular auth is in scope, but the provider is unspecified. A future implementation may use a simple local/demo auth path if it documents the assumption.
- Deployment target is unspecified. Keep deployment-specific choices out of core business logic until clarified.
- Authorization for viewing active private links should be implemented conservatively. At minimum, creators and interested participants should be eligible; broader public visibility after activation should be clarified if product behavior depends on it.
- Official social channels are post-MVP. Do not implement real API posting during MVP.
- Initial credit balances should use grant transactions for seed/demo/admin balances.
- USD credit sales are post-MVP, with `$6` for 6 credits and `$12` for 14 credits as the starting package assumptions.
- Durable persistence is currently a local JSON-file adapter. It is restart-safe for local development but not a production concurrency model.
- Payment provider is unspecified; T013 should use local/mock payment confirmation unless the user selects a real provider.
- Official social channels and credentials are unspecified; T014 should preserve dry-run/mock adapters and avoid hard-coded secrets.

## Staleness Checks

Before trusting this index, check:

- Has the dependency-free Node scaffold been replaced by a framework or moved from `src/*`?
- Do task write scopes reference files that no longer exist?
- Do progress notes mention architecture changes not reflected here?
- Did a recent task add or move canonical modules?
- Has the user clarified auth, stack, deployment, social channels, credit seeding, or payment provider?

## Last Updated

- 2026-05-30 00:02 EDT: Clarified MVP boundary: build all core cohort behavior now, keep credit sales and real social posting post-MVP, and record `$6`/6-credit and `$12`/14-credit package assumptions.
- 2026-05-30 00:13 EDT: T001 created the dependency-free Node.js app foundation, README commands, lint/test scripts, and initial `src/*` layout.
- 2026-05-30 00:18 EDT: T002 added JSDoc domain models, spec enums, event/related-object validators, expiry defaulting, and locked-link visibility serialization.
- 2026-05-30 00:28 EDT: T003 added in-memory persistence schema/repositories, demo seed grants, credit ledger helpers, and persistence/ledger tests.
- 2026-05-30 00:33 EDT: T004 added `src/services/create-cohort.mjs`, demo-backed `GET/POST /cohorts/new`, create form UI, hidden-link success rendering, and create-flow tests.
- 2026-05-30 00:41 EDT: T005 added `src/services/event-browsing.mjs`, public `GET /cohorts` and `GET /cohorts/:id` routes, feed/detail UI, and visibility tests for locked/authorized private links.
- 2026-05-30 00:48 EDT: T006 added `src/services/show-interest.mjs`, `POST /cohorts/:id/interest`, detail interest UI, quorum activation with credit consumption, consumed-participant link authorization, and interest/quorum tests.
- 2026-05-30 00:59 EDT: T007-T009 added `src/services/expire-cohorts.mjs`, `src/services/social-promotion.mjs`, `src/services/dashboards.mjs`, local expiry trigger, social outbox integration, dashboard UI/routes, and focused tests.
- 2026-05-30 07:42 EDT: T010 added `tests/mvp-verification.test.mjs`, expanded README handoff docs, and completed the current MVP task ledger after `npm run check` passed with 36 tests.
- 2026-05-30 07:50 EDT: Setup manager added the next atomic task wave T011-T015 for post-MVP durable persistence, auth, credit purchases, social publishing, and lifecycle controls; updated plan, task graph, task status, and progress notes.
- 2026-05-30 08:51 EDT: Feedback resolution completed ISSUE-001 and ISSUE-002: repaired participant interest defaults, credit copy, date validation, navigation, event image model/default asset/input/rendering, and verified with `npm run check` plus browser smoke.
- 2026-05-30: Feedback resolution completed ISSUE-003: combined creator and participant dashboards at `/dashboard`, kept legacy dashboard URLs, separated navigation links from the app name in the topbar, and verified with dashboard tests.
- 2026-05-30 09:51 EDT: Feedback intake created ISSUE-004 for dashboard information architecture and language: duplicate credit information, Available/In use/Used summary states, content-based labels like Active Cohorts & Schedule, Created Cohorts, and Interested Cohorts, and dashboard user-flow review.
- 2026-05-30 10:06 EDT: Feedback resolution completed ISSUE-004: removed repeated dashboard credit row copy, removed Returned from dashboard credit presentation, changed dashboard labels to My Cohorts/My Events and content-based combined sections, and verified with tests, lint, and browser smoke.
- 2026-05-30 10:13 EDT: Feedback intake created ISSUE-005 for unifying the combined dashboard Account Credits presentation so it no longer implies separate creator and participant credit buckets.
- 2026-05-31 08:19 EDT: Feedback resolution completed ISSUE-005: added a de-duplicated account balance for the combined dashboard, rendered one Account Credits summary, and updated dashboard/MVP tests to reject split Demo Creator/Demo Participant credit panels.
- 2026-06-13: Feedback resolution completed ISSUE-006: added daily recurrence, approved-provider https meeting-link validation, hidden demo creator assignment for `/cohorts/new`, and focused create/domain tests.
- 2026-06-12 22:08 EDT: Feedback resolution completed ISSUE-007: redesigned public cohort cards around participant decision support, added capacity summaries, compact feed imagery, local-time enhancement with UTC fallback, focused tests, and browser smoke at desktop/mobile widths.
- 2026-06-13: Feedback resolution completed ISSUE-008: added server-side word search on `/cohorts?q=`, search/clear/no-results feed UI, and focused visibility-safe search tests.
- 2026-06-13: Feedback resolution completed ISSUE-009: adopted credit terminology repo-wide, renamed ledger-facing identifiers/modules, added local JSON compatibility normalization, and verified with focused tests, workflow checks, and full project checks.
- 2026-05-31 08:55 EDT: T011 added dependency-free durable JSON-file persistence behind the repository boundary, wired `COHORT15_PERSISTENCE_FILE`, documented reset behavior, and verified reload semantics with 44 passing tests.
- 2026-06-12 21:02 EDT: T016 repaired stale date-sensitive route tests by adding request-handler option injection and wiring create-flow/MVP verification tests to a fixed clock; `npm run check` passed with 44 tests.
- 2026-06-16: Feedback intake created ISSUE-010, ISSUE-011, and ISSUE-012 for create-form guidance/local image selection, fuzzy search relevance, and Buy Credits nav placeholder work.
- 2026-06-16: Feedback resolution completed ISSUE-010: added realistic create-form placeholders, dependency-free multipart upload handling, validated local image storage, static upload serving, and focused create-flow tests.
- 2026-06-16: Feedback resolution completed ISSUE-011: added dependency-free exact-first fuzzy search scoring for public cohort search and focused event browsing tests.
- 2026-05-29 23:50 EDT: Setup manager initialized Cohort15 planning artifacts from `docs/cohort15-mvp-spec-v3.md`; no product code exists yet.
