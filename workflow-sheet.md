# Piece of Pie MVP Workflow Sheet

## Current Phase

Day 1 — Identity and Ledger

## Current Critical Path

L015 → L016 → L017 → L018 → L019 → L020

Next ready task: L015.

## Ready Task Candidates

| Task | Why ready | Notes |
|---|---|---|
| L015 | The canonical Piece of Pie specification and all current persistence/migration inputs exist | Build the additive account/session/ledger/purchase boundary before any route or UI work. |

## Known Parallelism

None. The three-day path is intentionally linear because persistence, server routes, shared UI, production configuration, and launch verification are tightly coupled.

## Known Coupling

| Tasks / areas | Why coupled | Sequencing |
|---|---|---|
| L015 and L016 | Auth provisioning depends on atomic user/grant/session persistence. | Complete L015 first. |
| L016 and L017 | Credit-funded mutations require a verified user and CSRF-protected session. | Complete L016 first. |
| L017 and L018 | The payment gate must lead into a working credit-funded product action. | Complete product credit semantics before Stripe. |
| L018 and L019 | Launch verification must cover the final checkout/webhook contract and UI. | Complete Stripe locally before the full gate. |
| L019 and L020 | Human provider mutation is safe only after local code/config verification. | Complete L019 before dashboard or production changes. |

`tasks.json` remains canonical. Every fresh chat begins with `start.txt`.
