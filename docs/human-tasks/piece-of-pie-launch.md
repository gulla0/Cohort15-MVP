# Piece of Pie Provider Extension, Deployment, And Evidence

This checklist extends the existing deployed Cohort15 lofi resources for the account, credit, and payment MVP. It does not recreate the live infrastructure.

Never paste credentials, API keys, webhook secrets, magic-link URLs, session cookies, payment details, customer emails, full Stripe/Supabase records, or other secret values into chat, issues, logs, screenshots, or committed files.

## Retained Resource Baseline

The user reported the following human setup complete before this branch was created:

- Supabase project: `cohort15-lofi-mvp`
- Render Web Service: `cohort15-lofi-mvp`
- public domain: `https://cohort15.com`
- Resend sender/domain and transactional notification path
- existing lofi production environment and analytics

Preserve these resources and their data. Do not create replacements unless a specific blocker is documented and the user explicitly approves that operational decision.

Official references to recheck when performing the task:

- Supabase passwordless email auth: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Stripe Checkout: https://docs.stripe.com/payments/checkout
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe testing: https://docs.stripe.com/testing
- Render environment variables: https://render.com/docs/configure-environment-variables
- Render deploys: https://render.com/docs/deploys
- Gimbalabs Piece of Pie rules: https://www.gimbalabs.com/piece-of-pie

## Human Setup Checklist

### 1. Confirm the retained production baseline

- [x] The user reported the existing lofi Supabase, Render, domain, Resend/email, and related setup complete.
- [ ] Confirm `https://cohort15.com` and `/health` are reachable before changing deployment configuration.
- [ ] Confirm the intended Supabase project is `cohort15-lofi-mvp` and its existing application tables use the `cohort15_lofi_` prefix.
- [ ] Confirm the intended Render service is `cohort15-lofi-mvp` and record its current deployed commit privately for rollback.
- [ ] Confirm existing cohort browsing, one create/interest test path, and notification delivery still work before migration.
- [ ] Confirm whether `supabase/migrations/20260624000000_cohort15_lofi_feedback.sql` has already been applied; apply it through the separately indexed checklist if it has not.

Stop if the selected project/service differs or existing data is missing. Do not proceed by creating a replacement.

### 2. Apply the additive account/credit/payment migration

- [ ] Wait until L019 passes locally and the implementation manager identifies the final additive migration filename.
- [ ] Open the existing `cohort15-lofi-mvp` Supabase project and use SQL Editor.
- [ ] Run only the new Piece of Pie migration file after the already deployed lofi migrations.
- [ ] Confirm existing cohort, interest, notification, and feedback row counts were not reduced.
- [ ] Confirm every new table/function uses the `cohort15_lofi_` prefix.
- [ ] Confirm users, sessions, credit transactions, purchases, and Stripe-event tables exist.
- [ ] Confirm cohorts and interests gained nullable account-link columns and existing rows remain valid.
- [ ] Confirm RLS is enabled, no browser policies were added, and server-only functions are not executable by public, `anon`, or `authenticated` roles.

Do not copy database rows into the final report. Record pass/fail and non-sensitive object names only.

### 3. Enable Supabase email magic-link authentication

- [ ] In the existing Supabase project, open Authentication provider settings and enable email magic-link/OTP sign-in.
- [ ] Keep automatic account creation enabled for this MVP.
- [ ] Set the Site URL to `https://cohort15.com`.
- [ ] Add the exact production callback URL `https://cohort15.com/auth/callback` to allowed redirect URLs.
- [ ] If testing on the Render-generated URL first, add only its exact HTTPS callback URL temporarily and remove it after verification if no longer needed.
- [ ] Configure the magic-link email action to send the user to `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`; keep the surrounding copy Cohort15-specific and do not expose internal configuration.
- [ ] Obtain the project's anon/public-class key for the server's auth requests. Place it directly in Render as `COHORT15_LOFI_SUPABASE_ANON_KEY`; do not commit or paste its value.
- [ ] Request a test magic link using an operator-controlled email and confirm it returns only to an allowed callback.

Do not place magic-link URLs or token parameters in screenshots or evidence.

### 4. Configure the single Stripe product and webhook

- [ ] In Stripe, complete preflight in test mode first.
- [ ] Create or confirm one product named `Cohort15 Credits` with one one-time USD $6.00 price representing six credits.
- [ ] Record the Price ID directly in Render under the variable name implemented by L019. A Price ID is configuration, but it still does not need to appear in chat.
- [ ] Place the server-side Stripe secret key directly in Render under the implemented secret variable name.
- [ ] Create a Stripe webhook endpoint for `https://cohort15.com/webhooks/stripe`.
- [ ] Subscribe only to the Checkout event type required by the implemented L018 contract, normally `checkout.session.completed`.
- [ ] Place the endpoint signing secret directly in Render under the implemented webhook-secret variable name.
- [ ] Repeat the product/price, API-key, and webhook setup in live mode before final verification. Keep test and live values in their corresponding Stripe/Render environments.
- [ ] Never configure a client-exposed Stripe secret or accept a browser-supplied price/amount.

