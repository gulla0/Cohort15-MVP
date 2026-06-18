# Repository Agent Instructions

## Human Tasks

All work requiring a person to use an external provider dashboard, manage credentials, make an operational decision, or perform production verification must be documented in `docs/human-tasks/`.

Every human-task document must:

- include a `## Human Setup Checklist` section
- be listed in `docs/human-tasks/README.md`
- contain no credentials or secret values

Do not create human-action checklists or runbooks elsewhere in the repository. Product specifications, implementation documentation, automated task ledgers, and historical progress records remain in their existing locations and should link to the relevant human-task document when needed.

Run `npm run check` after changing agent workflow artifacts or human-task documentation.
