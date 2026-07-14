# Usage Guide

## Bootstrapping A New Repo Or Product Idea

Use:

```text
start.txt
```

Use this when you have a rough product discussion, architecture file, notes, or an existing codebase that has not yet been converted into this architecture's planning artifacts. The router should classify this as setup/bootstrap and, after approval, assume the setup manager role from `agent-starters/startSetupManager.txt`.

The setup manager should initialize `plan.md`, `atomic-task-graph.md`, `tasks.json`, `agent/knowledge/index.md`, and progress files. It should not implement product code unless explicitly asked after setup is complete.

## Starting Main Implementation

Paste or reference `start.txt` for the user-facing router. It should classify the request and, after approval, assume the manager role for implementation work.

To bypass routing when the intent is already known, start directly with:

```text
agent-starters/startNewManager.txt
```

Managers may delegate bounded implementation tasks using:

```text
agent-starters/startWorker.txt
```

Workers are internal executors. They should not be the user-facing entry point.

In normal use, the same user-facing agent transitions from router role into the selected manager role. Separate worker agents or sessions are only needed when that manager delegates bounded tasks.

Managers should commit successful completed task waves after verification and tracker updates. Workers should not commit unless the manager explicitly assigns commit responsibility.

## Starting Feedback Intake

Use:

```text
agent-starters/startFeedbackCreationManager.txt
```

This creates or updates issue-local feedback artifacts. It should not implement code unless explicitly asked.

## Starting Feedback Resolution

Use:

```text
agent-starters/startFeedbackResolutionManager.txt
```

This resolves issue-local task graphs and updates feedback trackers.

Before handoff, feedback resolution should run `npm run check` and fix any agent workflow guardrail failure. The guardrail validates task contracts/dependencies, tracker alignment, ready inputs, human-task rules, feedback issue contracts/indexing, and knowledge routes.

After successful feedback intake or resolution, the manager should commit the completed issue wave and include the commit hash in the handoff report.

In normal use, `start.txt` should route by role transition into these managers. Directly starting a manager is useful when the intent is already known.

## Auditing Or Repairing Agent Workflow

Use `start.txt` for requests about orchestration paths, knowledge-layer accessibility, stale trackers, schema drift, or workflow documentation. The router should transition to:

```text
agent-starters/startWorkflowMaintenanceManager.txt
```

This manager reconciles canonical authority first, then derived trackers and pointer indexes. It does not implement product features.

## Updating The Knowledge Index

Update `agent/knowledge/index.md` when an agent learns reusable context such as:

- canonical modules
- feature ownership
- routing rules for common task types
- stale assumptions
- files that should be avoided unless relevant

Keep it pointer-based. Product behavior belongs in the canonical specification, task and issue history belongs in their ledgers/logs, and human operations belong under `docs/human-tasks/`.

Do not treat the index as proof. Verify against code before marking work done.

`npm run check` verifies that active feedback folders are indexed and structurally valid, and that the knowledge index points to the canonical feedback index. Issue histories remain issue-local.

## Adding A Main Task

Add tasks to `tasks.json` with:

- `objective`
- `inputs`
- `write_scope`
- `authority`
- `acceptance_criteria`
- `verification`
- `stop_condition`
- dependencies

Then update `atomic-task-graph.md` and `agent/progress/task-status.md`.

## Adding A Feedback Issue

Copy `templates/feedback-issue` into `agent/feedback/issues/ISSUE-###-short-slug` and customize all placeholders.

Then add the issue to `agent/feedback/issue-index.md`.