### 5. Update the existing Render service

- [ ] Change the existing service deployment branch from the lofi branch to `codex/piece-of-pie` only after L019 passes and its commit is pushed.
- [ ] Preserve every existing `COHORT15_LOFI_*` Supabase, Resend, app URL, sender, reply-to, and analytics value.
- [ ] Add the Supabase anon/public-class key, Stripe secret key, six-credit Price ID, and Stripe webhook signing secret under the exact variable names verified by L019.
- [ ] Do not remove existing values or paste any value into repository files.
- [ ] Keep `COHORT15_LOFI_APP_URL=https://cohort15.com`, the existing start command, and `/health` check unless implementation evidence requires a documented correction.
- [ ] Trigger a deployment and confirm startup succeeds without printing secret values.
- [ ] Confirm Render reports the intended Piece of Pie commit and health status.

### 6. Test-mode production-origin preflight

- [ ] Sign in through a magic link with a new operator-controlled account.
- [ ] Confirm the account receives two available credits.
- [ ] Sign out and in again and confirm the balance remains two before use.
- [ ] Create one cohort and confirm two credits become held, leaving zero available.
- [ ] Attempt another funded action and confirm the clear Buy Credits gate appears.
- [ ] Complete a Stripe test-mode $6 Checkout using Stripe's documented test payment method.
- [ ] Confirm exactly six purchase credits appear.
- [ ] Refresh the completion page and, if possible, resend the webhook; confirm the balance does not increase again.
- [ ] Use one or more purchased credits for a real cohort creation or interest action.
- [ ] Exercise quorum consumption and one below-quorum expiry/refund path with test records where practical.
- [ ] Confirm Supabase contains auditable account, credit, purchase, and processed-event records without inspecting or sharing sensitive values.

### 7. Live payment and product-use verification

- [ ] Switch the deployed Stripe configuration to the intended live-mode product, key, Price ID, and webhook endpoint secret.
- [ ] Use an operator-controlled production account and confirm the two-credit grant remains exactly once.
- [ ] Complete one real USD $6 payment through Stripe-hosted Checkout.
- [ ] Confirm the corresponding purchase is paid and exactly one six-credit ledger transaction exists.
- [ ] Confirm duplicate delivery/reload does not add credits again.
- [ ] Use purchased credits to create a cohort or show interest successfully.
- [ ] Confirm the resulting public product behavior and appropriate Resend notification work.
- [ ] Confirm cancellation and an insufficient-credit attempt grant nothing.
- [ ] Confirm no email, credential, magic-link token, session token, payment detail, or pre-quorum meeting link appears publicly or in routine logs.

Any refund of the real card payment is a separate Stripe dashboard action. Do not add a refund runbook or perform it unless the user explicitly requests that operational action.

### 8. Preserve existing product and provider behavior

- [ ] Verify landing, All/Active/Expired filters, public detail, local meeting times, quorum progress, and link timing.
- [ ] Verify creator, participant, and quorum notification emails still use the established sender and reply-to.
- [ ] Verify `/research` and representative article routes.
- [ ] Verify the feedback widget persists privately if its production migration is installed.
- [ ] Verify Google Analytics still loads with the existing measurement ID.
- [ ] Verify `https://cohort15.com`, `https://www.cohort15.com`, HTTPS, and redirects remain correct.
- [ ] Confirm no replacement Supabase project, Render service, domain, or Resend resource was created.

### 9. Builder Pie evidence check

- [ ] Confirm the registered official public repository is still the repository being used and its public commit history is visible.
- [ ] Confirm every required weekly progress post exists with the required hashtags and `@gimbalabs` mention.
- [ ] Prepare the final presentation with a live account/payment/use demo, official public repository link, deployed product link, and weekly progress links.
- [ ] Capture only privacy-safe screenshots or recordings; redact emails, magic links, payment details, Stripe customer/payment identifiers, secrets, and session data.
- [ ] If pursuing the separate Real User Pie, confirm the paying customer is not family/friends and follow the official public proof/acquisition-story rules separately.

Application implementation cannot retroactively repair missed registration or weekly-post requirements. Report any evidence gap honestly rather than marking it complete.

### 10. Non-secret closeout report

Report only:

- deployed Piece of Pie commit hash;
- whether the existing Supabase and Render resources were retained;
- whether the additive migration and RLS/service-only posture passed;
- whether magic-link account creation and exactly-once two-credit grant passed;
- whether test-mode and live-mode $6 checkout, signed fulfillment, and duplicate prevention passed;
- whether purchased credits funded a real product action;
- whether existing notifications, feedback, analytics, domain/HTTPS, and public lofi behavior passed;
- links to the public repository, deployed product, and privacy-safe final evidence;
- pass/fail for the weekly-post and presentation evidence checks.

Do not include credentials, configuration values, user emails, provider record dumps, magic-link URLs, session data, or payment details.
