import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationUrl = new URL(
  '../supabase/migrations/20260715000000_cohort15_lofi_accounts_credits.sql',
  import.meta.url,
);

test('account and credit migration is additive and isolated to lofi objects', async () => {
  const sql = await readFile(migrationUrl, 'utf8');

  assert.equal(/\b(drop|truncate|rename)\b/iu.test(sql), false);
  assert.equal(/\b(delete|update)\s+from\b/iu.test(sql), false);
  assert.equal(/\bcreate\s+policy\b/iu.test(sql), false);

  for (const statement of sql.matchAll(/\bcreate\s+(?:table|function|trigger|unique\s+index)\s+([^\s(]+)/giu)) {
    const objectName = statement[1].replace(/^public\./u, '');
    assert.match(objectName, /^cohort15_lofi_/u);
  }

  assert.match(sql, /add column creator_user_id uuid;/u);
  assert.match(sql, /add column user_id uuid;/u);
  assert.match(sql, /on delete set null/gu);
});

test('account and credit tables enforce privacy, identity, and immutable-ledger constraints', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  const tables = ['users', 'sessions', 'credit_transactions', 'purchases', 'stripe_events'];

  for (const table of tables) {
    assert.match(sql, new RegExp(`create table public\\.cohort15_lofi_${table} \\(`, 'u'));
    assert.match(sql, new RegExp(`alter table public\\.cohort15_lofi_${table} enable row level security;`, 'u'));
    assert.match(sql, new RegExp(`revoke all on table public\\.cohort15_lofi_${table} from public, anon, authenticated;`, 'u'));
  }

  assert.match(sql, /supabase_subject text not null unique/u);
  assert.match(sql, /email text not null unique check \(email = lower\(btrim\(email\)\)/u);
  assert.match(sql, /token_digest text not null unique check \(token_digest ~ '\^\[0-9a-f\]\{64\}\$'\)/u);
  assert.match(sql, /idempotency_key text not null unique/u);
  assert.match(sql, /stripe_checkout_session_id text unique/u);
  assert.match(sql, /credit_transaction_id uuid unique/u);
  assert.match(sql, /event_id text primary key/u);
  assert.match(sql, /amount integer not null check \(amount > 0\)/u);
  assert.match(sql, /before update or delete on public\.cohort15_lofi_credit_transactions/u);
  assert.equal(/\bbalance\s+(?:integer|bigint|numeric)\b/iu.test(sql), false);
  assert.doesNotMatch(sql, /grant (?:insert|update|delete|all)[^;]*cohort15_lofi_credit_transactions/iu);
});

test('credit RPCs serialize writes and expose only service-role execution', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  const publicRpcs = [
    'cohort15_lofi_credit_balance',
    'cohort15_lofi_provision_user',
    'cohort15_lofi_hold_credits',
    'cohort15_lofi_consume_credit_hold',
    'cohort15_lofi_refund_credit_hold',
    'cohort15_lofi_fulfill_purchase',
  ];

  assert.match(sql, /set search_path = ''/gu);
  assert.match(sql, /for update/gu);
  assert.match(sql, /pg_advisory_xact_lock/gu);
  assert.match(sql, /if v_available < p_amount then raise exception 'insufficient_credits'/u);
  assert.match(sql, /source_transaction_id uuid unique/u);
  assert.match(sql, /raise exception 'idempotency_mismatch'/u);
  assert.match(sql, /'signup_grant:' \|\| v_user\.id::text/u);
  assert.match(sql, /'purchase:' \|\| p_purchase_id::text/u);

  for (const rpc of publicRpcs) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${rpc}\\([^;]+\\) from public, anon, authenticated;`, 'u'));
    assert.match(sql, new RegExp(`grant execute on function public\\.${rpc}\\([^;]+\\) to service_role;`, 'u'));
  }
  assert.doesNotMatch(sql, /grant execute on function public\.cohort15_lofi_settle_credit_hold[^;]+to service_role/u);
});
