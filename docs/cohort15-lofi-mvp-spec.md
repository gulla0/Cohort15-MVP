# Cohort15 Lofi MVP Specification

## Purpose

This branch ships a lightweight public validation product before the authenticated, credit-backed production MVP. It tests whether people will create focused cohort requests and signal interest in them.

## Core Flow

1. A visitor lands on `cohort15.com`, reads the product explanation, and sees all cohort listings with active listings first.
2. Any visitor can create a cohort request without authentication using the enumerated lofi form contract.
3. Any visitor can show interest in an open cohort by submitting an email address.
4. One normalized email can count only once per cohort. The creator email cannot count toward its own cohort.
5. When the interested count reaches the creator-selected quorum, the approved meeting link becomes public.
6. The collection window ends seven days after creation. Every listing then displays as expired but remains browsable.
7. A successful cohort's meeting link remains public until its final meeting ends, then is hidden. Public meeting date/time details remain visible.

## Cohort Creation Form Contract

The creation form requires:

- creator email — private, trimmed, and normalized to lowercase;
- title;
- description;
- category — `learn`, `build`, `practice`, `accountability`, `gaming`, `open_source`, or `explore`;
- topic;
- target audience;
- target skill level — `beginner`, `intermediate`, `advanced`, or `any`;
- minimum quorum — integer from 1 through 15;
- approved HTTPS meeting link;
- first meeting date and time, interpreted using the creator's automatically detected browser timezone;
- meeting duration in minutes;
- recurrence — `none`, `daily`, `weekly`, `biweekly`, or `monthly`; and
- meeting count.

Additional details are optional. There is no creator name, image, or maximum-participant field. One-time cohorts have one meeting; recurring cohorts have at least two.

## Domain Record Contract

### Cohort

Persist these fields:

- `id` — server-generated UUID;
- `creatorEmail` — private normalized email;
- `title`, `description`, `category`, `topic`, `targetAudience`, `targetSkillLevel`, and optional `additionalDetails`;
- `minQuorum`;
- `meetingLink` — private until link-visibility rules allow it;
- `creatorTimeZone` — validated IANA timezone captured from the browser;
- `firstMeetingAt` — UTC instant;
- `firstMeetingLocal` — creator-entered local `YYYY-MM-DDTHH:mm` value used for recurrence calculations;
- `meetingDurationMinutes`, `recurrence`, and `meetingCount`;
- `createdAt`, `updatedAt`, and `expiresAt` — server-generated UTC instants;
- `quorumMetAt` — nullable UTC instant set exactly once by the accepted interest that reaches quorum.

Do not persist mutable `interestCount`, collection status, quorum status, or link visibility. Derive them from interests and timestamps.

### Interest

Persist `id`, `cohortId`, private normalized `email`, and `createdAt`. Enforce one row per `(cohortId, email)`.

### Notification Delivery

Persist `id`, deterministic `idempotencyKey`, `cohortId`, optional `interestId`, private recipient email, notification type, delivery status, attempt count, optional sanitized provider error code, and creation/update/sent timestamps.

Notification types are `creator_confirmation`, `participant_confirmation`, and `quorum_met`. Delivery statuses are `pending`, `sent`, and `failed`.

Idempotency keys contain no raw email: `creator_confirmation:{cohortId}`, `participant_confirmation:{interestId}`, and `quorum_met:{cohortId}:{sha256(normalizedRecipientEmail)}`.

## Validation Policy

- Trim surrounding whitespace from every submitted string. Preserve internal spaces and line breaks; escape all stored text when rendering HTML.
- Required text may not become empty after trimming.
- `title`: 3–120 characters.
- `description`: 20–2,000 characters.
- `topic`: 2–100 characters.
- `targetAudience`: 2–500 characters.
- `additionalDetails`: optional; at most 2,000 characters after trimming. Treat blank as absent.
- Measure text limits in Unicode code points, not UTF-16 code units.
- Email: 254 characters maximum and must match `/^[^@\s]+@[^@\s]+\.[^@\s]+$/u`. Trim and lowercase the entire address before comparison or persistence. Email confirmation is informational and does not verify ownership.
- `minQuorum`: integer from 1 through 15 inclusive.
- `meetingDurationMinutes`: integer from 15 through 480 inclusive.
- `meetingCount`: exactly 1 when recurrence is `none`; integer from 2 through 52 for recurring cohorts.
- `creatorTimeZone`: non-empty IANA timezone accepted by `Intl.DateTimeFormat`; 100 characters maximum.
- `firstMeetingLocal`: a real creator-local calendar date/time with minute precision. Seconds are discarded.
- `firstMeetingAt` must be strictly later than `expiresAt`; equality is rejected.
- Meeting-link length is at most 2,048 characters. It must use HTTPS, contain no username/password, use no nonstandard port, and match an approved hostname. Query strings and fragments are allowed.
- Reject unknown object fields at the domain-construction boundary so removed production fields cannot silently return.

