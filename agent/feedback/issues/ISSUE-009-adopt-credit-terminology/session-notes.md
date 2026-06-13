# ISSUE-009 Session Notes

## 2026-06-13

Created from user feedback requesting a repo-wide vocabulary migration to `credit`. Repository search confirmed this was broad and affected app code, tests, docs, task ledgers, knowledge/progress files, and resolved feedback artifacts.

## 2026-06-13 Resolution

Decided:
- Execute ISSUE-009 as one sequential wave because app tests, documentation, and the workflow guardrail all depend on consistent terminology.
- Rename app-facing code and files to credit terminology, including the persistence ledger module and transaction repository.
- Preserve behavior and costs: creators use 2 credits, participants use 1 credit, held credits are consumed on quorum and returned on expiry.
- Add local JSON compatibility normalization so older development snapshots load into the current credit-shaped store without duplicate seed grants.

Verified:
- Repository search found no remaining literal references to the previous vocabulary.
- Focused app tests passed.
- `npm run check:workflow` passed.
- `npm run check` passed.
