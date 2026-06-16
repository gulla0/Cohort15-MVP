# ISSUE-010 Task Graph

```text
ISSUE-010-T01 Add meaningful create-form placeholders [not_started]
  -> ISSUE-010-T02 Support familiar local image selection [not_started]
```

## Notes

- Placeholder work should land first because it is low-risk and confined to create-form rendering.
- Local image selection is separate because it may require request parsing, validation, persistence, and asset-serving decisions.

## Expected Write Scopes

| Task | Files Expected | Overlap Risk |
|---|---|---|
| ISSUE-010-T01 | `src/ui/create-cohort.mjs`, `tests/create-cohort.test.mjs` | low |
| ISSUE-010-T02 | `src/ui/create-cohort.mjs`, `src/server/app.mjs`, `src/services/create-cohort.mjs`, `src/domain/validation.mjs`, tests, possible `public/` asset path | medium |

## Next Unblocked Tasks

- ISSUE-010-T01
