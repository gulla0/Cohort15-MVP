# Cohort15 MVP Plan

## Project

Cohort15 is an online cohort-event platform. Creators stake 2 credits to publish a cohort event, participants stake 1 credit to show interest, and credits remain held until the cohort either reaches quorum or expires. When quorum is met, the event becomes active, held credits are consumed, and the private online link is revealed. If the event expires before quorum, held credits are refunded.

Source spec: `docs/cohort15-mvp-spec-v3.md`.

## Product Constraints

- MVP is online-only. There is no in-person location support.
- Creator cost is 2 held credits per event. Participant interest cost is 1 held credit.
- Credits are held while an event is open and are consumed only when quorum is met.
- Events expire 14 days after creation if quorum is not met.
- Private event links are hidden until quorum is met.
- Maximum participants is 15, and `maxParticipants` must be greater than or equal to `minQuorum`.
- Regular user auth, event feed/detail, creator dashboard, participant dashboard, credit ledger, quorum, expiry behavior, real Stripe-backed credit sales, and selected high-return social publishing are in production MVP scope.
- Production MVP auth uses Supabase Auth with Google login, GitHub login, and optional magic-link/email login.
- Production MVP persistence uses Supabase Postgres.
- Production MVP social publishing targets LinkedIn, X, and Email only.
- In-app chat, profiles, reputation, AI matching, waitlists, calendar integrations, broad moderation tooling, and in-person events are post-MVP or out of scope.

## Build Goal

Ship the smallest usable version that proves:

1. A user can create an online cohort by holding 2 credits.
2. Other users can stake 1 credit to show interest, and quorum unlocks the private link.
3. Expired cohorts refund held credits and keep private links hidden.
4. Authenticated users can buy credits through real Stripe-backed payment packages.
5. Newly created cohorts generate public-safe social-promotion copy and publish through selected LinkedIn, X, and Email adapters without leaking private links.

## Product Decisions Locked For This Plan

- Core event statuses are `open`, `active`, `expired`, `cancelled`, and `completed`; earliest implementation must support at least `open`, `active`, and `expired`.
- Event categories are `learn`, `build`, `practice`, `accountability`, `open_source`, and `explore`.
- Target skill levels are `beginner`, `intermediate`, `advanced`, and `any`.
- Recurrence values are `none`, `weekly`, `biweekly`, and `monthly`.
- One-time events must have exactly one meeting.
- Repeating events must have at least two meetings.
- Credit movement must be auditable through transaction records.
- Local development credit supply can come from seed/admin grants, but production MVP credits must come from Stripe purchases or explicit ledger-backed launch/admin grants.
- Production MVP credit packages are `$6` for 6 credits and `$12` for 14 credits.
- Event interest belongs in a separate object from the event.
- Private links must never be included in public social outbox content or later public social posts.

## Human Setup Standard

Provider-dependent production tasks must identify human setup requirements before relying on external setup.

For deployment, Supabase, Google/GitHub OAuth, Stripe, LinkedIn, X, Email, DNS, webhooks, callback URLs, hosting dashboards, production secrets, or similar external provider work, the executor must first provide a Human Setup Checklist with:

- current official documentation or dashboard links
- exact dashboard navigation paths
- exact callback, webhook, redirect, app URL, or DNS values to enter
- exact local file paths to edit when local configuration is needed
- exact environment variable names
- clear labels for secrets, with instructions not to paste secrets into chat
- what the agent can implement immediately versus what is blocked
- verification steps the user can perform
- a clear checkpoint for the user to report completion

The agent should continue non-blocked local implementation when possible and stop only when external setup is genuinely required.

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
- Cohort event, interest, credit transaction, and social post concepts are represented in typed code and persistence.
- Spec validation rules are covered by focused tests.

### Phase 2 - Core Cohort Flow

Goal:
- Implement the user-facing create, feed, detail, interest, quorum, credit, and expiry flows.

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
- Creator and participant dashboards expose the needed event/credit states.
- Cohort creation produces a local social-promotion record with public-safe content.
- Core lifecycle paths are covered by tests or documented manual verification.

### Phase 4 - Post-MVP Hardening

