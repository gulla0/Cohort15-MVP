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

- The public landing page leads with the value of finding a few people who will show up for a focused shared goal, before explaining mechanics.
- The first landing experience includes a compact group labeled `Example cohorts` with familiar illustrative uses: interview practice, language learning, founder accountability, and a focused book group. These examples are explanatory only and must remain visually distinct from live cohort listings.
- The same first landing experience explains in plain language that creating costs two credits, joining costs one credit, credits are returned when a group does not form, and every new account starts with two credits. It does not use ledger or hold terminology, imply a subscription or guaranteed formation, or change credit behavior.
- The feedback dialog opens only when a visitor explicitly activates the visible `Feedback` control. Routes, timers, form activity, submissions, and other observed behavior never open it automatically.
- Feedback has exactly two pages: a general feedback textarea stored privately in the existing `whyOrWhyNot` field, followed by the existing founder introduction, social links, and optional contact fields. The first page may autosave as a partial response; selecting `Next` submits and completes the feedback before showing the optional contact page. Contact edits update that same completed response, closing the second page keeps it completed, and `Send feedback` saves any optional contact additions before confirmation.
- The removed qualification and branching fields remain nullable for backward compatibility. Existing feedback rows and their historical values are not rewritten, and no feedback schema migration is required for this interaction change.
- The create and interest actions show their costs before submission.
- Insufficient-credit states explain the required and available amounts and provide a direct Buy Credits action.
- A successful purchase page states that six credits were added and links back to the previously intended safe path when available.
- No full account dashboard is required. The header balance and payment/action pages are sufficient.
- Existing responsive behavior, accessible labels, keyboard focus, semantic notices, and HTML escaping remain.

### Shared navigation contract

Every full server-rendered page uses one shared header with the same information architecture. This includes the landing page, cohort detail, cohort creation, research index and articles, sign-in, Buy Credits, and checkout-result pages. The header contains, in DOM and visual order:

1. the `Cohort15` brand link to `/`;
2. a primary navigation region labeled `Primary navigation`, containing `Browse cohorts` linking to `/#cohorts`, `Create a cohort` linking to `/cohorts/new`, and `Research & Field Notes` linking to `/research`; and
3. one account region: `Sign in` linking to `/auth/sign-in` for an anonymous visitor, or the signed-in credit/account disclosure defined below.

`Browse cohorts` and `Create a cohort` are the two primary destinations and receive equal primary emphasis. `Research & Field Notes` remains visible in the same navigation region and order on every page but uses the quieter text-link treatment. The account region is visually separate from those destinations. Page shells must not omit, reorder, or add destination peers, and must not introduce a dashboard, profile, or other route to satisfy this contract.

Exactly one current-page indicator is exposed with `aria-current="page"` when the current route belongs to a destination or account action:

| Current route | Current header item |
|---|---|
| `/` or `/cohorts/:id` | `Browse cohorts` |
| `/cohorts/new` | `Create a cohort` |
| `/research` or any current research article route | `Research & Field Notes` |
| `/auth/sign-in` while anonymous | `Sign in` |
| `/credits/buy` or `/credits/checkout/complete` while signed in | `Buy credits` inside the openable account disclosure |

Query strings, fragments, error states, and checkout-result states do not change route-family matching. The brand is not a second current-page item. A route with no matching item has no `aria-current`, and visual active styling must not be the only current-page cue.

For a signed-in visitor, the available balance remains visible at all times as a disclosure summary labeled `1 credit` or `{n} credits`; its accessible name identifies it as the account control and says that these are available credits. The balance displayed is the settled available balance required by the credit contract, not held, consumed, or total funded credits. Activating this one control reveals a small account panel containing, in order, a `Buy credits` link to `/credits/buy` and a `Sign out` submit button. Sign out remains a `POST /auth/sign-out` form containing the current session's hidden CSRF token; it is never converted to a link or GET request. Email and other account identifiers do not appear in the header. The panel is closed on initial render except on the two credit-route families in the table, where it opens initially so the current `Buy credits` item is exposed; navigation to any other route returns it to closed. The visible summary preserves credit state while reducing `Buy credits` and `Sign out` from top-level peers.

The account disclosure uses native disclosure semantics (`details` and `summary`) with only the behavior enhancement needed here; it is not assigned menu roles or custom arrow-key semantics. `Tab` follows the visual order from the brand through the three destinations to `Sign in` or the credit summary. `Enter` or `Space` toggles the credit summary, and when open, ordinary `Tab` order reaches `Buy credits` and then `Sign out`. `Escape` closes an open disclosure and returns focus to its summary. An open disclosure also closes after a pointer activation outside it or after focus moves outside the disclosure; moving focus among its summary, link, and form does not close it. All links, the summary, and the sign-out button retain a clearly visible focus indicator.

At mobile widths the same destinations, labels, order, auth state, and current-page state remain available without a hover requirement or hamburger-only alternative. The header may wrap into rows, with the brand and account region together and the three destinations in their canonical order, but it must not hide Research or the visible credit summary. Controls provide at least a 44-by-44 CSS-pixel touch target. The open account panel stays within the viewport, appears adjacent to or directly below its summary, and does not cause horizontal page overflow; outside-tap, focus, keyboard, link, and CSRF-protected sign-out paths behave the same as on desktop.

### Portable cohort request contract

