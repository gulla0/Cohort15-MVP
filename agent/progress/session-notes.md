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

## 2026-06-18 — L006 Resend notifications

- Added a dependency-free Resend HTTP adapter with fixed sender/reply-to, one recipient per request, provider idempotency headers, and a five-second timeout.
- Added deterministic delivery orchestration for creator and participant confirmations plus creator/all-participant quorum notifications.
- Persisted pending deliveries before provider calls and recorded sanitized sent/failed outcomes without rolling back accepted submissions.
- Kept expiry email, retry infrastructure, live credentials, and provider dashboard work out of scope.
- Added fake-provider coverage for message composition, duplicate suppression, quorum fanout, private recipients, and failure isolation.

Focused notification/create/interest tests and the full 44-test repository suite passed. L007 is next.

## 2026-06-18 — L007 isolated production configuration

- Completed the eight-variable lofi application contract plus Render host/port settings.
- Made production fail fast when app, analytics, Supabase, Resend, sender, or reply-to configuration is absent or invalid.
- Made production startup construct the isolated Supabase repositories and removed the possibility of silently using in-memory persistence.
- Kept development and tests dependency-free with local persistence and safe non-secret defaults.
- Aligned `.env.example`, Render Blueprint configuration, README guidance, and the indexed human launch runbook without adding credentials.

Focused runtime configuration tests and the full 47-test repository suite passed. L008 is next.

## 2026-06-18 — L008 privacy, abuse, and end-to-end launch gate

- Added an integrated anonymous flow covering creation, listing filters, private interest, duplicate and creator rejection, quorum unlock, seven-day expiry, and final-meeting link hiding.
- Added consolidated privacy and abuse checks for both honeypots, request guards, public responses, logs, secrets, pre-quorum links, and deferred product routes.
- Verified existing focused coverage for both IP limits, concurrency, body/media/origin boundaries, and notification idempotency.
- Ran responsive browser smoke checks at 1280x720 and 390x844 with no horizontal overflow.
- Found and fixed a browser-local time formatter exception by replacing the invalid `dateStyle`/`timeStyle` plus `timeZoneName` combination with explicit date/time fields.

Focused launch tests and browser verification passed. L009 is next and requires the indexed human provider setup runbook.

## 2026-06-20 — L011 Research & Field Notes

- Added a public `/research` editorial index and integrated it into the landing, creation, and cohort-detail navigation.
- Published an edited demand-research synthesis at `/research/why-small-committed-groups` with methodology, patterns, product implications, limitations, and cohort CTAs.
- Excluded handles, outreach notes, internal scoring, source-detail links, and research-tool citation markers from the raw report.
- Added a structured, escaped entry renderer with HTTP(S)-only external links and `/research/`-only internal routes for future articles, field notes, YouTube updates, and external publications.
- Added responsive editorial styles, visible keyboard focus, semantic landmarks, labeled navigation, and focused route/rendering/privacy tests.

Focused research and affected-route tests passed. The in-app browser connection was unavailable during visual verification; full repository verification is recorded in the change log. L009 remains next.

## 2026-06-20 — L012 original product thesis video update

- Reviewed the user-supplied video transcript against the current lofi specification.
- Preserved the founder story, high-intent small-group thesis, quorum concept, public-good motivation, and assemble-then-leave product boundary.
- Presented credits/refunds, maximum membership, post-quorum link entry, and automated social distribution as original ideas rather than current behavior.
- Published the supplied video with a privacy-enhanced embed, direct YouTube link, written summary, explicit “what stayed true” and “what changed” sections, and current-product CTAs.

Focused research and full repository verification passed. L009 remains next.

## 2026-06-20 — L013 small-group formation field note

- Reviewed the supplied draft against the current research collection and implemented MVP behavior.
- Condensed the draft into a six-minute field note while preserving its formation-loop thesis, manual-learning plan, admin-hosted-intent experiment, permissioned-distribution idea, and modest success criteria.
- Corrected the draft's earlier-state framing so public creation, visible schedule/quorum, private interest, meeting-link gating, and the seven-day window are described accurately.
- Explicitly labeled admin-hosted intents, subscriptions, and automated routing as proposed experiments rather than existing features.
- Added the index entry, stable route, CTA, and focused content-boundary and route coverage without changing product behavior or human-operation documentation.

Focused research verification passed. L009 remains next.
