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

Git history contains the later production MVP. It must not override the lofi spec on this branch.

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
| Runtime | `src/server/app.mjs`, `src/config/runtime.mjs` | Clean lofi-only Node shell with home, styles, health, and 404 behavior. |
| Domain | not yet created | L001 adds the seven-day anonymous lofi domain from the product spec. |
| Persistence | not yet created | L002 creates isolated repositories and `cohort15_lofi_*` tables. |
| Create flow | not yet created | L003 adds private creator email, retained form fields, timezone capture, and abuse controls. |
| Browse flow | `src/ui/home.mjs`, `src/ui/styles.css` shell only | L004 adds listings, filters, detail views, local times, and public quorum progress. |
| Interest flow | not yet created | L005 adds normalized email-only interest and public link unlock. |
| Email | No lofi adapter yet | L006 adds a small Resend HTTP adapter with fake-provider tests. |
| Tests | `tests/*.test.mjs`, Node test runner | Rewrite incrementally per task; L008 owns full lofi integration and stale route removal. |

## Reusable Decisions

- Stack remains dependency-free Node.js ES modules with server-rendered HTML.
- Approved meeting hosts already exist in `ALLOWED_MEETING_LINK_HOSTS`: Google Meet, Zoom, Microsoft Teams, Discord, and Slack.
- Existing browser-local time enhancement can be reused, but creation must submit the browser timezone/absolute timestamp explicitly.
- The removed Supabase adapter pattern remains available in Git history; L002 may reuse the server-side REST approach with a new project and lofi-only table names.
- The supplied marketing source is `/Users/gzero/Desktop/cohort15/Marketing/early-interest-landing-page/index.html`; reuse its visual language and Google Analytics ID `G-LF22TLDSBV` without editing that external file.

## Privacy And Isolation Traps

- Never render creator or participant emails.
- Never log raw emails, IP addresses, API keys, meeting links before quorum, session tokens, or provider responses containing secrets.
- Never point lofi configuration at an existing production-MVP Supabase project or Render service.
- Do not reuse old T-task backlog or prior feedback issues; Git history is the archive.
- Public meeting links remain visible from quorum until the final meeting ends, even if the seven-day collection listing has expired.
- Expiry is computed from time on reads; no scheduler or expiry email is required.

## Current State

- Planning reset and clean shell L000 completed on 2026-06-18.
- Product implementation has not started.
- Next ready task: L001.
