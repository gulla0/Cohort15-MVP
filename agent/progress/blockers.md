# Blockers

No known code blocker remains after the verified L019 local launch gate.

The user reported the existing Supabase project, Render service, `cohort15.com` domain, Resend/email notification setup, and related lofi human work complete. Treat those as retained infrastructure and verify them through `docs/human-tasks/piece-of-pie-launch.md`; do not recreate them.

L020 is ready and necessarily requires the user to apply the additive migrations, enable Supabase Auth, configure Stripe/Render secrets and webhook settings, deploy, complete a live payment, verify purchased-credit use, and confirm hackathon evidence through `docs/human-tasks/piece-of-pie-launch.md`.

The production state of the separate feedback migration must be confirmed during the retained-baseline check.
