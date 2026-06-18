# Session Notes

## 2026-06-18 — Lofi MVP setup reset

Read:

- router, setup-manager, implementation-manager, and worker contracts
- prior plan, task graph, task ledger, progress trackers, and feedback index
- current domain, persistence, services, routes, UI, tests, runtime config, Supabase migration, and deployment docs
- supplied early-interest landing page

Decided:

- Reset canonical planning to the pre-production lofi MVP.
- Preserve the dependency-free Node/repository/Supabase patterns and replace the production runtime flow incrementally.
- Delete stale production-MVP task and feedback artifacts from the active workflow; Git history remains the archive.
- Remove the old production spec and runtime artifacts; Git history is the only archive.
- Use a new Supabase project, new Render service, lofi-specific tables, Resend, and `cohort15.com`.
- Start implementation with L001 and execute tasks one at a time in later chats.

Follow-up cleanup established a runnable lofi-only shell and removed the production-MVP runtime before L001.

## 2026-06-18 — Decision capture audit

- Confirmed meeting schedule details are public throughout, including before quorum.
- Enumerated every retained creation-form field and allowed enum value in the product spec.
- Locked the exact HTTPS meeting-link host allowlist in canonical artifacts.
- Removed stale assumptions left by the legacy-source cleanup.

## 2026-06-18 — End-to-end implementation readiness hardening

- Resolved all remaining L001 implementation policies: record fields, text/email limits, duration/count limits, strict date boundaries, recurrence month-end behavior, DST behavior, public serialization, routes, ordering, and HTTP statuses.
- Defined the three-table persistence boundary, RLS posture, atomic concurrent interest/quorum RPC semantics, and notification idempotency.
- Confirmed rate limits are separate in-memory rolling windows over hashed IPs and are not database data.
- Corrected L002's deleted migration reference to `supabase/migrations/20260618000000_cohort15_lofi.sql`.
- Made task write scopes concrete and strengthened manager/worker readiness rules.
- Expanded the workflow checker to validate task contracts, dependencies/cycles, tracker alignment, graph coverage, and ready-task input existence.
- Linearized L001 through L010 so every implementation chat has exactly one next task and no shared-file parallel wave.

No open implementation questions remain before L001.

## 2026-06-18 — L001 domain and validation

- Added exact cohort, interest, and notification-delivery domain records and enums.
- Implemented normalization and all specified field, email, enum, number, timezone, local-date, and meeting-link validation boundaries.
- Implemented calendar-based daily, weekly, biweekly, and month-clamped recurrence with spring-forward and fall-back behavior.
- Added derived collection/quorum state, final-meeting calculation, public schedule serialization, and quorum-gated meeting-link visibility.
- Added deterministic notification idempotency keys without raw recipient emails.
- Kept persistence, HTTP routes, and UI outside this task wave.

Verification completed with 12 focused domain tests and the full repository check. L002 is next.

## 2026-06-18 — L002 isolated lofi persistence

- Added an in-memory lofi store and repository layer for cohorts, interests, and notification deliveries only.
- Added privacy-safe public reads with derived interest counts and server-private email fields.
- Serialized local interest acceptance per cohort and added equivalent transaction-safe Supabase RPC behavior for creator, duplicate, expiry, already-met, and quorum-transition outcomes.
- Added a server-only PostgREST adapter using service-role credentials and isolated `cohort15_lofi_*` objects.
- Added the three-table migration with normalized emails, unique interest/idempotency constraints, RLS, no browser policies, and service-role-only RPC execution.
- Manager review tightened security-definer permissions, search-path isolation, persisted timestamp hydration, database normalization, and local lock cleanup.

Verification completed with 8 focused persistence/Supabase tests and the full repository check. L003 is next.

## 2026-06-18 — L003 anonymous cohort creation

- Added the complete no-auth cohort creation form with private-email consent, approved-link safety guidance, automatic browser timezone capture, and no legacy creator/image/maximum fields.
- Added a creation service that applies the canonical domain validation and persists through the repository boundary.
- Added POST request guards for form media type, 64 KiB bodies, browser Origin matching, generic privacy-safe validation responses, and 303 public-detail redirects.
- Added separate in-memory rolling-window infrastructure that retains SHA-256 IP digests, serializes same-IP attempts, counts successful writes only, and trusts Render forwarding only in production.
- Added a hidden honeypot and a five-success-per-IP creation limit with Retry-After responses.

Focused creation, route, rate-limit, and shell tests passed. L004 is next.

## 2026-06-18 — L004 landing, listing, and lifecycle views

- Reworked the supplied early-interest visual language into the product landing page with creation and browsing actions.
- Added read-only event browsing with normalized All/Active/Expired filters and canonical repository ordering.
- Added landing-page listing cards and public detail pages with exact quorum progress and always-public schedule metadata.
- Added browser-local date/time enhancement with explicit local-time labeling.
- Kept creator and participant emails private, escaped all user content, and rendered meeting links only when public serialization permits them.
- Added the `/cohorts` compatibility redirect and privacy-safe 404 detail behavior.

Focused event browsing/UI tests and the full 34-test repository check passed. L005 is next.

## 2026-06-18 — Workflow status-alignment hardening

- Corrected stale next-task guidance in the README, plan, workflow sheet, and atomic task graph.
- Standardized one machine-checkable `Next ready task: <task IDs>.` line across status-facing workflow artifacts.
- Extended the workflow checker to derive ready tasks from `tasks.json` and verify every task's graph status.
- Expanded manager closeout requirements so task completion cannot omit status-facing documents.

## 2026-06-18 — L005 anonymous interest and quorum unlock

- Added normalized email-only interest submission without authentication.
- Added lifecycle-aware detail forms with private-email consent and a hidden honeypot.
- Added guarded POST handling for media type, body size, Origin, validation, conflict, missing-cohort, and rate-limit outcomes.
- Reused the atomic repository operation so exactly one accepted concurrent write reaches quorum and exposes the meeting link immediately.
- Added a separate ten-success rolling IP limiter; rejected and honeypot submissions consume no allowance.
- Kept notification delivery outside this task for L006.

Focused interest/rate-limit tests and the full 39-test repository suite passed. L006 is next.
