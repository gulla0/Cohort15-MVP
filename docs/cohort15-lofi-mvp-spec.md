# Cohort15 Lofi MVP Specification

## Purpose

This branch ships a lightweight public validation product before the authenticated, credit-backed production MVP. It tests whether people will create focused cohort requests and signal interest in them.

## Core Flow

1. A visitor lands on `cohort15.com`, reads the product explanation, and sees all cohort listings with active listings first.
2. Any visitor can create a cohort request without authentication. The existing cohort form is retained except that images and maximum participants are removed, and creator email is required.
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
- category — `learn`, `build`, `practice`, `accountability`, `open_source`, or `explore`;
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

## Abuse Controls

- Add a hidden honeypot to both public forms.
- Limit cohort creation to five accepted attempts per IP per rolling hour.
- Limit interest submissions to ten accepted attempts per IP per rolling hour.
- Do not expose IP addresses or email addresses in public responses or logs.

## Data And Deployment Isolation

- Deploy as a new Render Web Service, separate from any production-MVP service.
- Use a new Supabase project, separate credentials, and lofi-specific table names/migration.
- Do not migrate current Google Apps Script/Sheet submissions.
- Serve the lofi MVP at `cohort15.com`, replacing the current Netlify landing page.
- Use environment variables scoped to the lofi Render service. Never reuse or copy production database credentials into the lofi environment.

## Reuse Boundary

Reuse the dependency-free Node.js server, server-rendered UI approach, domain validation patterns, repository abstraction, Supabase REST adapter patterns, meeting-link allowlist, local-time rendering, tests, and agent workflow.

Retire from the lofi runtime path: Supabase Auth, sessions, CSRF tied to signed-in users, credits and Stripe, admin dashboards, social outbox/publishing, image upload/storage, and authenticated private-link authorization.
