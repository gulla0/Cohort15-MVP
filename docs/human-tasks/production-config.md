# Cohort15 Production Configuration And Secrets

T014 defines the runtime configuration boundary. It does not commit provider credentials, create provider accounts, or complete the later Supabase, Stripe, social publishing, admin, or upload-hardening implementations.

Official docs checked on 2026-06-17:

- Render environment variables and secrets: https://render.com/docs/configure-environment-variables
- Render web services: https://render.com/docs/web-services
- Supabase redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Google login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase GitHub login: https://supabase.com/docs/guides/auth/social-login/auth-github
- Supabase OAuth sign-in and callback exchange: https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- Supabase email magic links: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase Database overview: https://supabase.com/docs/guides/database/overview
- Supabase database connections and poolers: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase Data REST API: https://supabase.com/docs/guides/api
- MDN Set-Cookie reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie
- MDN secure cookie configuration: https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies
- OWASP CSRF prevention cheat sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- Stripe API keys: https://docs.stripe.com/keys
- Stripe webhooks: https://docs.stripe.com/webhooks
- GitHub OAuth app callbacks: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- Google OAuth web server flow: https://developers.google.com/identity/protocols/oauth2/web-server
- LinkedIn OAuth 2.0: https://learn.microsoft.com/linkedin/shared/authentication/authorization-code-flow
- X OAuth 2.0 authorization code flow: https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code

## Runtime Modes

Local development is the default when neither `COHORT15_APP_ENV` nor `NODE_ENV=production` is set.

Production mode is enabled by either:

- `COHORT15_APP_ENV=production`
- `NODE_ENV=production`

In production mode, startup validation fails before the HTTP server starts if required values are missing or unsafe local fallbacks are configured.

## Required Production Environment Variables

Set these in the Render service environment, not in source control:

| Name | Secret | Purpose |
|---|---:|---|
| `COHORT15_APP_ENV` | no | Set to `production` on Render. |
| `COHORT15_APP_URL` | no | Public app base URL, initially `https://cohort15-mvp.onrender.com` unless a verified custom domain replaces it. |
| `COHORT15_SESSION_SECRET` | yes | At least 32 random characters reserved for production session hardening. Do not paste it into chat or source. |
| `COHORT15_ADMIN_EMAILS` | no | Comma-separated Supabase-authenticated account emails allowed to invoke admin operations. Email matching is case-insensitive. |
| `COHORT15_UPLOAD_MODE` | no | Use `disabled` until T026 hardens production image storage. `local` is rejected in production. |
| `SUPABASE_URL` | no | Supabase project URL for T015/T017. |
| `SUPABASE_ANON_KEY` | yes | Supabase public anon key used by auth-facing code. Treat as environment config, not source text. |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only Supabase service role key for production Postgres persistence. Never expose in browser output. |
| `STRIPE_SECRET_KEY` | yes | Server-side Stripe key for T020. |
| `STRIPE_WEBHOOK_SECRET` | yes | Stripe webhook signing secret for T021. |
| `STRIPE_PRICE_6_CREDITS` | no | Stripe Price ID for the `$6` / 6-credit package. |
| `STRIPE_PRICE_14_CREDITS` | no | Stripe Price ID for the `$12` / 14-credit package. |
| `LINKEDIN_CLIENT_ID` | no | LinkedIn app client ID for T022/T023. |
| `LINKEDIN_CLIENT_SECRET` | yes | LinkedIn app client secret. |
| `X_API_KEY` | yes | X developer app API key/client value for T022/T023. |
| `X_API_SECRET` | yes | X developer app API secret/client secret. |
| `EMAIL_PROVIDER_API_KEY` | yes | Email provider API key for the launch email adapter. |
| `EMAIL_FROM_ADDRESS` | no | Verified sender address, for example `hello@cohort15.com`. |

Optional values:

- `PORT`: Render provides this at runtime; local default is `3000`.
- `HOST`: local default is `0.0.0.0`.
- `SUPABASE_AUTH_CALLBACK_PATH`: default `/auth/callback`.
- `SUPABASE_ENABLE_MAGIC_LINK`: set `true` only after Supabase email templates and SMTP/sender settings are production-ready; Google and GitHub remain the required launch providers.
- `STRIPE_WEBHOOK_PATH`: default `/stripe/webhook`.
- `COHORT15_COOKIE_DOMAIN`: reserved for T018 when a custom domain is selected.
- `COHORT15_PERSISTENCE_FILE`: local development only. Do not set in production.

## Human Setup Checklist

No secrets should be pasted into chat or committed to this repository. Enter secret values directly in provider dashboards and Render environment variables.

