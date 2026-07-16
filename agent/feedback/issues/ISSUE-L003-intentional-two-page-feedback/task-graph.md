# Task Graph - ISSUE-L003

## Issue Summary

Make feedback voluntary and reduce it to general text plus the existing founder/contact page.

## Tasks

- ISSUE-L003-T01 Lock the click-only two-page feedback contract
  - Depends on: none
- ISSUE-L003-T02 Implement intentional two-page feedback
  - Depends on: ISSUE-L003-T01

## Dependency Order

```text
ISSUE-L003-T01 -> ISSUE-L003-T02
```

## Expected Write Scopes

| Task | Files Expected | Overlap Risk |
|---|---|---|
| ISSUE-L003-T01 | canonical spec and compatibility evidence | medium: shared authority/service inspection |
| ISSUE-L003-T02 | feedback widget, shared styles, feedback tests | medium: shared styles overlap other UI issues |

## Next Unblocked Tasks

- ISSUE-L003-T01
