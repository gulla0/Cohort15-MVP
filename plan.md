# Cohort15 MVP Plan

## Project

Cohort15 is an online cohort-event platform. Creators stake 2 tokens to publish a cohort event, participants stake 1 token to show interest, and tokens remain held until the cohort either reaches quorum or expires. When quorum is met, the event becomes active, held tokens are consumed, and the private online link is revealed. If the event expires before quorum, held tokens are refunded.

Source spec: `docs/cohort15-mvp-spec-v3.md`.

## Product Constraints

- MVP is online-only. There is no in-person location support.
- Creator cost is 2 held tokens per event. Participant interest cost is 1 held token.
- Tokens are held while an event is open and are consumed only when quorum is met.
- Events expire 14 days after creation if quorum is not met.
- Private event links are hidden until quorum is met.
- Maximum participants is 15, and `maxParticipants` must be greater than or equal to `minQuorum`.
- Regular user auth, event feed/detail, creator dashboard, participant dashboard, local/admin token grants, social promotion outbox, token ledger, quorum, and expiry behavior are in MVP scope.
- USD token sales, real automated posting to external social channels, in-app chat, profiles, reputation, AI matching, waitlists, calendar integrations, moderation tooling, and in-person events are post-MVP or out of scope.

## Build Goal

Ship the smallest usable version that proves:

1. A user can create an online cohort by holding 2 tokens.
2. Other users can stake 1 token to show interest, and quorum unlocks the private link.
3. Expired cohorts refund held tokens and keep private links hidden.
4. Newly created cohorts generate public-safe social-promotion copy in a local outbox, ready for later real channel posting.

## Product Decisions Locked For This Plan

- Core event statuses are `open`, `active`, `expired`, `cancelled`, and `completed`; earliest implementation must support at least `open`, `active`, and `expired`.
- Event categories are `learn`, `build`, `practice`, `accountability`, `open_source`, and `explore`.
- Target skill levels are `beginner`, `intermediate`, `advanced`, and `any`.
- Recurrence values are `none`, `weekly`, `biweekly`, and `monthly`.
- One-time events must have exactly one meeting.
- Repeating events must have at least two meetings.
- Token movement must be auditable through transaction records.
- MVP token supply comes from local/admin grants. USD purchase flows come after MVP.
- Initial post-MVP token packages are `$6` for 6 tokens and `$12` for 14 tokens.
- Event interest belongs in a separate object from the event.
- Private links must never be included in public social outbox content or later public social posts.

## Execution Phases

### Phase 1 - Product Scaffold And Domain Foundation

Goal:
- Establish the app stack, domain model, validation rules, persistence schema, and test harness.

Tasks:
- T001
- T002
- T003

Exit criteria:
- A runnable app skeleton exists with automated checks.
- Cohort event, interest, token transaction, and social post concepts are represented in typed code and persistence.
- Spec validation rules are covered by focused tests.

### Phase 2 - Core Cohort Flow

Goal:
- Implement the user-facing create, feed, detail, interest, quorum, token, and expiry flows.

Tasks:
- T004
- T005
- T006
- T007

Exit criteria:
- Users can create open cohorts, browse public event information, show interest, unlock quorum, and expire/refund old events.
- Private links are visible only to authorized users after quorum.

### Phase 3 - MVP Surfaces And Promotion Outbox

Goal:
- Complete the MVP dashboards, social promotion outbox, and end-to-end verification.

Tasks:
- T008
- T009
- T010

Exit criteria:
- Creator and participant dashboards expose the needed event/token states.
- Cohort creation produces a local social-promotion record with public-safe content.
- Core lifecycle paths are covered by tests or documented manual verification.

### Phase 4 - Post-MVP Hardening

Goal:
- Replace the demo-only parts of the completed MVP with durable persistence and a regular auth boundary.

Tasks:
- T011
- T012

Exit criteria:
- Cohort, user, token, interest, and social outbox records can survive app restart in a local durable store.
- Protected flows no longer trust demo query parameters or default user ids.
- Private-link authorization remains scoped to the authenticated creator or committed participants.

### Phase 5 - Post-MVP Monetization And Distribution

Goal:
- Add the first token purchase path and make social promotion publish through safe adapter boundaries.

Tasks:
- T013
- T014

Exit criteria:
- Authenticated users can buy the documented `$6`/6-token and `$12`/14-token packages through a documented local/mock or provider-backed mode.
- Successful purchases create auditable purchase transactions.
- Pending social outbox posts can be processed by configured adapters without leaking private event links.

