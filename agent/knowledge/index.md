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
| Feedback tracking | `agent/feedback/*`, `templates/feedback-issue/*` | Issue-local feedback workflow exists but no product feedback issues are currently defined. | medium |
| Product application code | `package.json`, `src/domain`, `src/persistence`, `src/server`, `src/ui`, `tests`, `scripts` | T001 created a dependency-free Node.js HTTP + ES modules foundation with lint/test scripts and a static rendered shell. | high |

## Context Routes

Use these routes to avoid broad rediscovery.

| Task Type | Read First | Then Read | Avoid Unless Needed |
|---|---|---|---|
| Setup/bootstrap | `start.txt`, `agent-starters/startSetupManager.txt`, `docs/cohort15-mvp-spec-v3.md` | `plan.md`, `tasks.json`, `atomic-task-graph.md`, progress files | product source until T001 creates it |
| Main implementation task | `tasks.json`, `agent/progress/task-status.md`, this index | Files listed in the task `inputs` and `write_scope`; `docs/cohort15-mvp-spec-v3.md` for product behavior | unrelated future tasks and feedback issue folders |
| Stack/scaffold task | T001 in `tasks.json`, `plan.md`, `README.md`, `USAGE.md` | Current repo tree; selected framework docs if needed | implementing domain flows beyond scaffold |
| Domain model/validation | T002 in `tasks.json`, `docs/cohort15-mvp-spec-v3.md` sections for Event, validation, related objects | `src/domain/constants.mjs`, `src/domain/models.mjs`, `src/domain/validation.mjs`, `tests/domain-validation.test.mjs` | UI routes and dashboards |
| Persistence/token ledger | T003 in `tasks.json`, spec sections for EventInterest and TokenTransaction | `src/domain/constants.mjs`, `src/domain/models.mjs`, `src/domain/validation.mjs`, selected database/schema files | social posting UI unless tied to schema |
| Create cohort flow | T004 in `tasks.json`, creator flow in spec | Token ledger and event persistence modules | participant interest, expiry, dashboards |
| Feed/detail/link visibility | T005 in `tasks.json`, online-only and locked link sections in spec | Event creation and visibility/data-loader modules | social posting and expiry services |
| Interest/quorum flow | T006 in `tasks.json`, participant and quorum flows in spec | Token ledger, event detail route, interest modules | dashboards except where needed for test setup |
| Expiry/refund processing | T007 in `tasks.json`, expiry and quorum-not-met sections in spec | Token ledger and interest modules | social channel integration |
| Social promotion outbox | T008 in `tasks.json`, automated social promotion section in spec, MVP boundary in `plan.md` | Event creation flow and social post outbox persistence | real external API clients during MVP |
| Dashboards | T009 in `tasks.json`, creator and participant flow sections in spec | Event, interest, token data loaders | analytics, profiles, chat |
| Feedback intake | `agent/feedback/issue-index.md`, this index | Relevant existing issue folders | main task ledger unless mapping feedback to implementation |
| Feedback resolution | Issue folder `tasks.json`, issue `task-status.md`, this index | Code in issue `files_expected` | unrelated issue folders |

## Prior Learnings

- The repo began as an agent architecture starter kit, not a product implementation.
- The Cohort15 spec is comprehensive enough to initialize implementation tasks without blocking clarification.
- T001 chose a dependency-free Node.js HTTP + ES modules foundation with scripts: `npm run dev`, `npm run check`, `npm test`, and `npm run lint`.
- T002 represents typed domain concepts with JSDoc typedefs because the scaffold has no TypeScript compile step.
- T002 added domain validators in `src/domain/validation.mjs`; persistence and services should reuse these instead of duplicating spec enum or recurrence/link rules.
- Locked event links are serialized as hidden for open events; once active, the current conservative policy reveals links only to creators or interested viewers supplied to the serializer.
- Social promotion should start as a local/mock outbox unless official channels and credentials are provided.
- Token purchase is post-MVP; seed/admin grant transactions are part of MVP.
- Initial post-MVP token packages are `$6` for 6 tokens and `$12` for 14 tokens.
- Real automated social posting is post-MVP; MVP should generate local public-safe outbox content.

## Assumptions And Uncertainty

- Regular auth is in scope, but the provider is unspecified. A future implementation may use a simple local/demo auth path if it documents the assumption.
- Deployment target is unspecified. Keep deployment-specific choices out of core business logic until clarified.
- Authorization for viewing active private links should be implemented conservatively. At minimum, creators and interested participants should be eligible; broader public visibility after activation should be clarified if product behavior depends on it.
- Official social channels are post-MVP. Do not implement real API posting during MVP.
- Initial token balances should use grant transactions for seed/demo/admin balances.
- USD token sales are post-MVP, with `$6` for 6 tokens and `$12` for 14 tokens as the starting package assumptions.

## Staleness Checks

Before trusting this index, check:

- Has the dependency-free Node scaffold been replaced by a framework or moved from `src/*`?
- Do task write scopes reference files that no longer exist?
- Do progress notes mention architecture changes not reflected here?
- Did a recent task add or move canonical modules?
- Has the user clarified auth, stack, deployment, social channels, token seeding, or payment provider?

## Last Updated

- 2026-05-30 00:02 EDT: Clarified MVP boundary: build all core cohort behavior now, keep token sales and real social posting post-MVP, and record `$6`/6-token and `$12`/14-token package assumptions.
- 2026-05-30 00:13 EDT: T001 created the dependency-free Node.js app foundation, README commands, lint/test scripts, and initial `src/*` layout.
- 2026-05-30 00:18 EDT: T002 added JSDoc domain models, spec enums, event/related-object validators, expiry defaulting, and locked-link visibility serialization.
- 2026-05-29 23:50 EDT: Setup manager initialized Cohort15 planning artifacts from `docs/cohort15-mvp-spec-v3.md`; no product code exists yet.
