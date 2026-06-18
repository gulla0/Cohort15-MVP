# Human Tasks

This directory is the single location for work that requires a person to use an external provider dashboard, manage credentials, make a deployment decision, or perform production verification that cannot be completed from the repository alone.

## Current Task Files

- `deployment-render.md` — create and verify the Render service, choose the production URL, deploy, and roll back if needed.
- `production-config.md` — configure production environment variables, authentication providers, admin access, social/email providers, and production verification.
- `stripe-checkout.md` — configure Stripe products, prices, secrets, redirects, and test-mode Checkout verification.
- `supabase-postgres.md` — create/configure Supabase, apply the production schema, configure Render, and verify connectivity.

## Repository Rule

Put every new human-action checklist or runbook in `docs/human-tasks/`, include a `## Human Setup Checklist` section, and add its filename to the Current Task Files list above. Product specifications, implementation documentation, and automated agent tasks remain in their existing locations. When a feature needs both implementation documentation and human setup, keep the human checklist here and link to it from the implementation documentation.

Never commit credentials or paste secrets into task files, issues, logs, or chat.
