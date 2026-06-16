# ISSUE-012 Task Graph

```text
ISSUE-012-T01 Add Buy Credits nav placeholder [done]
```

## Notes

- This issue is intentionally narrower than T013. It creates the visible entry point only.
- The resolver should avoid any credit mutation or payment simulation here unless the user explicitly expands scope.

## Expected Write Scopes

| Task | Files Expected | Overlap Risk |
|---|---|---|
| ISSUE-012-T01 | `src/ui/home.mjs`, `src/server/app.mjs`, `src/ui/styles.css`, route/navigation tests | low |

## Next Unblocked Tasks

- None.
