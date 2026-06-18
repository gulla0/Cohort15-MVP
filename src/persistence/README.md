# Persistence

This directory contains isolated lofi persistence for anonymous cohorts, interests, and notification deliveries only.

Files:

- `store.mjs` provides the in-memory local store used by tests. Interest acceptance is serialized per cohort so quorum transition behavior matches the database RPC contract.
- `repositories.mjs` exposes the local repository implementation and shared repository error types. Public cohort reads derive interest counts and never expose private email fields.
- `supabase-postgres.mjs` provides a server-only PostgREST adapter for the isolated `cohort15_lofi_` tables and `cohort15_lofi_accept_interest` RPC. It requires a Supabase service-role key and is not intended for browser use.

The Supabase migration creates only:

- `cohort15_lofi_cohorts`
- `cohort15_lofi_interests`
- `cohort15_lofi_notification_deliveries`
- `cohort15_lofi_accept_interest(...)`

Rate limiting remains process-local and is intentionally not persisted here.
