# Lofi MVP Workflow Sheet

## Current Phase

Domain and Data Isolation

## Current Critical Path

L000 (done) → L001 → L002 → L003/L004 → L005 → L006 → L007 → L008 → L009 → L010

## Ready Task Candidates

| Task | Why ready | Notes |
|---|---|---|
| L001 | No dependencies | Define and test the lofi domain before integration work. |

## Known Parallelism

| Tasks | Why parallelizable | Constraint |
|---|---|---|
| L003 and L004 | Creation mutation and read-only landing/listing have mostly distinct services/UI. | Execute one at a time by default; coordinate shared `src/server/app.mjs` and styles. |

## Known Coupling

| Tasks / areas | Why coupled | Sequencing |
|---|---|---|
| L001 and L002 | Persistence must encode the final domain fields and constraints. | Complete L001 first. |
| L003, L004, L005 | All touch routes and public cohort UI. | Integrate creation and browsing before interest. |
| L005 and L006 | Quorum notifications depend on accepted-interest and activation semantics. | Complete L005 first. |
| L007 and L009 | Provider setup depends on finalized environment names and deployment config. | Complete L007/L008 before dashboard work. |

`tasks.json` remains canonical.
