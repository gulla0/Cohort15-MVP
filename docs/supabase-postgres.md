# Supabase Postgres Persistence

T017 adds the production persistence path for Cohort15. Local development still uses in-memory state by default, and `COHORT15_PERSISTENCE_FILE` remains local-only JSON persistence.

Official docs checked on 2026-06-17:

- Supabase Database overview: https://supabase.com/docs/guides/database/overview
- Supabase tables and SQL editor: https://supabase.com/docs/guides/database/tables
- Supabase database connections and poolers: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase Data REST API: https://supabase.com/docs/guides/api
- Render environment variables: https://render.com/docs/configure-environment-variables

## How It Works

Production startup uses:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The server uses the Supabase REST API at `SUPABASE_URL/rest/v1/` with the service role key on the server only. The key must never be rendered to the browser, logged, committed, or pasted into chat.

The adapter hydrates the existing repository contract from Supabase tables at startup. Validated repository writes are flushed back to Supabase with PostgREST upserts. Credit balances remain derived from `cohort15_credit_transactions`; the SQL migration also includes RPC helpers that serialize credit transaction writes with a user-level advisory transaction lock for the later Stripe and concurrency hardening tasks.

## Human Setup Checklist

Do not paste Supabase secrets into chat. Enter them directly in Supabase and Render dashboards.

1. Open the Supabase dashboard:
   - URL: https://supabase.com/dashboard
   - Create or select the Cohort15 project.
2. Apply the schema:
   - Go to `SQL Editor` -> `New query`.
   - Open local file `supabase/migrations/20260617000000_cohort15_core.sql`.
   - Paste and run the SQL in the selected Cohort15 project.
   - Confirm these tables exist in `Table Editor`: `cohort15_users`, `cohort15_events`, `cohort15_event_interests`, `cohort15_credit_transactions`, `cohort15_social_posts`, and `cohort15_purchases`.
3. Collect server environment values:
   - Go to `Project Settings` -> `API`.
   - Copy `Project URL` into Render as `SUPABASE_URL`.
   - Copy `service_role` key into Render as `SUPABASE_SERVICE_ROLE_KEY`.
   - Keep `anon` key in Render as `SUPABASE_ANON_KEY` for auth.
4. Configure Render:
   - URL: https://dashboard.render.com
   - Go to `Dashboard` -> `cohort15-mvp` -> `Environment`.
   - Set `COHORT15_APP_ENV=production`.
   - Leave `COHORT15_PERSISTENCE_FILE` unset in production.
   - Confirm `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are present.
   - Use `Save only` until the remaining T018-T030 launch tasks are ready.
5. Verify without exposing secrets:
   - In Supabase `Table Editor`, inspect row counts after a staging sign-in and cohort creation.
   - In Render logs, confirm startup does not report missing Supabase configuration.
   - Report back only non-secret status: schema applied, table names visible, Render env vars present, and final `COHORT15_APP_URL`.

Continue/block checkpoint: local implementation can continue without live Supabase access. A real production deploy is blocked until the SQL migration has been applied and the three Supabase env vars are set in Render.
