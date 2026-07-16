# Task Graph - ISSUE-L002

## Issue Summary

Let anyone copy a self-contained public cohort request in at most 280 characters.

## Tasks

- ISSUE-L002-T01 Define the 280-character portable request contract
  - Depends on: none
- ISSUE-L002-T02 Implement portable request copy controls
  - Depends on: ISSUE-L002-T01

## Dependency Order

```text
ISSUE-L002-T01 -> ISSUE-L002-T02
```

## Expected Write Scopes

| Task | Files Expected | Overlap Risk |
|---|---|---|
| ISSUE-L002-T01 | canonical Piece of Pie specification | medium: shared product authority |
| ISSUE-L002-T02 | cohort UI, landing integration, shared styles, event tests | high: overlaps navigation and landing UI files |

## Next Unblocked Tasks

- None. ISSUE-L002 is complete.
