# Cohort15 Lofi MVP Atomic Task Graph

`tasks.json` is canonical. This file is the readable dependency view.

## Execution Graph

```text
L000 Clean lofi application shell (done)
  └─ L001 Lofi domain and validation (done)
       └─ L002 Isolated persistence and Supabase migration (done)
            └─ L003 Anonymous cohort creation (done)
                 └─ L004 Landing, listing, and lifecycle views (done)
                      └─ L005 Anonymous interest and quorum unlock (done)
                           └─ L006 Resend notifications (done)
                                └─ L007 Isolated production config/deployment (done)
                                     └─ L008 Privacy, abuse, and end-to-end verification (done)
                                          └─ L009 Human provider setup and deployment (not_started)
                                               └─ L010 Production smoke test (not_started)
```

## Atomic Task Contracts

### L000 — Establish the clean lofi application shell

- Depends on: none
- Status: done
- Owned: minimal config/server/UI shell, focused tests, legacy runtime deletion, lofi deployment placeholders
- Delivered: runnable home/styles/health shell with auth, credits, payments, dashboards, social, images, old persistence/domain/services, migrations, runbooks, and tests removed
- Stops before: lofi domain and product behavior

### L001 — Define the lofi domain and validation policy

- Depends on: L000
- Status: done
- Owns: domain constants, models, validation, focused tests
- Delivers: exact records/enums, all validation limits, seven-day lifecycle, quorum 1–15, recurrence/month-end/DST behavior, exact approved hosts, public schedule serialization, and final-meeting link cutoff
- Stops before: persistence and HTTP integration

### L002 — Add isolated lofi persistence and Supabase migration

- Depends on: L001
- Owns: lofi repositories, Supabase mapping, `cohort15_lofi_*` migration, persistence tests
- Delivers: three isolated lofi tables, private emails, atomic concurrent interest/quorum transition, duplicate/idempotency constraints, and notification outcome storage; no rate-limit table
- Stops before: public forms and live provider setup

### L003 — Build anonymous cohort creation

- Depends on: L002
- Status: done
- Owns: create service/route/form, timezone capture, honeypot, five-per-hour IP limit, tests
- Delivers: no-auth creation, documented validation/status responses, hashed-IP five-success rolling limit, honeypot handling, and 303 redirect
- Stops before: interest and live email

### L004 — Build the landing page, listing, and lifecycle views

- Depends on: L003
- Status: done
- Owns: supplied landing-page adaptation, public browsing, filters, sorting, local-time rendering, safe link display, tests
- Delivers: full listing on `/`, All/Active/Expired filters, active-first default, persistent expired posts, and meeting schedules visible throughout
- Stops before: form mutations

### L005 — Build anonymous interest and quorum unlock

- Depends on: L004
- Status: done
- Owns: interest service/route/form, duplicate and creator exclusion, honeypot, ten-per-hour IP limit, tests
- Delivers: email-only interest, atomic conflict handling, hashed-IP ten-success rolling limit, and immediate public link unlock at quorum
- Stops before: notification delivery

### L006 — Add Resend confirmation and quorum notifications

- Depends on: L005
- Status: done
- Owns: email adapter/composition/config/integration, delivery outcomes, tests
- Delivers: creator confirmation, participant confirmation, quorum notifications
- Stops before: live Resend dashboard configuration

### L007 — Isolate lofi production configuration and deployment

- Depends on: L006
- Status: done
- Owns: runtime config, startup, `.env.example`, `render.yaml`, deployment docs/tests
- Delivers: finalized lofi-only Supabase/Resend environment contract
- Stops before: provider or DNS changes

### L008 — Complete lofi privacy, abuse, and end-to-end verification

- Depends on: L007
- Status: done
- Owns: integration tests, privacy/abuse/concurrency coverage, launch-blocking fixes, local smoke verification
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

- Execute exactly one task per implementation chat; do not create parallel task waves.
- Each implementation chat starts through `start.txt` or directly with `agent-starters/startNewManager.txt`.
- The manager selects the next unblocked task from `tasks.json`; workers do not select tasks.
- After implementation and verification, update `tasks.json`, `atomic-task-graph.md`, `README.md`, `plan.md`, `workflow-sheet.md`, `agent/progress/task-status.md`, session notes, and change log.
- Commit each successful task wave separately.
- External provider work must follow `docs/human-tasks/lofi-mvp-launch.md`; never place credentials in repository artifacts or chat.