Validation errors should identify the field and rule without echoing private submitted values.

## Time, Recurrence, And Lifecycle Policy

- `createdAt` is the server acceptance time. `expiresAt` is exactly 168 hours after `createdAt`.
- Collection status is `active` while `now < expiresAt`; it is `expired` when `now >= expiresAt`, regardless of quorum.
- Quorum status is `gathering` while `quorumMetAt` is null and `met` afterward.
- Interest is accepted only while collection is active and quorum has not been met.
- Generate recurring meetings from the original creator-local date, wall-clock time, and IANA timezone—not by adding fixed UTC milliseconds.
- Daily recurrence advances one local calendar day; weekly advances seven; biweekly advances fourteen.
- Monthly recurrence targets the original day-of-month. If that day does not exist, clamp to the target month's final day; later months again target the original day.
- Preserve the creator's local wall-clock time across timezone-offset changes. For a nonexistent spring-forward local time, move forward by the DST gap. For an ambiguous fall-back local time, choose the earlier occurrence.
- `finalMeetingEndsAt` is the final generated meeting start plus `meetingDurationMinutes`.
- Meeting schedule metadata is always public. The meeting link is public only when quorum has been met and `now < finalMeetingEndsAt`; otherwise it is absent from public serialization.
- No scheduler is required for expiry or link hiding; derive both at read time.

## Public Ordering And Route Contract

- `GET /` renders the landing page and full listing. `status=all|active|expired` controls the filter; missing or invalid values use `all`.
- `GET /cohorts` responds `302` to `/` for compatibility; there is no separate listing implementation.
- In `all`, active listings precede expired listings. Active listings sort newest creation first; expired listings sort most recently expired first. Use `id` ascending as the deterministic final tie-breaker.
- `GET /cohorts/new` renders creation.
- `POST /cohorts` creates a cohort and responds with `303` to `/cohorts/:id`.
- `GET /cohorts/:id` renders public detail.
- `POST /cohorts/:id/interests` records interest and responds with `303` back to detail. Success messaging must not put an email in the URL.
- Validation failures return `400`; missing cohorts return `404`; creator/duplicate/closed-interest conflicts return `409`; exceeded rate limits return `429` with `Retry-After`.
- Mutation routes accept `application/x-www-form-urlencoded` bodies up to 64 KiB. Unsupported media types return `415`; oversized bodies return `413`.
- When a browser sends an `Origin` header, mutation routes require it to match the configured app origin; mismatches return `403`. Requests without `Origin` remain valid for tests and non-browser clients.
- All public HTML uses UTF-8, escapes user content, and never embeds private emails, client IPs, pre-quorum links, or secrets.

## Locked Product Decisions

- No authentication, credits, payments, dashboards, creator editing, or creator deletion.
- No event images or automated social promotion.
- Creator identity is anonymous publicly; creator email is private and mandatory.
- Participant interest requires only a private email address.
- Emails are trimmed and normalized to lowercase.
- Quorum is selected by the creator and must be an integer from 1 through 15.
- There is no participant maximum. Interest submission closes once quorum is met because the public meeting link is then available.
- The creator does not count toward quorum and cannot show interest using the creator email.
- Collection expiry is exactly seven days after creation.
- The first meeting must occur after the seven-day collection window.
- Meeting date, time, duration, recurrence, and meeting count are public throughout the listing lifecycle, before and after quorum.
- The browser's timezone converts the creator's local date/time into an absolute timestamp. Viewers see meeting times in their own local timezone and are told that the displayed time is local.
- Approved meeting links must use HTTPS and one of these exact hosts or their subdomains: `meet.google.com`, `zoom.us`, `zoom.com`, `teams.microsoft.com`, `teams.live.com`, `discord.com`, `discord.gg`, or `slack.com`. The form explains that the restriction protects users from unsafe links.
- All listings remain visible. The default view includes all listings, sorted active first, and supports All, Active, and Expired filters.
- Exact interest count and quorum progress are public. Email addresses are never public.
- The landing page reuses the current early-interest page's visual style and Google Analytics measurement ID `G-LF22TLDSBV`.
- Friendly consent copy is displayed without an extra checkbox: email is used only for updates about the cohort.

