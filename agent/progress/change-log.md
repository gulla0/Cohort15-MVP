# Change Log

## 2026-06-18 — Lofi MVP setup reset

- Added the lofi product specification.
- Replaced the production plan and T-task backlog with L001–L010.
- Rebuilt the atomic dependency graph and readable task status.
- Reset knowledge, progress, and feedback artifacts for a clean branch start.
- Removed prior resolved feedback issue folders; Git history remains the archive.
- Added an isolated lofi provider/deployment human-task runbook.

Verification: `npm run check` passed with 85 tests.

## 2026-06-18 — L000 clean lofi application shell

- Replaced the production server with home, styles, health, and 404-only routes.
- Replaced runtime configuration and Render placeholders with lofi-specific names.
- Removed auth, payments, credits, dashboards, social promotion, images, production persistence/domain/services, old migrations, production runbooks/spec, and legacy tests.
- Added focused shell and runtime configuration tests.

Verification: `npm run check` passed with 5 focused shell tests. Route-level smoke coverage verified home, styles, health, 404 behavior, and legacy-route removal. Interactive browser smoke was unavailable because the sandbox denied local port binding.