1. Render environment values:
   - Open https://dashboard.render.com.
   - Go to `Dashboard` -> `cohort15-mvp` -> `Environment`.
   - Add every required production variable above.
   - Use `Save only` until T015-T030 are ready for production deploy, then deploy intentionally.
2. Supabase project and auth URLs:
   - Open https://supabase.com/dashboard.
   - Create or select the Cohort15 project.
   - Go to `Project Settings` -> `API` for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
   - Go to `Authentication` -> `URL Configuration`.
   - Set Site URL to `COHORT15_APP_URL`.
   - Add redirect URL: `COHORT15_APP_URL` + `SUPABASE_AUTH_CALLBACK_PATH`, default `https://cohort15-mvp.onrender.com/auth/callback`.
   - Set `SUPABASE_ENABLE_MAGIC_LINK=false` in Render until email magic links are intentionally enabled.
3. Supabase Postgres schema:
   - Open local file `supabase/migrations/20260617000000_cohort15_core.sql`.
   - In Supabase, go to `SQL Editor` -> `New query`.
   - Paste and run the migration SQL.
   - In `Table Editor`, confirm `cohort15_users`, `cohort15_events`, `cohort15_event_interests`, `cohort15_credit_transactions`, `cohort15_social_posts`, and `cohort15_purchases` exist.
   - Keep `SUPABASE_SERVICE_ROLE_KEY` only in Render server environment values; do not paste it into source, docs, browser code, or chat.
4. Google OAuth for Supabase Auth:
   - Open https://console.cloud.google.com.
   - Go to `APIs & Services` -> `Credentials` -> `Create Credentials` -> `OAuth client ID`.
   - Use application type `Web application`.
   - Add Authorized JavaScript origin: `COHORT15_APP_URL`, default `https://cohort15-mvp.onrender.com`.
   - Add the Supabase Google callback URL shown in `Supabase Dashboard` -> `Authentication` -> `Providers` -> `Google`.
   - Store the generated client ID and secret in Supabase, not in this repository.
   - Enable the Google provider in `Supabase Dashboard` -> `Authentication` -> `Providers` -> `Google`.
5. GitHub OAuth for Supabase Auth:
   - Open https://github.com/settings/developers.
   - Go to `OAuth Apps` -> `New OAuth App`.
   - Set Homepage URL to `COHORT15_APP_URL`, default `https://cohort15-mvp.onrender.com`.
   - Set Authorization callback URL to the GitHub callback URL shown in `Supabase Dashboard` -> `Authentication` -> `Providers` -> `GitHub`.
   - Store the generated client ID and secret in Supabase, not in this repository.
   - Enable the GitHub provider in `Supabase Dashboard` -> `Authentication` -> `Providers` -> `GitHub`.
6. Optional Supabase email magic links:
   - Keep `SUPABASE_ENABLE_MAGIC_LINK=false` unless email auth is a launch requirement.
   - If enabling it, go to `Supabase Dashboard` -> `Authentication` -> `Providers` -> `Email` and confirm sign-in links are enabled.
   - Go to `Authentication` -> `Email Templates` and check the magic-link template sends users back to the configured redirect URL.
   - Use a production SMTP/custom sender before setting `SUPABASE_ENABLE_MAGIC_LINK=true` in Render.
7. Production session and CSRF hardening:
   - No provider dashboard setup is required for T018 beyond setting `COHORT15_APP_ENV=production`, `COHORT15_APP_URL`, and `COHORT15_SESSION_SECRET` in Render.
   - Confirm `COHORT15_APP_URL` is an `https://` URL. The production session cookie is `HttpOnly`, `SameSite=Lax`, `Secure`, scoped to `Path=/`, and expires after 8 hours with `Max-Age` and `Expires`.
   - Confirm no `COHORT15_COOKIE_DOMAIN` override is set unless a custom domain decision explicitly requires it. The current cookie is host-only because no `Domain` attribute is emitted.
   - Browser form mutations that require a signed-in user include a hidden `csrfToken` and production routes reject missing or mismatched tokens with HTTP 403.
   - Local files to review when changing this boundary: `src/auth/session.mjs`, `src/server/app.mjs`, `src/ui/home.mjs`, `src/ui/create-cohort.mjs`, `src/ui/cohorts.mjs`, `src/ui/dashboards.mjs`, `src/ui/auth.mjs`, and `tests/session-security.test.mjs`.
   - Verification checkpoint: after deployment, sign in through Supabase, open `/cohorts/new`, submit a cohort normally, sign out, and confirm the protected dashboard requires sign-in again. Do not inspect or share session cookie values or CSRF token values in chat.
