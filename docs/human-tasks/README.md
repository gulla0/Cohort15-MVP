# Human Tasks

This directory is the only location for external dashboard, credential, DNS, operational-decision, and production-verification instructions.

## Current Lofi MVP Task

- `lofi-mvp-launch.md` — create isolated Supabase, Render, and Resend resources; verify the generated deployment; replace the Netlify site at `cohort15.com`; run non-secret launch checks.

## Historical Production-MVP References

These are not active on the lofi branch and must not be used to configure lofi resources:

- `deployment-render.md`
- `production-config.md`
- `stripe-checkout.md`
- `supabase-postgres.md`

## Repository Rule

Every human-task document must include `## Human Setup Checklist`, contain no credentials or secret values, and be listed here. Never paste secrets into chat, logs, issues, or committed files.
