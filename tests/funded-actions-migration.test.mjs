import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260715010000_cohort15_lofi_funded_actions.sql', import.meta.url);

test('funded-action migration keeps create, hold, interest, quorum consumption, and expiry refunds in database transactions', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /create function public\.cohort15_lofi_create_funded_cohort/u);
  assert.match(sql, /create function public\.cohort15_lofi_accept_funded_interest/u);
  assert.match(sql, /create function public\.cohort15_lofi_settle_expired_holds/u);
  assert.match(sql, /where users\.id = p_user_id for update/u);
  assert.match(sql, /where cohorts\.id = p_cohort_id for update/u);
  assert.match(sql, /raise exception 'insufficient_credits'/u);
  assert.match(sql, /'hold', 2/u);
  assert.match(sql, /'hold', 1/u);
  assert.match(sql, /'consume'/u);
  assert.match(sql, /'refund'/u);
  assert.match(sql, /source_transaction_id/u);
  assert.match(sql, /cohorts\.quorum_met_at is null and p_now >= cohorts\.expires_at/u);
  assert.doesNotMatch(sql, /\b(drop|truncate)\s+(table|schema)\b/iu);
});

test('funded-action RPCs use safe search paths and service-role-only execution', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.equal((sql.match(/security definer/gu) ?? []).length, 3);
  assert.equal((sql.match(/set search_path = ''/gu) ?? []).length, 3);
  assert.equal((sql.match(/from public, anon, authenticated/gu) ?? []).length, 3);
  assert.equal((sql.match(/to service_role/gu) ?? []).length, 3);
  assert.doesNotMatch(sql, /grant execute[\s\S]+to (anon|authenticated)/iu);
});
