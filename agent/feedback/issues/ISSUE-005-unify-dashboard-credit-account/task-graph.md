# Task Graph - ISSUE-005

## Issue Summary

The combined dashboard repeats credit account state by rendering separate creator and participant credit panels, even though the product has one credit type.

## Tasks

- ISSUE-005-T01 Unify dashboard credit account presentation
  - Depends on: none

## Dependency Order

```text
ISSUE-005-T01
```

## Expected Write Scopes

| Task | Files Expected | Overlap Risk |
|---|---|---|
| ISSUE-005-T01 | `src/ui/dashboards.mjs`, `src/services/dashboards.mjs`, `tests/dashboards.test.mjs`, `tests/mvp-verification.test.mjs` | medium |

## Next Unblocked Tasks

- None. ISSUE-005-T01 is done.
