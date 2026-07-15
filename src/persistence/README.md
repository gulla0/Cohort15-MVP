# Persistence

This directory contains the lofi persistence boundary for public cohort data plus private accounts, sessions, credits, purchases, Stripe event receipts, feedback, and notification deliveries.

Files:

- `store.mjs` provides the in-memory local store used by tests. Identity, credit, purchase, Stripe-event, and cohort writes are serialized on their conflicting keys.
- `repositories.mjs` exposes the local repository implementation and shared repository errors. It provisions the signup grant once, derives balances from immutable transactions, and provides idempotent hold, settlement, and purchase-fulfillment primitives.
- `supabase-postgres.mjs` provides the equivalent server-only PostgREST/RPC adapter. It requires a Supabase service-role key and is not intended for browser use.

The Supabase migrations create only `cohort15_lofi_*` objects, including:

- `cohort15_lofi_cohorts`
- `cohort15_lofi_interests`
- `cohort15_lofi_notification_deliveries`
- `cohort15_lofi_users`
- `cohort15_lofi_sessions`
- `cohort15_lofi_credit_transactions`
- `cohort15_lofi_purchases`
- `cohort15_lofi_stripe_events`
- `cohort15_lofi_accept_interest(...)`

The account and credit migration adds nullable account links to cohorts and interests, keeps legacy rows unclaimed, enables RLS without browser policies, and exposes service-role-only atomic RPCs for provisioning, balances, holds, consume/refund settlement, and purchase fulfillment. Session tokens and CSRF values enter persistence only as SHA-256 digests. Credit balances are never stored; they are derived from immutable positive-integer transactions.

Rate limiting remains process-local and is intentionally not persisted here.
