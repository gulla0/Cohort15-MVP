# Change Log

## 2026-06-18 — Lofi MVP setup reset

- Added the lofi product specification.
- Replaced the production plan and T-task backlog with L001–L010.
- Rebuilt the atomic dependency graph and readable task status.
- Reset knowledge, progress, and feedback artifacts for a clean branch start.
- Removed prior resolved feedback issue folders; Git history remains the archive.
- Added an isolated lofi provider/deployment human-task runbook.

Verification: `npm run check` passed with 85 tests.

## 2026-06-18 — L000 clean lofi application shell

- Replaced the production server with home, styles, health, and 404-only routes.
- Replaced runtime configuration and Render placeholders with lofi-specific names.
- Removed auth, payments, credits, dashboards, social promotion, images, production persistence/domain/services, old migrations, production runbooks/spec, and legacy tests.
- Added focused shell and runtime configuration tests.

Verification: `npm run check` passed with 5 focused shell tests. Route-level smoke coverage verified home, styles, health, 404 behavior, and legacy-route removal. Interactive browser smoke was unavailable because the sandbox denied local port binding.

## 2026-06-18 — Product decision capture audit

- Added the complete cohort creation-form field contract and enum values.
- Added the exact approved meeting-link hosts.
- Clarified that meeting schedule details are public throughout while only the link is quorum-gated.
- Aligned task contracts, graph, plan, and knowledge index with those decisions.

Verification: `npm run check` passed with 5 tests.

## 2026-06-18 — End-to-end agent readiness hardening

- Completed the domain, validation, recurrence, lifecycle, route, ordering, persistence, abuse, and notification policies.
- Corrected stale and contradictory L002 inputs.
- Replaced generic task write scopes with concrete paths and strengthened acceptance boundaries through L010.
- Updated setup-manager, implementation-manager, worker, router, usage, knowledge, and README guidance.
- Added automated task-ledger, dependency-cycle, tracker-alignment, graph-coverage, and ready-input checks.
- Linearized the task graph to one task per chat with no parallel shared-file wave.

Verification: `npm run check` passed with 11 aligned tasks and 5 shell tests.

## 2026-06-18 — L001 lofi domain and validation policy

- Added lofi constants and exact cohort, interest, and notification-delivery factories.
- Added Unicode-aware normalization and validation for every creation field.
- Added dependency-free IANA timezone conversion, DST handling, recurrence generation, and lifecycle derivation.
- Added privacy-safe public cohort serialization with final-meeting link cutoff.
- Added deterministic notification idempotency key generation.
- Added focused boundary, invalid-date, month-end, DST, lifecycle, normalization, and privacy tests.

Verification: `node --test tests/domain-validation.test.mjs` passed with 12 tests; `npm run check` passed with 17 tests.

## 2026-06-18 — L002 isolated lofi persistence and migration

- Added isolated local repositories for cohorts, interests, and notification deliveries.
- Added atomic per-cohort interest acceptance and exactly-once quorum transition behavior.
- Added a server-only Supabase PostgREST adapter and transaction-safe interest RPC.
- Added the three-table `cohort15_lofi_*` migration with normalized-email and idempotency uniqueness, RLS, no browser policies, and service-role-only access.
- Added focused privacy, conflict, concurrency, adapter, notification-outcome, and migration-isolation tests.

Verification: `node --test tests/persistence.test.mjs tests/supabase-postgres.test.mjs` passed with 8 tests; `npm run check` passed.

## 2026-06-18 — Workflow status-alignment hardening

- Reconciled stale L001 guidance with the completed L002 ledger state.
- Added automated next-ready-task checks for the README, plan, workflow sheet, and readable task status.
- Added exact task-status validation for the atomic task graph.
- Expanded manager closeout instructions to keep all status-facing workflow artifacts aligned.

## 2026-06-18 — L003 anonymous cohort creation

- Added the complete anonymous creation form, browser timezone capture, private-email consent, and approved-link guidance.
- Added repository-backed creation behavior and request guards for media type, body size, Origin, and privacy-safe validation failures.
- Added a hidden honeypot and a concurrency-safe, hashed-IP rolling limiter that counts five successful writes per hour.
- Added focused creation service, HTTP route, timezone, honeypot, privacy, and limiter tests.

Verification: focused creation/rate-limit/shell tests passed; full `npm run check` passed with 31 tests.

## 2026-06-18 — L004 landing, listing, and lifecycle views