Every public cohort card and cohort detail page exposes the same `Copy cohort request` action. The copied value is plain text, is anonymous, is useful without surrounding Cohort15 UI, and contains the cohort's canonical absolute public detail URL. The complete clipboard value, including separators, newlines, the ellipsis character, and URL, is at most 280 Unicode code points. A newline counts as one code point. The URL is copied verbatim and is never shortened or truncated.

The payload has up to four non-empty lines, in this order:

```text
Cohort request: {title}
{purpose}
{schedule and formation context}
{public URL}
```

Portable text is derived only from the public title, public description, structured public schedule/lifecycle fields, and canonical public URL. It must never read creator or participant names, emails, account identifiers, notification data, or any other identity field. It must never read or copy `meetingLink`, even after quorum. As defense in depth, URL-shaped and email-address-shaped tokens in title or description are removed before those fields are used; thus the canonical public detail URL is the only URL in the payload. Removal is followed by whitespace normalization. This action does not include clipboard attribution, the signed-in user's identity, or personalized query parameters.

Generation is deterministic:

1. Sanitize title and description by splitting on Unicode whitespace and removing any token classified as a URL or email, then join retained tokens with one ASCII space and trim. For classification only, discard leading `(`, `[`, `{`, `"`, or `'` and trailing `.`, `,`, `;`, `:`, `!`, `?`, `)`, `]`, `}`, `"`, or `'` from the token. A URL token, compared case-insensitively, starts with `http://`, `https://`, or `www.`, or matches `(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/:?#].*)?`. An email token matches `[^@\s]+@[^@\s]+\.[^@\s]+`. Both matches must cover the entire classification token. Code-point operations below operate on Unicode scalar values, not UTF-16 code units.
2. Shorten the normalized title to at most 60 code points and the normalized description to at most 70 code points with the shortening rule below. The title line is `Cohort request: {title}`. A title that is empty after sanitization uses `Untitled cohort`. A description that is empty after sanitization uses `Small online cohort seeking participants.`
3. Produce the schedule from three human-readable atoms joined with ` · `: `MMM D, YYYY at h:mm AM/PM UTC`, the title-cased recurrence label, and `{meeting count} meeting(s) × {duration} min`. Use the fixed English UTC month abbreviations `Jan` through `Dec`, omit a leading zero from day and hour, always include two minute digits, and use `12` rather than `0` for midnight. A non-recurring cohort uses `One time`; recurring labels are `Daily`, `Weekly`, `Biweekly`, and `Monthly`. Use singular `meeting` only when the count is one and `meetings` otherwise. Meeting count and duration are base-10 integers.
4. Produce exactly one formation atom: `{interest count} of {minimum quorum} interested` while collection is active below quorum; `Quorum met ({interest count} of {minimum quorum} interested)` from quorum until the final meeting ends; or `Collection closed` after a below-quorum expiry or after the final meeting ends. Counts are base-10 integers.
5. Join schedule and formation atoms with ` · ` to make the context line. Assemble all four lines with one `\n` between adjacent lines and no trailing newline.
6. If the result exceeds 280 code points, remove the formation atom and its separator. If it still exceeds 280, remove the entire context line. If it still exceeds 280, shorten the purpose to the largest code-point limit that makes the payload fit; omit the purpose line when fewer than two code points are available for it. If it still exceeds 280, shorten the title in the same way, retaining at least one title code point. The prefix, public URL, and remaining newlines are never shortened. This order makes the fixed prefix and recognizable title highest-priority descriptive content, then purpose, then schedule/formation context; the usable public URL is mandatory regardless of priority.

To shorten text to a limit `N`, return it unchanged when it is at most `N` code points. Otherwise reserve one code point for `…`, take the first `N - 1` code points, trim trailing whitespace, and, when that prefix contains whitespace with non-whitespace before it, remove the final partial word at the last whitespace boundary. Append `…`. For `N = 1`, the result is `…`; a limit of zero omits the field and its line. No other punctuation is added during shortening.

The canonical URL must be an absolute `https` production URL (an `http` loopback URL is allowed only in local development), contain no credentials or query/fragment component, and be no more than 260 code points. This maximum guarantees that the fixed 16-code-point `Cohort request: ` prefix, the minimum allowed three-code-point title, one newline, and URL fit within 280. Generation fails closed rather than copying a partial or unusable URL if this invariant is violated.

The copy action is a button and does not navigate, open a share sheet, post externally, or emit the payload to analytics. Its accessible name is `Copy request` on listing cards and `Copy cohort request` on detail pages. A successful clipboard write changes adjacent status text to `Cohort request copied.`; a failed or unavailable write reports `Could not copy the cohort request. Select and copy it manually.` and makes the generated plain text selectable. Success is announced only after the clipboard write completes, failure never displays success, and repeated activation regenerates the same payload from the same cohort state. Listing and detail actions for the same cohort state and canonical URL copy byte-for-byte identical UTF-8 text.

On public listing cards, the title and explicit `View cohort details →` link remain ordinary links to the cohort request page. Progressive enhancement also makes non-interactive card content and whitespace open that same page, while clicks within the copy control, links, form controls, editable content, or a non-empty text selection never trigger card navigation. Larger views place the explicit details link and compact `Copy request` control at opposite ends of the action row; narrow views stack copy below details with at least 16 pixels of separation.

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