## Email Notifications

Use Resend with:

- sender: `updates@cohort15.com`
- reply-to: `cohort15dotcom@gmail.com`

Send:

- creator confirmation after cohort creation;
- participant confirmation after showing interest; and
- quorum-met notification to the creator and all interested participants.

Do not send expiry emails. Email delivery failures must not erase an otherwise valid cohort or interest submission.

Create the submission record before attempting email. Insert a pending delivery record using a deterministic idempotency key, attempt one synchronous provider call, then mark it sent or failed. Automatic retries and a retry dashboard are out of scope. When one interest reaches quorum, its participant confirmation and the quorum notifications are separate deliveries.

Apply a five-second timeout to each Resend request. Timeout and provider errors are delivery failures, not submission failures.

Confirmation messages include the public cohort URL and friendly seven-day expectations. Quorum messages include the public cohort URL and public meeting schedule/link. Recipient addresses must be sent as separate provider calls or otherwise hidden from other recipients.

## Abuse Controls

- Add a hidden honeypot to both public forms.
- Limit cohort creation to five accepted attempts per IP per rolling hour.
- Limit interest submissions to ten accepted attempts per IP per rolling hour.
- Use separate in-memory rolling-window limiters. Count only successful writes, retain only a SHA-256 digest of the normalized client IP, and reset limiter state on process restart.
- In production, derive the client IP from the leftmost valid value in Render's `X-Forwarded-For`; otherwise use the socket remote address. Never trust arbitrary forwarding headers outside configured production mode.
- Honeypot submissions create no record, send no email, do not consume a successful-write allowance, and receive the same generic `400` response.
- Do not expose IP addresses or email addresses in public responses or logs.

## Data And Deployment Isolation

- Deploy as a new Render Web Service, separate from any production-MVP service.
- Use a new Supabase project, separate credentials, and lofi-specific table names/migration.
- Do not migrate current Google Apps Script/Sheet submissions.
- Serve the lofi MVP at `cohort15.com`, replacing the current Netlify landing page.
- Use environment variables scoped to the lofi Render service. Never reuse or copy production database credentials into the lofi environment.

The lofi database contains exactly these application tables:

- `cohort15_lofi_cohorts`;
- `cohort15_lofi_interests`; and
- `cohort15_lofi_notification_deliveries`.

Enable row-level security with no browser/client policies. The Node server is the only database client and keeps the service-role key server-side. Do not create auth, user, credit, purchase, image, social, or rate-limit tables.

Interest acceptance and quorum transition must be atomic. The persistence boundary must serialize per cohort, reject duplicate/creator/expired/already-met submissions, insert the interest, count accepted interests, and set `quorumMetAt` only for the transition from below quorum to met. The Supabase implementation should use a transaction-safe SQL function/RPC; the local in-memory repository must expose equivalent behavior for tests.

Use database uniqueness for cohort IDs, `(cohort_id, email)`, and notification `idempotency_key`. Store timestamps as `timestamptz` and emails as normalized text. The migration path is `supabase/migrations/20260618000000_cohort15_lofi.sql`.

## Reuse Boundary

Reuse the dependency-free Node.js server, server-rendered UI approach, domain validation patterns, repository abstraction, Supabase REST adapter patterns, meeting-link allowlist, local-time rendering, tests, and agent workflow.

Retire from the lofi runtime path: Supabase Auth, sessions, CSRF tied to signed-in users, credits and Stripe, admin dashboards, social outbox/publishing, image upload/storage, and authenticated private-link authorization.
