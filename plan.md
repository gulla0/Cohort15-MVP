# Cohort15 Lofi MVP Plan

## Project

Cohort15's lofi MVP is a public interest-gathering application deployed before the authenticated production MVP. Visitors anonymously create cohort requests or show interest with a mandatory private email. Quorum makes the approved meeting link public.

Product behavior source: `docs/cohort15-lofi-mvp-spec.md`.

The prior credit/auth/payment specification and implementation remain available only through Git history; they are not authoritative for this branch.

## Goal

Deploy the smallest real product that validates:

1. whether visitors create specific cohort requests;
2. whether other visitors submit interest;
3. whether quorum-driven public meeting links lead to viable groups; and
4. whether email notifications are sufficient without accounts.

## Hard Constraints

- Reuse the current dependency-free Node.js application where practical.
- No auth, credits, payments, images, social publishing, dashboards, or creator self-service management.
- Store real data in a new, isolated Supabase project.
- Deploy through a separate Render service and replace the Netlify page at `cohort15.com`.
- Keep creator and participant emails private.
- Use the exact meeting-provider host allowlist and HTTPS-only validation in the lofi specification.
- Collection lasts seven days; first meeting occurs after that window.
- Run `npm run check` after workflow or human-task documentation changes.

## Architecture Direction

- Keep the existing Node HTTP server, ES modules, server-rendered HTML, repository boundary, and Node test runner.
- Replace account IDs with normalized private email identities scoped to lofi cohorts/interests.
- Create lofi-specific Supabase tables rather than altering or sharing the existing production-MVP schema.
- Compute active/expired listing state from `expiresAt` on reads so expiry does not require a paid scheduler.
- Use Resend's HTTP API from the server for transactional email.
- Keep submission success independent from email delivery; persist or log delivery outcomes without exposing PII.
- Implement separate in-memory rolling IP limits over SHA-256 IP digests, counting successful writes only, suitable for one initial Render instance. Scaling to multiple instances requires a shared limiter.
- Treat `docs/cohort15-lofi-mvp-spec.md` as the complete implementation-policy source for validation limits, recurrence/DST behavior, lifecycle boundaries, routes, ordering, persistence concurrency, notification idempotency, and HTTP errors.

## Execution Phases

### Phase 1 — Domain And Data Isolation

- L000: establish the clean lofi application shell. (complete)
- L001: simplify the lofi domain and validation policy.
- L002: add isolated lofi persistence and Supabase migration.

Exit: anonymous lofi cohorts/interests can be validated and persisted without touching production-MVP tables.

### Phase 2 — Public Product Flow

- L003: build anonymous cohort creation with abuse controls.
- L004: after creation works, rebuild the landing page and public listing/lifecycle views.
- L005: build anonymous interest and quorum-driven public link behavior.

Exit: the complete create → browse → interest → quorum flow works locally with private emails.

### Phase 3 — Notifications And Production Runtime

- L006: add transactional confirmation and quorum emails.
- L007: isolate lofi production configuration and deployment behavior.

Exit: the app is configured for a distinct Supabase project, Render service, Resend account/domain, and `cohort15.com`.

### Phase 4 — Launch Verification

- L008: complete privacy, abuse, lifecycle, and end-to-end verification.
- L009: execute human provider setup and deploy the isolated environment.
- L010: run the production smoke test and domain cutover verification.

Exit: `cohort15.com` serves the verified lofi MVP and no production-MVP database or credentials are involved.

## MVP Cut

Build now:

- branded landing page with full listing and All/Active/Expired filters;
- anonymous cohort creation with mandatory creator email;
- anonymous email-only interest submission;
- normalized duplicate prevention and creator exclusion;
- public counts and quorum progress;
- seven-day lifecycle and active-first sorting;
- public approved-provider meeting link after quorum until the final meeting ends;
- creator/participant confirmations and quorum notifications;
- honeypots and per-IP hourly limits;
- isolated Supabase, Render, Resend, and root-domain deployment.

Explicitly defer:

- auth, profiles, editing/deletion, admin UI, moderation UI;
- credits, Stripe, payments, social automation;
- images and uploads;
- email verification and expiry emails;
- data import from the current landing-page Sheet;
- multi-instance distributed rate limiting;
- later production-MVP payment, social, auth, and operations work.

## Assumptions And Risks

- A single Render instance is acceptable for launch; in-memory rate limiting resets on deploy and is not shared across instances.
- Email confirmation is informational, not identity verification.
- Public meeting links can be copied by anyone while visible; the provider allowlist reduces unsafe destinations but does not make public rooms private.
- The clean shell has removed legacy source modules; future tasks create only the lofi modules named in their task contracts.
- Provider dashboards and DNS changes are human tasks documented in `docs/human-tasks/lofi-mvp-launch.md`.

## Open Implementation Questions

None. Reversible internal code organization remains at the implementing manager's discretion, but observable behavior, persisted data, security/privacy boundaries, and acceptance rules are locked in the specification and task contracts.

## First Ready Task

L000 is complete. Start with L001; it establishes the field and lifecycle contract required by every later implementation task.
