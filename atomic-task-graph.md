# Cohort15 Lofi MVP Atomic Task Graph

`tasks.json` is canonical. This file is the readable dependency view.

## Execution Graph

```text
L001 Lofi domain and validation
  └─ L002 Isolated persistence and Supabase migration
       ├─ L003 Anonymous cohort creation
       └─ L004 Landing, listing, and lifecycle views
            └──────────────┐
L003 ──────────────────────┴─ L005 Anonymous interest and quorum unlock
L003 + L005 ───────────────── L006 Resend notifications
L002 + L006 ───────────────── L007 Isolated production config/deployment
L004 + L005 + L006 + L007 ── L008 Privacy, abuse, and end-to-end verification
L008 ──────────────────────── L009 Human provider setup and deployment
L009 ──────────────────────── L010 Production smoke test
```

## Atomic Task Contracts

### L001 — Define the lofi domain and validation policy

- Depends on: none
- Owns: domain constants, models, validation, focused tests
- Delivers: seven-day lifecycle, quorum 1–15, no participant cap, normalized creator email, approved links, meeting timing, final-meeting link cutoff
- Stops before: persistence and HTTP integration

### L002 — Add isolated lofi persistence and Supabase migration

- Depends on: L001
- Owns: lofi repositories, Supabase mapping, `cohort15_lofi_*` migration, persistence tests
- Delivers: anonymous cohort/interest persistence, private emails, duplicate database constraint, notification outcome storage
- Stops before: public forms and live provider setup

### L003 — Build anonymous cohort creation

- Depends on: L002
- Owns: create service/route/form, timezone capture, honeypot, five-per-hour IP limit, tests
- Delivers: no-auth creation and redirect to public detail
- Stops before: interest and live email

### L004 — Build the landing page, listing, and lifecycle views

- Depends on: L002
- Owns: supplied landing-page adaptation, public browsing, filters, sorting, local-time rendering, safe link display, tests
- Delivers: full listing on `/`, All/Active/Expired filters, active-first default, persistent expired posts
- Stops before: form mutations

### L005 — Build anonymous interest and quorum unlock

- Depends on: L003, L004
- Owns: interest service/route/form, duplicate and creator exclusion, honeypot, ten-per-hour IP limit, tests
- Delivers: email-only interest and immediate public link unlock at quorum
- Stops before: notification delivery

### L006 — Add Resend confirmation and quorum notifications

- Depends on: L003, L005
- Owns: email adapter/composition/config/integration, delivery outcomes, tests
- Delivers: creator confirmation, participant confirmation, quorum notifications
- Stops before: live Resend dashboard configuration

### L007 — Isolate lofi production configuration and deployment

- Depends on: L002, L006
- Owns: runtime config, startup, `.env.example`, `render.yaml`, deployment docs/tests
- Delivers: lofi-only environment contract with no auth/Stripe/social/image dependencies
- Stops before: provider or DNS changes

### L008 — Complete lofi privacy, abuse, and end-to-end verification

- Depends on: L004, L005, L006, L007
- Owns: integration tests, privacy/abuse coverage, obsolete runtime route removal, local smoke verification
- Delivers: local launch gate with `npm run check` passing
- Stops before: external deployment

### L009 — Create isolated provider resources and deploy

- Depends on: L008
- Owns: human dashboard and DNS actions documented in `docs/human-tasks/lofi-mvp-launch.md`
- Delivers: separate Supabase project, Render service, Resend setup, and `cohort15.com` cutover
- Stops on: exact provider blocker or verified deployment

### L010 — Run production lofi smoke test

- Depends on: L009
- Owns: deployed-flow verification and closeout evidence
- Delivers: verified production flow, emails, database isolation, analytics, HTTPS/domain behavior
- Stops on: passing launch gate or documented launch blocker

## Execution Rules

- Execute one task at a time unless a manager proves write scopes are disjoint.
- Each implementation chat starts through `start.txt` or directly with `agent-starters/startNewManager.txt`.
- The manager selects the next unblocked task from `tasks.json`; workers do not select tasks.
- Update `tasks.json`, `agent/progress/task-status.md`, session notes, and change log only after implementation and verification.
- Commit each successful task wave separately.
- External provider work must follow `docs/human-tasks/lofi-mvp-launch.md`; never place credentials in repository artifacts or chat.