- Added the full landing-page cohort directory with All, Active, and Expired filters.
- Added public cohort detail pages, exact quorum progress, lifecycle states, and persistent expired listings.
- Added browser-local meeting-time rendering while keeping schedule metadata server-rendered and public.
- Enforced HTML escaping and public-serialization meeting-link boundaries throughout the UI.
- Added the `/cohorts` compatibility redirect and focused browsing, route, ordering, privacy, and link-visibility tests.

Verification: `node --test tests/event-browsing.test.mjs` passed with 3 tests; full `npm run check` passed with 34 tests.

## 2026-06-18 — L005 anonymous interest and quorum unlock

- Added normalized, email-only interest submission with no authentication.
- Added the active/gathering detail form, private-email consent, and honeypot.
- Added media type, body-size, Origin, validation, conflict, missing-cohort, and privacy-safe HTTP handling.
- Integrated atomic interest acceptance and immediate public meeting-link unlock at quorum.
- Added a separate ten-success-per-IP rolling limiter and focused concurrency, lifecycle, privacy, route, and limit tests.

Verification: `node --test tests/show-interest.test.mjs tests/rate-limit.test.mjs` passed with 7 tests; full `npm run check` passed with 39 tests.

## 2026-06-18 — L006 Resend confirmation and quorum notifications

- Added the Resend HTTP adapter with fixed sender/reply-to, separate recipients, provider idempotency keys, and a five-second timeout.
- Added persisted, deterministic creator confirmation, participant confirmation, and quorum notification orchestration.
- Added per-recipient quorum fanout with public schedule/link details and separate confirmation for the quorum-reaching participant.
- Sanitized and persisted provider failures while preserving successful cohort and interest submissions.
- Added fake-provider adapter, idempotency, fanout, privacy, and failure-isolation tests.

Verification: focused notification/create/interest tests passed with 14 tests; full `npm run check` passed with 44 tests.

## 2026-06-18 — L007 isolated production configuration and deployment

- Added fail-fast production validation for the complete lofi-only app, analytics, Supabase, Resend, sender, and reply-to environment contract.
- Wired production startup to the isolated Supabase PostgREST repositories with no in-memory fallback.
- Preserved dependency-free local development and Render host/port binding with `/health` readiness.
- Finalized `.env.example`, `render.yaml`, README guidance, and the human launch runbook while explicitly forbidding production-MVP credential reuse.
- Added focused coverage for missing production values, fixed email policy, legacy-variable absence, and production Supabase selection.

Verification: `node --test tests/runtime-config.test.mjs` passed with 6 tests; full `npm run check` passed with 47 tests.

## 2026-06-18 — L008 privacy, abuse, and end-to-end verification

- Added full local-flow verification from cohort creation through quorum, expiry, and final meeting completion.
- Added public-response/log privacy assertions, honeypot and request-policy integration checks, and comprehensive absent legacy-route checks.
- Fixed browser-local time enhancement to use a valid `Intl.DateTimeFormat` option combination.
- Verified desktop and mobile layouts in the local browser with no console errors or horizontal overflow.

Verification: focused launch suites and local browser smoke passed; full `npm run check` passed with 50 tests.

## 2026-06-20 — L011 public Research & Field Notes

- Added `/research` as a first-party editorial index with explicit support for research, essays, field notes, product updates, and external publications.
- Added `/research/why-small-committed-groups` as an edited public synthesis of the supplied demand-validation report.
- Added site-wide research navigation and responsive editorial/article styling consistent with the existing visual system.
- Added safe content escaping, constrained internal routes, HTTP(S)-only external links, semantic page structure, and visible keyboard focus.
- Added focused server-route, rendering, privacy, accessibility, unknown-route, and unsafe-link tests.

Verification: focused research and affected-route suites passed; full `npm run check` passed with 62 tests and 12 aligned tasks.

## 2026-06-20 — L012 original Cohort15 product thesis video update

- Added the supplied YouTube video to `/research` as a first-party product update.
- Added a transcript-derived founder story and explanation of the original product mechanics.
- Clearly separated the durable product thesis from retired credit, maximum-membership, link timing, and automated social-publishing assumptions.
- Added a privacy-enhanced video embed, safe direct YouTube link, responsive styling, current-product CTAs, and focused route/rendering tests.

Verification: focused research tests passed; full `npm run check` passed with 63 tests and 13 aligned tasks.
