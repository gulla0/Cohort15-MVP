# Feedback System

Feedback work is intentionally separate from the main implementation task graph.

The issue system was reset for the lofi MVP. Do not restore or route against the prior production-MVP issue folders; they remain available through Git history.

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
- Number new lofi issues from `ISSUE-L001`.
- Do not add feedback tasks to the main `tasks.json`.
- Record expected write scope and overlap risk for each issue task.
- Update issue `tasks.json` first, then align Markdown views.
