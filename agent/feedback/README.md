# Feedback System

Feedback work is intentionally separate from the main implementation task graph.

Use this system when user feedback describes a bug, UX issue, missing behavior, confusion, or product pain that should become structured work.

## Files

- `issue-index.md`: canonical issue-level backlog.
- `session-notes.md`: append-only feedback intake/resolution notes.
- `issues/`: one folder per issue.

## Issue Folder Contract

Each issue folder should contain:

- `issue.md`
- `tasks.json`
- `task-graph.md`
- `task-status.md`
- `session-notes.md`
- `change-log.md`
- `blockers.md`

## Rules

- Keep each issue's task graph local to that issue.
- Do not add feedback tasks to the main `tasks.json`.
- Record expected write scope and overlap risk for each issue task.
- Update issue `tasks.json` first, then align Markdown views.
