# Cohort15 Piece of Pie MVP Specification

## Purpose

This specification governs the `codex/piece-of-pie` branch. It evolves the deployed lofi Cohort15 product into the smallest user-facing, credit-gated product in which a real user can create an account, pay, receive credits, and use those credits.

The launch goal is to satisfy the Builder Pie product requirement described by Gimbalabs: the product must be publicly usable and include a clear payment gate. The hackathon's repository, weekly-post, registration, and final-presentation requirements remain human evidence obligations rather than application behavior.

The prior `docs/cohort15-lofi-mvp-spec.md` is a historical baseline, not authority for this branch where it says authentication, credits, or payments are absent. This file is the canonical product source for the Piece of Pie branch.

## Three-Day MVP Outcome

A visitor can:

1. browse public cohorts and research without signing in;
2. sign in with an emailed magic link;
3. receive exactly two free credits on first account creation;
4. use two credits to create a cohort or one credit to show interest;
5. see held, available, consumed, and refunded credit totals;
6. encounter a clear payment gate when available credit is insufficient;
7. buy six credits for USD $6 through Stripe Checkout; and
8. use purchased credits after verified, idempotent fulfillment.

## Preserved Product Behavior

- Public cohort browsing, filters, public schedule metadata, local-time enhancement, research pages, feedback capture, rate limits, meeting-link validation, and Resend notifications remain.
- Collection lasts exactly 168 hours from cohort creation.
- A cohort meeting link becomes public at quorum and remains public until the final meeting ends.
- Creator and participant emails remain private and never appear in public HTML, URLs, analytics, or logs.
- Existing `cohort15_lofi_*` production data and the existing Supabase project, Render service, `cohort15.com` domain, Resend sender, and analytics configuration are retained.
- Existing anonymous cohort and interest rows remain readable and count toward quorum. They are not retroactively assigned to accounts and do not create historical credit transactions.

## MVP Boundary

Build now:

- Supabase email magic-link authentication;
- opaque, expiring, server-side application sessions and CSRF protection;
- account records keyed to Supabase identities;
- exactly-once two-credit signup grants;
- an auditable credit ledger;
- credit holds, consumption, and refunds for cohort actions;
- one Stripe Checkout package: six credits for USD $6;
- signed Stripe webhook handling and a shared idempotent fulfillment path;
- balance and Buy Credits UI;
- production configuration, migration, deployment, and smoke verification.

Defer:

- passwords, Google login, GitHub login, profiles, avatars, account editing, and account deletion;
- subscriptions, coupons, taxes beyond Stripe's configured behavior, multiple currencies, and additional packages;
- a full dashboard or purchase-history UI;
- admin grant UI, refunds of card payments, disputes, and chargeback automation;
- claiming or editing legacy anonymous cohorts;
- social publishing, image uploads, moderation UI, or broader redesign;
- Cardano integration and eligibility for the separate Cardano Pie.

## Account And Authentication Contract

### Identity

- Production authentication uses Supabase Auth email magic links only.
- Supabase owns email delivery and token verification for sign-in. Cohort15 does not store passwords.
- The normalized, verified Supabase email is the account email used for cohort and notification behavior.
- One application account exists per Supabase subject and normalized email. Conflicting identities fail closed and receive no grant.
- Local development may use explicit test accounts without contacting Supabase, but production must never expose a seeded-account selector.

### Account Provisioning And Free Credits

- The first successful verified sign-in atomically creates the application account and one credit transaction for two credits.
- The grant idempotency key is derived from the application user ID and represents `signup_grant`.
- Replaying the callback, requesting another magic link, signing out and back in, concurrent callbacks, or changing display metadata never creates another signup grant.
- Existing accounts that have no signup grant receive it exactly once on the next verified sign-in. This supports a safe deployment retry without granting more than two total free credits.
- A partial failure must not leave an account without a recoverable grant or create a grant without its account.

### Sessions

