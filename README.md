# Codex Agent Architecture Setup

This folder is a copyable starter kit for running a repository with bounded agent execution.

Copy these files into the root of any software repo, then customize the product-specific artifacts:

1. `plan.md`
2. `atomic-task-graph.md`
3. `tasks.json`
4. `agent/knowledge/index.md`

The architecture separates intake, context discovery, planning, execution, validation, and feedback handling.

## Role Transition Model

`start.txt` is the normal user-facing entry point. The router does not have to spawn a separate long-lived agent process to continue work. After intent is clear and the user has approved routed work, the same user-facing agent assumes the appropriate next role by following that role's starter prompt.

In this architecture, "handoff" means a controlled role transition unless an implementation explicitly uses separate sessions or agents.

- Router role: classify intent, check readiness, summarize the proposed next role, and get approval when needed.
- Manager role: after approval, own planning, task selection, verification, tracker updates, and user-facing reporting.
- Worker role: only used below a manager for bounded execution tasks. Workers are not user-facing and do not choose their own work.
- Direct work: if the approved next role can safely complete the task without worker delegation, it may do the work itself while following that role's rules.

## Core Flow

```text
user request
-> intent router
-> direct answer/action OR approved role transition into setup / implementation / feedback management
-> knowledge index lookup
-> atomic task graph / task ledger
-> manager selects unblocked task wave
-> manager assigns bounded workers
-> workers report back to manager
-> manager verifies code
-> progress and knowledge artifacts are updated
```

## What Each Layer Owns

- Intent router: decides whether a request is direct discussion/action, setup/bootstrap, main implementation, change/fix work, or feedback work, then transitions into the approved next role when work should begin.
- Knowledge index: tells agents where relevant repo context lives.
- Atomic task graph: defines bounded executable work and dependencies.
- Manager prompts: coordinate task waves, delegation, verification, and progress updates.
- Worker prompt: executes one manager-assigned task and reports evidence back to the manager.
- Progress files: preserve restart state and audit trail.
- Feedback system: keeps user feedback in issue-local graphs instead of polluting the main task graph.

## First-Time Setup In A New Repo

1. Copy this folder's contents into the target repo root.
2. Start a user-facing session with `start.txt`.
3. If the repo starts from rough product notes or an architecture file, the router should route setup by assuming `agent-starters/startSetupManager.txt` after approval.
4. If planning artifacts already exist, the router should route implementation by assuming `agent-starters/startNewManager.txt` after approval.
5. If you bypass routing, replace placeholder product content in `plan.md`.
6. Replace placeholder tasks in `atomic-task-graph.md` and `tasks.json`.
7. Update `agent/knowledge/index.md` after inspecting the repo.
8. If you need to bypass routing for a controlled workflow, start the relevant manager directly.

## Bootstrap From Rough Input

Use `start.txt` when the product is not yet converted into this architecture's artifacts. The router should classify the request as setup/bootstrap and, after approval, assume `agent-starters/startSetupManager.txt`.

The setup manager takes a product discussion, architecture document, rough notes, or existing codebase and initializes:

- `plan.md`
- `atomic-task-graph.md`
- `tasks.json`
- `agent/knowledge/index.md`
- progress tracking files

It should ask only blocking clarification questions, record non-blocking assumptions, and stop once the repo is ready for implementation agents.

## Source Of Truth Rules

- `tasks.json` is the canonical main task ledger.
- `agent/progress/task-status.md` is a readable derived/working view of `tasks.json`.
- Code verification beats tracker claims.
- `agent/feedback/issue-index.md` is the source of truth for issue-level feedback status.
- Each feedback issue folder owns its own `tasks.json` dependency graph.
- `agent/knowledge/index.md` is advisory context routing, not proof that code behaves a certain way.

## Keep It Lightweight

This setup intentionally avoids a heavy orchestration harness. The first version should work as prompts and repo artifacts. Add automation only after the manual workflow proves repetitive and stable.
