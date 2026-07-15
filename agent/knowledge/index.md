# Knowledge Index

Pointer-based context router for the `codex/piece-of-pie` branch. Verify against code and canonical ledgers before acting.

## Authority Map

| Artifact | Purpose | Authority |
|---|---|---|
| `docs/cohort15-piece-of-pie-mvp-spec.md` | Locked account, credit, payment, preserved-product, security, and launch behavior | Current product source |
| `docs/cohort15-lofi-mvp-spec.md` | Historical description of the anonymous baseline | Context only; superseded where current spec differs |
| `plan.md` | Three-day scope, architecture direction, phases, assumptions, and risks | Planning source |
| `tasks.json` | Active L015–L020 task contracts and status | Canonical main task ledger |
| `atomic-task-graph.md` | Readable active-task dependencies | Derived planning view |
| `agent/progress/task-status.md` | Readable state and next ready task | Derived status view |
| `agent/feedback/issue-index.md` | Feedback issue status and issue-folder routes | Canonical issue index |
| `docs/human-tasks/README.md` | Index of provider, credential, migration, deployment, and production-verification work | Human operations index |
| `schemas/main-task.schema.json` | Main task contract shape | Task schema |
| `schemas/routed-work-request.md` | Approved role-transition request shape | Routing schema |

Historical evidence belongs in `agent/progress/session-notes.md`, `agent/progress/change-log.md`, and Git. Do not restore the retired lofi task ledger from history.

## Agent Workflow Routes

- Sole fresh-chat entry: `start.txt`, then `agent/router/intent-router.md`.
- Planned Piece of Pie implementation: `agent-starters/startNewManager.txt` after router approval when required.
- Setup/bootstrap: `agent-starters/startSetupManager.txt`.
- Feedback intake: `agent-starters/startFeedbackCreationManager.txt`.
- Feedback resolution: `agent-starters/startFeedbackResolutionManager.txt`.
- Workflow/knowledge/schema/tracker maintenance: `agent-starters/startWorkflowMaintenanceManager.txt`.
- Bounded internal execution delegated by a manager: `agent-starters/startWorker.txt`.

The repository artifacts are a complete fresh-chat handoff. Do not require the prior setup conversation or ask the user to choose a starter when the next task is clear.

## Context Routes

| Work type | Read first | Then inspect |
|---|---|---|
| Main implementation | `tasks.json`, `agent/progress/task-status.md` | Selected task inputs and exact write scope |
| Product behavior | `docs/cohort15-piece-of-pie-mvp-spec.md` | Relevant current service/UI code and tests |
| Existing lofi regression | Current product spec's preserved behavior | `docs/cohort15-lofi-mvp-spec.md` and affected code/tests |
| Human/provider operation | `docs/human-tasks/README.md` | `docs/human-tasks/piece-of-pie-launch.md` or the one indexed checklist involved |
| Feedback work | `agent/feedback/issue-index.md`, `agent/feedback/README.md` | Only the selected issue folder and affected code |
| Workflow drift | `start.txt`, this index, `agent-starters/startWorkflowMaintenanceManager.txt` | Router, starters, schemas, trackers, and workflow guard |

## Current Application Routes

| Area | Current files | Planned owner |
|---|---|---|
| Runtime | `src/server/app.mjs`, `src/config/runtime.mjs` | L016–L019 auth, funded actions, payment routes, production contract, and local launch verification complete |
| Domain | `src/domain/constants.mjs`, `src/domain/models.mjs`, `src/domain/validation.mjs` | L015 foundation complete; L016–L018 consume it |
| Persistence | `src/persistence/store.mjs`, `src/persistence/repositories.mjs`, `src/persistence/supabase-postgres.mjs` | L015 ledger, L017 funded actions, and L018 purchase fulfillment integration complete |
| Create flow | `src/services/create-cohort.mjs`, `src/services/rate-limit.mjs`, `src/ui/create-cohort.mjs` | L017 complete |
| Browse/detail | `src/services/event-browsing.mjs`, `src/ui/home.mjs`, `src/ui/cohorts.mjs`, `src/ui/styles.css` | Preserved through the completed L019 local launch gate |
| Interest flow | `src/services/show-interest.mjs`, `src/ui/cohorts.mjs`, `src/server/app.mjs` | L017 complete |
| Email | `src/email/resend.mjs`, `src/services/notifications.mjs` | Preserved with private authenticated identity integration |
| Feedback | `src/services/feedback.mjs`, `src/ui/feedback-widget.mjs` | Preserve/regression only |
| Editorial | `src/ui/research.mjs`, `tests/research.test.mjs` | Preserve/regression only |
| Authentication | `src/auth/supabase.mjs`, `src/auth/session.mjs`, `src/ui/auth.mjs`, `src/server/app.mjs` | L016 complete; L017 consumes session/CSRF context for funded mutations |
| Payment | `src/payments/stripe.mjs`, `src/services/purchases.mjs`, `src/ui/credits.mjs`, `src/server/app.mjs` | Fixed Checkout package, signed webhook, verified return, and shared idempotent fulfillment complete |

## Reusable Decisions

- The active branch is `codex/piece-of-pie`, based on the deployed lofi branch. `main` is read-only reference only; do not merge or cherry-pick it.
- Stack remains Node.js ES modules with server-rendered HTML and server-only Supabase access.
- Production identity uses Supabase email magic links only for this MVP.
- New accounts receive two ledger-backed credits exactly once.
- Creation costs two credits; interest costs one; credits are held, consumed at quorum, and refunded below quorum at expiry.
- Payment has one package: six credits for USD $6 via Stripe Checkout.
- Signed webhook and verified browser return share one idempotent fulfillment path.
- Existing anonymous rows remain nullable/unclaimed and keep their public/quorum behavior without historical credits.
- Current provider resources are retained and extended; human changes route through the indexed Piece of Pie checklist.

## Safety And Integration Traps

- Never render emails or auth/provider secrets. Raw CSRF material is limited to the authenticated user's opaque cookie and hidden mutation controls; never log it or include it in errors. Never render or log magic-link tokens, Supabase tokens, raw session tokens, Stripe secrets, webhook secrets, Checkout URLs, full provider payloads, card/payment details, IPs, or pre-quorum links.
- Never add a mutable credit balance. Derive all totals from immutable transactions.
- Never grant on an unverified callback, browser redirect alone, unsigned webhook, mismatched purchase, or client-supplied amount/package/user.
- Never duplicate signup or purchase credits under replay or concurrency.
- Never replace the live Supabase project, Render service, domain, Resend sender, or analytics configuration without an explicit user-approved operational decision.
- Never destructively migrate existing cohort, interest, notification, or feedback data.
- Keep public meeting-link timing, schedules, research, feedback, emails, rate limits, and privacy behavior intact.
- Human dashboard, credential, migration, DNS, deployment, hackathon-evidence, and production-verification work belongs only under `docs/human-tasks/`.

## Current Pointers

- Next task: `agent/progress/task-status.md` (L020 human/provider launch verification).
- Current blockers: `agent/progress/blockers.md`.
- Human/provider continuity and new actions: `docs/human-tasks/README.md`.
- Active product source: `docs/cohort15-piece-of-pie-mvp-spec.md`.
- Last setup update: 2026-07-14 EDT.