### Phase 6 - Post-MVP Lifecycle Controls

Goal:
- Implement lifecycle actions for statuses already modeled but not yet user-accessible.

Tasks:
- T015

Exit criteria:
- Authorized creators or admins can cancel open cohorts with refunds.
- Authorized creators or admins can complete active cohorts without refunding consumed tokens.
- Cancelled and completed cohorts behave correctly in discovery, dashboards, token accounting, and private-link visibility.

### Phase 7 - Launch Readiness

Goal:
- Close the remaining launch gates that are not pure product features: deterministic verification, deployment, production persistence, environment and secrets handling, admin protection, observability, privacy/security review, and production smoke testing.

Tasks:
- T016
- T017
- T018
- T019
- T020
- T021
- T022
- T023

Exit criteria:
- Automated verification is deterministic and passing.
- A deployment target and runbook are documented.
- Launch persistence is selected and implemented or explicitly staged.
- Environment variables and secrets are documented and validated without committing credentials.
- Admin/operational endpoints are protected.
- Basic logging, health, and monitoring expectations are documented.
- Private-link, auth, token, admin, social, and logging privacy/security risks are reviewed.
- A production launch smoke-test checklist exists and is ready to run against the selected environment.

## MVP Boundary

Build now:

- Regular auth.
- Token ledger and balances.
- Admin/demo token grants.
- Create cohort for 2 held tokens.
- Show interest for 1 held token.
- Quorum unlock and token consumption.
- 14-day expiry and token refunds.
- Hidden private links before unlock.
- Event feed and event detail pages.
- Creator dashboard.
- Participant dashboard.
- Social-promotion draft/outbox generation.

Post-MVP / urgent-next:

- Durable persistence beyond the current in-memory store.
- Regular auth boundary replacing demo query/default-user identity selection.
- USD token sales.
- Payment packages: `$6` for 6 tokens and `$12` for 14 tokens.
- Real automated posting from the social outbox to official external channels.
- Cancelled/completed lifecycle controls for the statuses already represented in the domain.
- Deterministic stale-date test repair so verification does not depend on the current calendar date.
- Deployment target selection and launch runbook.
- Production-grade persistence beyond local JSON.
- Environment and secrets configuration boundary.
- Admin/operational endpoint protection.
- Launch logging and monitoring hooks.
- Launch privacy/security review.
- Production launch smoke-test checklist.

## Recommended MVP Cut

If time is tight, cut to:

- Local/demo authentication instead of production auth.
- Mocked official social posting saved to a `SocialPost` record instead of real platform APIs.
- Granted seed tokens instead of token purchase flows.
- One database-backed web app with server-side business logic.
- Minimal dashboards that list relevant cohorts and token states without advanced analytics.

Do not cut:

- Token hold/consume/refund accounting.
- Quorum unlock behavior.
- Expiry refund behavior.
- Hidden private link behavior.
- Public-safe social post content.

## Open Implementation Questions

1. Product stack is not specified. The first implementation task should choose and scaffold a pragmatic web stack before feature work begins.
2. Production auth provider is not specified. Initial implementation may use the selected framework's simplest regular auth approach or a local/demo auth adapter, then document the assumption.
3. Official social channels are post-MVP. Initial implementation should create a platform-neutral social outbox/mock post and avoid real API integration until channels and credentials are known.
4. Initial token balances should come from admin/demo grant transactions. USD purchase grants are post-MVP and should initially use `$6` for 6 tokens and `$12` for 14 tokens.
5. Deployment target is not specified. Initial implementation should keep deployment assumptions out of core domain logic.
6. Durable persistence technology is not specified. T011 may choose a pragmatic local store if it preserves the repository boundary and documented commands.
7. Payment provider is not specified. T013 should start with a local/mock payment confirmation unless the user selects a real provider.
8. Official social channels and credentials are not specified. T014 should keep a dry-run/mock adapter path and avoid hard-coded secrets.
9. Deployment target is still unspecified for public launch. T017 should choose and document the first target before production persistence work.
10. Production datastore is still unspecified. T018 should follow the deployment choice and preserve token ledger auditability.
11. Secret management and environment variable requirements are not formalized. T019 should add that boundary before provider-backed integrations.

## Suggested First Sprint

Sprint target:
- Harden the completed MVP so user and ledger data survive restart and protected flows use a real auth boundary.

Suggested task subset:
- T011
- T012
- T016

Sprint success definition:
- The app runs locally, automated checks pass deterministically, records persist in durable mode, and authenticated users can complete the create/interest/dashboard flow without demo query parameters.