Goal:
- Replace the demo-only parts of the completed MVP with durable persistence and a regular auth boundary.

Tasks:
- T011
- T012

Exit criteria:
- Cohort, user, credit, interest, and social outbox records can survive app restart in a local durable store.
- Protected flows no longer trust demo query parameters or default user ids.
- Private-link authorization remains scoped to the authenticated creator or committed participants.

### Phase 5 - Production MVP Platform, Payments, And Distribution

Goal:
- Prepare Cohort15 for production MVP launch with Supabase Auth, Supabase Postgres, Stripe payments, and selected social publishing.

Tasks:
- T013
- T014
- T015
- T017
- T018
- T019
- T020
- T021
- T022
- T023
- T024
- T025
- T026
- T027
- T028
- T029
- T030

Exit criteria:
- A deployment target and runbook are documented.
- Production configuration and secrets are validated without committed credentials.
- Supabase Auth protects production user flows, with Google and GitHub login enabled and optional magic-link/email login.
- Supabase Postgres persists production users, cohorts, interests, credit transactions, social posts, purchases, and auth-linked records.
- Stripe purchases for `$6`/6 credits and `$12`/14 credits are verified, idempotent, and ledger-backed.
- Admin and operational endpoints are protected.
- LinkedIn, X, and Email social publishing is adapter-backed, admin-controlled for live operations, and never includes private event links.
- Uploads are production-safe or explicitly constrained.
- Basic logging, audit, health, and monitoring expectations exist without leaking private links, secrets, session tokens, or payment details.
- Launch privacy/security review and production MVP smoke testing are complete.

## MVP Boundary

Build now:

- Production auth through Supabase Auth.
- Supabase Postgres production persistence.
- Credit ledger and balances.
- Local/admin credit grants for development or explicit launch grants only.
- Real Stripe credit purchases.
- Create cohort for 2 held credits.
- Show interest for 1 held credit.
- Quorum unlock and credit consumption.
- 14-day expiry and credit refunds.
- Hidden private links before unlock.
- Event feed and event detail pages.
- Creator dashboard.
- Participant dashboard.
- Social-promotion outbox generation.
- Real social publishing to LinkedIn, X, and Email.

Post-MVP / urgent-next:

- Cancelled/completed lifecycle controls for the statuses already represented in the domain.
- Broader moderation/reporting tooling.
- Additional social channels beyond LinkedIn, X, and Email.
- Advanced analytics, profiles, reputation, AI matching, waitlists, calendar integrations, chat, and in-person events.

## Recommended MVP Cut

If time is tight, cut to:

- Supabase Auth with only Google and GitHub enabled first; magic-link/email can remain optional.
- LinkedIn, X, and Email only for social publishing.
- One Supabase Postgres-backed web app with server-side business logic.
- Minimal dashboards that list relevant cohorts and credit states without advanced analytics.

Do not cut:

- Production auth.
- Supabase Postgres production persistence.
- Real Stripe-backed credit purchases.
- LinkedIn, X, and Email social publishing.
- Credit hold/consume/refund accounting.
- Quorum unlock behavior.
- Expiry refund behavior.
- Hidden private link behavior.
- Public-safe social post content.

## Open Implementation Questions

1. Deployment target is still unspecified for public launch. T013 should choose and document the first target before Supabase callback URLs, Stripe webhooks, and social configuration are finalized.
2. Secret management and environment variable requirements are not formalized. T014 should add that boundary before provider-backed integrations.
3. Production credit bootstrap policy is still unspecified: new users may need to buy credits first, or receive explicit ledger-backed launch/admin grants.
4. Production upload storage is still unspecified: T026 should either harden storage for uploaded event images or constrain uploads in production.
5. Lifecycle launch scope is still open: T028 should implement or explicitly defer cancellation/completion controls with an operational workaround.

## Suggested First Sprint

Sprint target:
- Convert the completed local MVP into a production-ready MVP launch slice.

Suggested task subset:
- T013
- T014
- T015
- T017

Sprint success definition:
- The production deployment target, env/secrets boundary, Supabase Auth integration, and Supabase Postgres path are documented or implemented enough to unblock Stripe, social publishing, and admin hardening.
