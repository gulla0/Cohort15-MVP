# Session Notes - ISSUE-L003

Append-only.

## 2026-07-15 - Intake

- Page 1 is a general feedback textarea.
- Page 2 is the current final founder-social and optional contact page.
- The dialog must never appear from a timer, route, or observed visitor action; only clicking Feedback opens it.

## 2026-07-16 - Resolution

- General feedback maps to the existing private `whyOrWhyNot` field; the former survey fields stay nullable for historical compatibility.
- Existing feedback rows are neither rewritten nor removed, so the production schema and current data require no migration.
- The widget now stays closed until `Feedback` is clicked and presents only the general response and founder/contact pages.
- General feedback is required to advance; every contact method remains optional.
- Selecting `Next` completes the general feedback before the optional contact page, whose saves retain completed status.
- Save failure text explicitly states that the response remains in the form and tells the visitor to select `Next` or `Send feedback`.
- Focused tests and responsive browser smoke passed without horizontal overflow.
