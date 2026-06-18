# Knowledge Index

Advisory context router for the lofi MVP branch. Verify against code and `tasks.json` before acting.

## Canonical Artifacts

| Artifact | Purpose | Authority |
|---|---|---|
| `docs/cohort15-lofi-mvp-spec.md` | Locked lofi product behavior | Product source |
| `plan.md` | Scope, architecture direction, phases, risks | Planning source |
| `tasks.json` | Atomic task contracts and status | Canonical task ledger |
| `atomic-task-graph.md` | Readable dependency graph | Derived planning view |
| `agent/progress/task-status.md` | Readable status | Derived status view |
| `docs/human-tasks/lofi-mvp-launch.md` | Separate Supabase/Render/Resend/DNS setup | Human operations source |

`docs/cohort15-mvp-spec-v3.md` and Git history describe the later production MVP. They are historical on this branch and must not override the lofi spec.

## Agent Workflow

- `start.txt` is the user-facing router. It classifies setup, main implementation, change/fix, feedback intake, or feedback resolution.
- Setup/bootstrap transitions to `agent-starters/startSetupManager.txt`.
- Main implementation transitions to `agent-starters/startNewManager.txt`.
- Managers select work from `tasks.json`, own integration and tracker updates, and may delegate bounded work with `agent-starters/startWorker.txt`.
- Workers do not choose tasks, update canonical trackers, or commit unless explicitly authorized.
- Successful task waves require focused verification, `npm run check`, aligned trackers, and an intentional commit.
- Human dashboard, credential, DNS, and production verification work belongs only in `docs/human-tasks/`.

## Application Architecture

| Area | Current files | Lofi direction |
|---|---|---|
| Runtime | `src/server/app.mjs`, `src/config/runtime.mjs` | Reuse Node HTTP routing/startup; remove auth, credits, payments, admin, uploads, and social from the runtime path. |
| Domain | `src/domain/constants.mjs`, `models.mjs`, `validation.mjs` | L001 replaces 14-day/credit/cap/image/private-viewer assumptions with seven-day anonymous lofi rules. |
| Persistence | `src/persistence/*`, `supabase/migrations/*` | Reuse repository/store/PostgREST patterns; L002 creates isolated `cohort15_lofi_*` tables and does not touch existing tables. |
| Create flow | `src/services/create-cohort.mjs`, `src/ui/create-cohort.mjs` | Reuse form fields and validation patterns; remove auth, credits, max participants, images, and social; add private creator email and abuse controls. |
| Browse flow | `src/services/event-browsing.mjs`, `src/ui/home.mjs`, `src/ui/cohorts.mjs` | Adapt supplied marketing page, place full listing on `/`, sort active first, add status filters and public quorum progress. |
| Interest flow | `src/services/show-interest.mjs`, cohort detail route/UI | Replace signed-in user/credit logic with normalized email-only interest and public link unlock. |
| Email | No lofi adapter yet | L006 adds a small Resend HTTP adapter with fake-provider tests. |
| Tests | `tests/*.test.mjs`, Node test runner | Rewrite incrementally per task; L008 owns full lofi integration and stale route removal. |

## Reusable Decisions

- Stack remains dependency-free Node.js ES modules with server-rendered HTML.
- Approved meeting hosts already exist in `ALLOWED_MEETING_LINK_HOSTS`: Google Meet, Zoom, Microsoft Teams, Discord, and Slack.
- Existing browser-local time enhancement can be reused, but creation must submit the browser timezone/absolute timestamp explicitly.
- Existing Supabase adapter uses server-side REST with a service-role key; the lofi deployment must use a new project and lofi-only table names.
- The supplied marketing source is `/Users/gzero/Desktop/cohort15/Marketing/early-interest-landing-page/index.html`; reuse its visual language and Google Analytics ID `G-LF22TLDSBV` without editing that external file.

## Privacy And Isolation Traps

- Never render creator or participant emails.
- Never log raw emails, IP addresses, API keys, meeting links before quorum, session tokens, or provider responses containing secrets.
- Never point lofi configuration at an existing production-MVP Supabase project or Render service.
- Do not reuse old T-task backlog or prior feedback issues; Git history is the archive.
- Public meeting links remain visible from quorum until the final meeting ends, even if the seven-day collection listing has expired.
- Expiry is computed from time on reads; no scheduler or expiry email is required.

## Current State

- Planning reset completed on 2026-06-18.
- Product implementation has not started.
- Next ready task: L001.
