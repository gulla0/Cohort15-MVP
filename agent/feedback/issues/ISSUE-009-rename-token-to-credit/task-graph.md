# ISSUE-009 Task Graph

```mermaid
flowchart TD
  T01["ISSUE-009-T01 Audit token terminology and plan safe migration"]
  T02["ISSUE-009-T02 Rename app terminology from token to credit"]
  T03["ISSUE-009-T03 Rename repository artifacts from token to credit"]

  T01 --> T02
  T01 --> T03
```

## Execution Notes

Start with the terminology audit because this issue crosses code, tests, docs, and historical workflow artifacts. App terminology and repository artifact updates can proceed after the migration map is clear, but closeout should verify the whole repo together.
