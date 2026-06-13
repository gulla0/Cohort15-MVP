# ISSUE-004 Task Graph

```mermaid
graph TD
  T01["ISSUE-004-T01 Remove repeated dashboard credit details"]
  T02["ISSUE-004-T02 Simplify dashboard credit summary states"]
  T03["ISSUE-004-T03 Rename dashboard sections around user intent"]
  T04["ISSUE-004-T04 Review dashboard user flow hierarchy"]

  T01 --> T02
  T01 --> T03
  T01 --> T04
  T02 --> T04
  T03 --> T04
```

## Order Rationale

Start by removing duplicate credit detail so the remaining dashboard content is easier to reason about. Then simplify the summary states and rename the dashboard sections. Finish with a broader flow review once the content and vocabulary are stable.

## Resolution

All ISSUE-004 tasks were completed on 2026-05-30. The dashboard now leads with account credit state, renders only Available/In use/Used, removes repeated row-level credit details, and uses content-based sections for Active Cohorts & Schedule, Created Cohorts, and Interested Cohorts.
