# Task Graph - ISSUE-002

## Issue Summary

Add image support for cohort events, including a polished default image based on the provided attached asset.

## Tasks

- ISSUE-002-T01 Add event image field and default asset path
  - Depends on: none
- ISSUE-002-T02 Render event images across MVP surfaces
  - Depends on: ISSUE-002-T01
- ISSUE-002-T03 Add creator image input
  - Depends on: ISSUE-002-T01

## Dependency Order

```text
ISSUE-002-T01
ISSUE-002-T02
ISSUE-002-T03
```

## Expected Write Scopes

| Task | Files Expected | Overlap Risk |
|---|---|---|
| ISSUE-002-T01 | event model/validation/schema/create service/tests and asset location | medium |
| ISSUE-002-T02 | feed/detail/dashboard rendering, services, styles, tests | medium |
| ISSUE-002-T03 | create form/service/tests | low |

## Next Unblocked Tasks

- None. All issue tasks are done.
