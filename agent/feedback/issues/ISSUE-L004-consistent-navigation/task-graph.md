# Task Graph - ISSUE-L004

## Issue Summary

Use one coherent header everywhere and group account operations behind visible credit state.

## Tasks

- ISSUE-L004-T01 Define the shared navigation contract
  - Depends on: none
- ISSUE-L004-T02 Build and adopt the shared navigation renderer
  - Depends on: ISSUE-L004-T01
- ISSUE-L004-T03 Simplify the shared navigation styling
  - Depends on: ISSUE-L004-T02

## Dependency Order

```text
ISSUE-L004-T01 -> ISSUE-L004-T02 -> ISSUE-L004-T03
```

## Expected Write Scopes

| Task | Files Expected | Overlap Risk |
|---|---|---|
| ISSUE-L004-T01 | canonical Piece of Pie specification | medium: shared product authority |
| ISSUE-L004-T02 | all page shells, auth UI, shared styles, broad UI tests | high: central shared UI and test surface |
| ISSUE-L004-T03 | canonical visual guidance, shared styles, focused navigation tests | medium: visible site-wide styling |

## Next Unblocked Tasks

- None. ISSUE-L004 is complete.
