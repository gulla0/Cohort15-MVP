# Lofi MVP Workflow Sheet

## Current Phase

Notifications and Production Runtime

## Current Critical Path

L000 → L001 → L002 → L003 → L004 → L005 → L006 → L007 → L008 → L009 → L010

Next ready task: L008.

## Ready Task Candidates

| Task | Why ready | Notes |
|---|---|---|
| L008 | L007 is complete and every current input exists | Run the local privacy, abuse, and end-to-end launch gate. |

## Known Parallelism

None. The lofi critical path is intentionally linear so each implementation chat has one unambiguous next task and shared server/UI files never receive concurrent edits.

## Known Coupling

| Tasks / areas | Why coupled | Sequencing |
|---|---|---|
| L001 and L002 | Persistence must encode the final domain fields and constraints. | Complete L001 first. |
| L003, L004, L005 | All touch routes and public cohort UI. | Integrate creation and browsing before interest. |
| L005 and L006 | Quorum notifications depend on accepted-interest and activation semantics. | Complete L005 first. |
| L007 and L009 | Provider setup depends on finalized environment names and deployment config. | Complete L007/L008 before dashboard and DNS work. |

`tasks.json` remains canonical.
