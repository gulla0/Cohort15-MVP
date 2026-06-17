# Cohort15 Render Deployment Runbook

## Decision

The first production deployment target is a Render Web Service named `cohort15-mvp`.

Render is a fit for the current app because Cohort15 is a server-rendered Node.js HTTP service with a single `npm start` command, no build step beyond dependency installation, and later production integrations that need a stable public HTTPS base URL.

Official docs checked on 2026-06-17:

- Render Web Services: https://render.com/docs/web-services
- Render Node app quickstart: https://render.com/docs/deploy-node-express-app
- Render deploys: https://render.com/docs/deploys
- Render health checks: https://render.com/docs/health-checks
- Render rollbacks: https://render.com/docs/rollbacks
- Render custom domains: https://render.com/docs/custom-domains
- Render environment variables: https://render.com/docs/environment-variables
- Render Node version: https://render.com/docs/node-version

## Runtime Contract

- Service type: Render Web Service
- Service name: `cohort15-mvp`
- Runtime: Node
- Node version: `24`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/`
- Public service URL assumption: `https://cohort15-mvp.onrender.com`
- Current domain use: `cohort15.com` hosts the pre-release landing page on Netlify
- Custom domain options: keep the app on the Render URL, move `cohort15.com` from Netlify to Render, or use a subdomain such as `https://app.cohort15.com`
- Auto-deploy setting for launch setup: off until T014-T030 production integrations are verified

The app reads `PORT` from the environment and defaults to `3000` locally. Render provides the public web service port at runtime; `src/server/app.mjs` binds to `HOST` or `0.0.0.0` so the service can receive external traffic.

## Repository Configuration

`render.yaml` captures the initial service settings:

```yaml
services:
  - type: web
    name: cohort15-mvp
    runtime: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /
    autoDeploy: false
    envVars:
      - key: NODE_VERSION
        value: "24"
```

If the Render dashboard does not import `render.yaml`, create the same settings manually.

## Human Setup Checklist

No credentials should be pasted into chat or committed to this repository.

1. Create or confirm a Render account at https://dashboard.render.com.
2. In Render, go to `Dashboard` -> `New` -> `Web Service`.
3. Select the Git provider that hosts this repository and connect the repo.
4. Set these creation fields:
   - Name: `cohort15-mvp`
   - Runtime or language: `Node`
   - Branch: the production branch, usually `main`
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: `Starter` or better for production MVP testing
   - Health check path: `/`
   - Auto-deploy: `Off`
5. Add environment variables in `Settings` -> `Environment`:
   - `NODE_VERSION=24`
   - Do not set `COHORT15_PERSISTENCE_FILE` for production; T017 replaces local JSON persistence with Supabase Postgres.
   - T014 will define production secrets and required variables for app base URL, Supabase, Stripe, social publishing, and admin controls.
6. After the first deploy completes, record the generated Render URL. If the service name is available, use `https://cohort15-mvp.onrender.com`.
7. Optional custom domain setup:
   - In Render, open the service -> `Settings` -> `Custom Domains` -> `+ Add Custom Domain`.
   - Enter the chosen app domain: `cohort15.com` if moving the root domain from Netlify to Render, or `app.cohort15.com` if keeping the Netlify landing page on the root domain.
   - In the DNS provider, add the records Render displays for the chosen domain; remove conflicting `AAAA` records while configuring the Render domain.
   - Return to Render and click `Verify` next to the domain.
8. Report back with only non-secret values:
   - Final app base URL, for example `https://cohort15-mvp.onrender.com`, `https://cohort15.com`, or `https://app.cohort15.com`
   - Production branch name
   - Whether auto-deploy is off
   - Whether a custom domain was verified

Checkpoint: T014 can proceed after the Render service exists or after the team confirms the public app base URL that later Supabase, Stripe, and social callback settings should use. Current state is a Netlify pre-release landing page on `cohort15.com`; the production app can still move that root domain to Render if that becomes the chosen launch URL.

## Deploy And Verification

Manual deploy:

1. Open the service in the Render dashboard.
2. Use `Manual Deploy` -> `Deploy latest commit`.
3. Watch the service `Events` page until the deploy is live.
4. Visit `/`, `/cohorts`, and `/auth/sign-in` on the production URL.
5. Confirm the service health check is passing in the dashboard.

Local pre-deploy verification:

```bash
npm run check
npm start
```

For a local port override:

```bash
PORT=4000 npm start
```

## Rollback

Dashboard rollback:

1. Open the Render service.
2. Go to `Events`.
3. Find the most recent known-good successful deploy.
4. Click `Rollback`.
5. Confirm `Rollback to this deploy`.
6. Keep auto-deploy disabled until the bad commit or configuration is fixed.

Render rollbacks reuse the selected deploy artifact but keep current service configuration values. If an outage is caused by an environment variable or secret value, fix the current configuration before or immediately after rollback.

## Current Limits

- This runbook only chooses the deployment target and runtime contract.
- Production config/secrets are T014.
- Supabase Auth callback URLs are T015.
- Supabase Postgres persistence is T017.
- Stripe webhook URLs are T020-T021.
- LinkedIn, X, and Email callback or sender settings are T022-T024.
- Production image upload storage and safety are T026.
