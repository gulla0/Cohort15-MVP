# Lofi MVP Provider Setup And Launch

This runbook isolates the lofi MVP from the later production MVP. Complete it only after L008 passes locally.

Never paste credentials into chat, commit them, put them in issue files, or reuse credentials from an existing production-MVP service.

Official documentation checked on 2026-06-18:

- Supabase database and SQL Editor: https://supabase.com/docs/guides/database/overview
- Supabase API keys: https://supabase.com/docs/guides/api/api-keys
- Render Web Services: https://render.com/docs/web-services
- Render custom domains: https://render.com/docs/custom-domains
- Render environment variables: https://render.com/docs/configure-environment-variables
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- Resend API keys: https://resend.com/docs/dashboard/api-keys/introduction
- Resend sending API: https://resend.com/docs/api-reference/emails/send-email
- Netlify domain management: https://docs.netlify.com/manage/domains/manage-domains/overview/

## Resource Isolation Contract

Create these new resources:

- Supabase project: `cohort15-lofi-mvp`
- Render Web Service: `cohort15-lofi-mvp`
- Render deployment branch: `codex/do-not-merge-lofi-mvp` until a later explicit branch decision
- Resend sender: `Cohort15 <updates@cohort15.com>`
- Resend reply-to: `cohort15dotcom@gmail.com`
- Public URL: `https://cohort15.com`

Do not select an existing Cohort15 Supabase project or Render service. The lofi schema must contain only tables prefixed `cohort15_lofi_`.

## Human Setup Checklist

### 1. Create the separate Supabase project

1. Open https://supabase.com/dashboard.
2. Select the intended organization, then choose `New project`.
3. Name it `cohort15-lofi-mvp`, choose the appropriate region, and generate a new database password. Store that password in your password manager; do not paste it into chat.
4. Open `SQL Editor` -> `New query`, then run these migration files in filename order:
   - `/Users/gzero/Desktop/cohort15/cohort15-mvp/supabase/migrations/20260618000000_cohort15_lofi.sql`
   - `/Users/gzero/Desktop/cohort15/cohort15-mvp/supabase/migrations/20260618000001_fix_cohort15_lofi_accept_interest.sql`
   If the first migration was already applied, run only the second migration; it safely replaces the interest function.
5. In `Table Editor`, verify that every app table begins with `cohort15_lofi_`. Stop if any setup instruction asks you to modify existing `cohort15_users`, `cohort15_events`, credit, purchase, or social tables.
6. Open `Project Settings` -> `API` and copy the new project's URL and server secret directly into the new Render service variables listed below.

### 2. Create the separate Render service

1. Open https://dashboard.render.com and choose `New` -> `Web Service`.
2. Connect this repository and use:
   - Name: `cohort15-lofi-mvp`
   - Branch: `codex/do-not-merge-lofi-mvp`
   - Runtime: `Node`
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/health`
   - Auto-deploy: off until L010 passes
3. Use the generated `onrender.com` URL for pre-cutover smoke testing.
4. In `Environment`, set the lofi variables defined by L007:
   - `NODE_VERSION=24`
   - `COHORT15_LOFI_APP_ENV=production`
   - `COHORT15_LOFI_APP_URL=https://cohort15.com`
   - `COHORT15_LOFI_SUPABASE_URL` — new lofi project URL
   - `COHORT15_LOFI_SUPABASE_SERVICE_ROLE_KEY` — secret, server-only
   - `COHORT15_LOFI_RESEND_API_KEY` — secret, server-only
   - `COHORT15_LOFI_EMAIL_FROM=Cohort15 <updates@cohort15.com>`
   - `COHORT15_LOFI_EMAIL_REPLY_TO=cohort15dotcom@gmail.com`
   - `COHORT15_LOFI_GA_MEASUREMENT_ID=G-LF22TLDSBV`
5. Do not add existing auth, Stripe, admin, social, upload, session, or production-MVP Supabase variables.
6. Treat a startup failure naming a missing `COHORT15_LOFI_*` variable as a
   configuration error. Production intentionally has no local/demo persistence
   fallback.

### 3. Configure Resend

1. Open https://resend.com/domains and add `cohort15.com`.
2. At the DNS provider currently authoritative for `cohort15.com`, add the DKIM/SPF records displayed by Resend exactly as shown.
3. Return to Resend and wait for the domain to show verified.
4. Open `API Keys` -> `Create API Key`.
5. Name it `cohort15-lofi-render`, choose sending-only access, and restrict it to `cohort15.com` if that option is available.
6. Copy the key once directly into Render as `COHORT15_LOFI_RESEND_API_KEY`; do not save it in a repository file.
7. Verify the configured sender is `updates@cohort15.com` and reply-to is `cohort15dotcom@gmail.com`.

### 4. Verify before replacing Netlify

1. Deploy the branch on the generated Render URL.
2. Visit `/health` and confirm a successful response.
3. Create a test cohort using an operator-controlled email.
4. Submit interest with a second operator-controlled email and reach quorum.
5. Confirm rows appear only in the new Supabase project.
6. Confirm creator, participant, and quorum emails arrive from `updates@cohort15.com` and replies target `cohort15dotcom@gmail.com`.
7. Confirm no email addresses appear on public pages or Render logs.

### 5. Move `cohort15.com` from Netlify to Render

1. In the new Render service, open `Settings` -> `Custom Domains` -> `Add Custom Domain` and enter `cohort15.com`.
2. Render automatically includes the corresponding `www` redirect. Keep the generated Render URL enabled during cutover.
3. At the authoritative DNS provider, remove records that route the root/`www` site to Netlify and remove conflicting `AAAA` records as Render instructs.
4. Add the exact root and verification records displayed by Render. Generated record values are service-specific; do not reuse values from another Render service.
5. Return to Render and click `Verify` for `cohort15.com`.
6. Visit both `https://cohort15.com` and `https://www.cohort15.com`; confirm HTTPS and the intended redirect.
7. Only after successful verification, remove or archive the old Netlify site if desired.

### 6. Final non-secret report

Report only:

- Supabase project name and whether only `cohort15_lofi_*` tables exist;
- Render service name and generated URL;
- whether Resend domain verification and test delivery passed;
- whether `cohort15.com` and `www` resolve over HTTPS;
- pass/fail for creation, interest, quorum, filters, and email notifications.

Checkpoint: local work L001–L008 can proceed without any dashboard setup. L009 is blocked until a person completes this checklist. L010 begins only after the generated Render URL passes pre-cutover verification.