8. Admin identity and expiry operation:
   - In Supabase, open https://supabase.com/dashboard, select the Cohort15 project, then go to `Authentication` -> `Users`.
   - Confirm each intended administrator has signed in through Google or GitHub and note the exact account email shown there. Do not use a request parameter, display name, or unverified alternate email as the role source.
   - In Render, open https://dashboard.render.com, then go to `Dashboard` -> `cohort15-mvp` -> `Environment`.
   - Set `COHORT15_ADMIN_EMAILS` to the comma-separated administrator account emails. This value is configuration rather than an authentication secret, but it still belongs in Render rather than client code or request input.
   - Click `Save and deploy` only when the listed emails have been reviewed. The app must restart with the updated environment before authorization changes take effect.
   - Local implementation files: `src/auth/admin.mjs`, `src/server/app.mjs`, and `tests/admin-authorization.test.mjs`.
   - Exact operation path: `POST COHORT15_APP_URL/admin/expire-cohorts`; an optional ISO timestamp may be supplied as `?now=<ISO date>`. Browser/form callers must send the hidden `csrfToken` from their authenticated app session. Never paste session cookies or CSRF tokens into chat.
   - Verification checkpoint: sign in with an email listed in `COHORT15_ADMIN_EMAILS` and confirm an expiry request succeeds; sign in with an unlisted account and confirm HTTP 403; sign out and confirm HTTP 401. If no intended admin account exists in Supabase or its email is uncertain, stop here and resolve that identity before relying on the endpoint operationally.
9. Stripe products, prices, and webhook:
   - Open https://dashboard.stripe.com.
   - Go to `Developers` -> `API keys` for `STRIPE_SECRET_KEY`.
   - Go to `Product catalog` and create prices for `$6` / 6 credits and `$12` / 14 credits; copy the resulting Price IDs.
   - Go to `Developers` -> `Webhooks` -> `Add endpoint`.
   - Endpoint URL: `COHORT15_APP_URL` + `STRIPE_WEBHOOK_PATH`, default `https://cohort15-mvp.onrender.com/stripe/webhook`.
   - Store the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.
   - Follow the complete test-mode product, Checkout, redirect, and verification checklist in `docs/human-tasks/stripe-checkout.md`. T020 uses the exact return URL `COHORT15_APP_URL/credits/checkout/complete?session_id={CHECKOUT_SESSION_ID}` and cancellation URL `COHORT15_APP_URL/credits/buy?cancelled=1`.
10. LinkedIn:
   - Open https://www.linkedin.com/developers/apps.
   - Create or select the Cohort15 app.
   - In `Auth`, add the redirect URL required by the LinkedIn adapter when T023 defines it.
   - Store client ID and client secret in Render.
11. X:
   - Open https://developer.x.com/en/portal/dashboard.
   - Create or select the Cohort15 project/app.
   - Configure OAuth 2.0 callback URLs when T023 defines the final adapter route.
   - Store API key/client ID and secret in Render.
12. Email provider:
   - Select the launch email provider before T023.
   - Verify `EMAIL_FROM_ADDRESS` in that provider's dashboard.
   - Store the provider API key in Render.

Checkpoint: report back only non-secret values after setup, such as the final `COHORT15_APP_URL`, whether Supabase Google/GitHub providers are enabled, whether the Supabase Postgres migration was applied, whether `SUPABASE_ENABLE_MAGIC_LINK` is staying false or has been intentionally enabled, Stripe price IDs, chosen email provider name, and whether secrets were entered in Render. Do not paste API keys, webhook secrets, service role keys, session secrets, or OAuth client secrets into chat.

## Local Verification

Local development still starts without provider secrets:

```bash
npm run dev
```

Production validation can be checked with placeholder values:

```bash
COHORT15_APP_ENV=production COHORT15_APP_URL=https://cohort15-mvp.onrender.com COHORT15_SESSION_SECRET=a-production-session-secret-at-least-32-chars COHORT15_ADMIN_EMAILS=admin@example.com COHORT15_UPLOAD_MODE=disabled SUPABASE_URL=https://project.supabase.co SUPABASE_ANON_KEY=placeholder SUPABASE_SERVICE_ROLE_KEY=placeholder STRIPE_SECRET_KEY=placeholder STRIPE_WEBHOOK_SECRET=placeholder STRIPE_PRICE_6_CREDITS=price_6 STRIPE_PRICE_14_CREDITS=price_14 LINKEDIN_CLIENT_ID=placeholder LINKEDIN_CLIENT_SECRET=placeholder X_API_KEY=placeholder X_API_SECRET=placeholder EMAIL_PROVIDER_API_KEY=placeholder EMAIL_FROM_ADDRESS=hello@cohort15.com npm start
```

Use placeholder values only for validation or staging smoke checks. Real production secrets belong in Render.