- After verified Supabase authentication, Cohort15 creates an opaque random application session.
- Only a SHA-256 digest of the session token is persisted. The raw token exists only in the browser cookie.
- Production cookies are `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, and expire after eight hours.
- Each session has a random CSRF token. Authenticated browser mutations other than the Stripe webhook require an exact token match.
- Sign-out deletes the server session and clears the cookie. Expired or unknown sessions are rejected.
- Authentication responses and logs never expose magic-link tokens, session tokens, CSRF tokens, Supabase tokens, or email addresses.

### Routes

- `GET /auth/sign-in` renders the email sign-in form or the current signed-in state.
- `POST /auth/magic-link` accepts one email and a safe same-origin return path. It always renders a generic success message so account existence is not disclosed.
- `GET /auth/callback` verifies the Supabase callback, provisions the account/grant, creates the application session, and redirects only to a validated relative path.
- `POST /auth/sign-out` requires authentication and CSRF, invalidates the session, and redirects to `/`.
- Unsafe absolute, protocol-relative, encoded external, or malformed return paths resolve to `/`.

## Credit Ledger Contract

### Transaction Types

Every credit movement is immutable and ledger-backed:

| Type | Meaning | Balance effect |
|---|---|---:|
| `grant` | One-time signup funding | adds |
| `purchase` | Verified Stripe funding | adds |
| `hold` | Reserved for a forming cohort | removes from available, adds to held |
| `consume` | A successful cohort commits a prior hold | removes from held, adds to consumed |
| `refund` | An expired cohort releases a prior hold | removes from held, adds to available |

For one user:

- funded = grants + purchases;
- held = holds - consumes - refunds;
- available = funded - holds + refunds;
- consumed = consumes;
- available and held must never be negative.

All amounts are positive integers. Transaction IDs and idempotency keys are unique. Transactions may reference a cohort, purchase, or source but never contain raw Stripe payloads, card data, session secrets, or email addresses.

### Cohort Creation

- `GET /cohorts/new` requires authentication. An unauthenticated visitor is redirected to sign in with `/cohorts/new` as the safe return path.
- The authenticated account email replaces the editable creator-email field.
- Successful creation and its two-credit hold occur atomically.
- If fewer than two credits are available, nothing is created or held. The user receives a clear insufficient-credit response with balance, cost, and a Buy Credits action.
- Existing honeypot, body-size, media-type, Origin, validation, approved-link, and IP-rate-limit rules still apply.

### Showing Interest

- The cohort detail page remains public, but submitting interest requires authentication.
- The authenticated account email replaces the editable participant-email field.
- Accepted interest and its one-credit hold occur atomically.
- Creator self-interest, duplicate email/account interest, expired collection, or already-met quorum is rejected before a hold is created.
- If fewer than one credit is available, no interest or hold is created and the payment gate is displayed.
- Existing honeypot, body-size, media-type, Origin, and IP-rate-limit rules still apply.

### Quorum And Expiry

- When an accepted interest reaches quorum, the same atomic operation consumes the two-credit creator hold and all one-credit holds for account-backed accepted interests.
- Legacy anonymous creator/interest rows have no hold and therefore create no consume transaction.
- Exactly one concurrent request may perform the quorum transition and each hold may be consumed once.
- When collection expires below quorum, account-backed creator and participant holds are refunded once.
- Expiry settlement is lazy but deterministic: before an authenticated balance is displayed or a credit-funded mutation begins, the repository settles all due below-quorum holds for that user. The settlement operation is transaction-safe and repeatable.
- Public lifecycle computation remains time-derived; credit settlement does not require a paid scheduler.

## Persistence Contract

Extend the existing isolated schema with `cohort15_lofi_` objects only:

- `cohort15_lofi_users` — application identity, normalized private email, Supabase subject, timestamps;
- `cohort15_lofi_sessions` — hashed session token, user ID, hashed/verified CSRF material, expiry, timestamps;
- `cohort15_lofi_credit_transactions` — immutable ledger entries and idempotency keys;
- `cohort15_lofi_purchases` — package, amount, currency, Stripe checkout/payment references, status, timestamps;
- `cohort15_lofi_stripe_events` — processed event IDs, event type, outcome, timestamps.

Add nullable `creator_user_id` to cohorts and nullable `user_id` to interests. Existing rows remain null. New authenticated writes populate both user ID and normalized account email.

All new tables enable RLS and expose no `anon` or `authenticated` browser policies. The Node server remains the only application database client and uses the existing server-only service-role credential. Database functions used for provisioning, holds, quorum, expiry, and purchase fulfillment must set a safe search path, revoke public execution, serialize conflicting writes, and enforce invariants in the database transaction.

Local in-memory repositories must implement equivalent observable behavior for tests. Production must never fall back to local state.

## Payment Contract

### Package And Checkout

- The only MVP package is six credits for USD $6.00 as a one-time payment.
- `GET /credits/buy` is public but requires sign-in before checkout can start. It clearly states the package, price, credit uses, and that card processing is handled by Stripe.
- `POST /credits/checkout` requires authentication and CSRF.
- The server selects the configured Stripe Price ID; the browser cannot set price, amount, currency, credit quantity, user ID, or success URL.
- Before calling Stripe, the server persists a pending purchase with a unique internal ID.
- Stripe Checkout uses the internal purchase ID and application user ID as server-set metadata and an idempotency key.
- Checkout cancellation grants nothing and returns to `/credits/buy?cancelled=1`.

### Fulfillment

- `POST /webhooks/stripe` reads the raw body, accepts at most 256 KiB, and requires a valid `Stripe-Signature` using the configured endpoint secret.
- Signature timestamps must be within five minutes of the server clock.
- The webhook is exempt from browser Origin and CSRF checks but from no other validation.
- Only a completed, paid Checkout Session matching the stored purchase's checkout ID, metadata, user, amount, currency, and package can fund credits.
- Stripe event IDs, provider Checkout Session IDs, purchase IDs, purchase credit-transaction IDs, and ledger idempotency keys are unique.
- Duplicate delivery, concurrent delivery, webhook retry, and browser-return reconciliation all invoke one idempotent fulfillment operation and can add the six credits only once.
- `GET /credits/checkout/complete?session_id=...` requires the owning account. It retrieves the session server-side and invokes the same fulfillment operation, then shows paid, pending, or failure state. It never trusts query parameters as proof of payment.
- Invalid signatures return `400`; unknown but valid event types return `200`; retryable internal failures return `500`; already processed events return `200`.
- Logs may include internal purchase ID, Stripe event ID, event type, and outcome, but never full provider payloads, secrets, card data, session cookies, or user email.

## User Interface Contract

- The shared header shows `Sign in` while anonymous.
- While signed in it shows available credit count, `Buy credits`, and `Sign out`.
- The create and interest actions show their costs before submission.
- Insufficient-credit states explain the required and available amounts and provide a direct Buy Credits action.
- A successful purchase page states that six credits were added and links back to the previously intended safe path when available.
- No full account dashboard is required. The header balance and payment/action pages are sufficient.
- Existing responsive behavior, accessible labels, keyboard focus, semantic notices, and HTML escaping remain.

## HTTP And Error Policy

- Protected HTML GET routes use `303` to the sign-in page when authentication is required.
- Invalid form input returns `400`; unauthenticated mutation returns `401`; invalid CSRF returns `403`; missing records return `404`; lifecycle/duplicate conflicts return `409`; insufficient credits return `402`; rate limits return `429` with `Retry-After`.
- Successful browser form mutations redirect with `303` unless the existing route contract explicitly renders a created result.
- Provider failures use generic user-facing language and never echo provider bodies.
- Existing 64 KiB form-body limit remains. Stripe webhook raw bodies use the separate 256 KiB limit.

## Runtime Configuration

Preserve every existing `COHORT15_LOFI_*` production variable and add only:

- `COHORT15_LOFI_SUPABASE_ANON_KEY` — public-class key used server-side for Supabase Auth calls;
- `COHORT15_LOFI_STRIPE_SECRET_KEY` — server-only Stripe secret;
- `COHORT15_LOFI_STRIPE_PRICE_6_CREDITS` — configured Price ID;
- `COHORT15_LOFI_STRIPE_WEBHOOK_SECRET` — server-only endpoint signing secret.

Production fails fast when any required value is missing. Secrets never appear in `.env.example`, `render.yaml`, logs, committed artifacts, or chat.

## Existing Provider Continuity

- Reuse the user-reported live `cohort15-lofi-mvp` Supabase project, Render service, `cohort15.com`, Resend domain/sender, and analytics configuration.
- Do not create replacement provider resources unless a documented blocker makes reuse impossible and the user explicitly approves that operational decision.
- Apply additive migrations only. Do not drop or rename existing cohort, interest, notification, or feedback data.
- New dashboard, credential, migration, DNS, deployment, and production-verification actions live only in `docs/human-tasks/piece-of-pie-launch.md` and are indexed by `docs/human-tasks/README.md`.

## Launch Acceptance

The MVP is launch-ready only when:

- a new production account receives two credits once;
- repeated and concurrent sign-in does not duplicate the grant;
- create and interest actions hold the correct credits and reject insufficient balance;
- quorum consumes holds and expiry refunds them exactly once;
- a Stripe live-mode purchase adds six credits exactly once through signed fulfillment;
- the purchased credits fund a real create or interest action;
- anonymous browsing, public meeting-link timing, email notifications, feedback capture, privacy, and rate limits still work;
- `https://cohort15.com` is publicly usable over HTTPS;
- automated checks and the indexed production smoke checklist pass.
