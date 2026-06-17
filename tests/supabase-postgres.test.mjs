import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEvent } from '../src/domain/validation.mjs';
import {
  SUPABASE_POSTGRES_TABLES,
  createSupabasePostgresClient,
  createSupabasePostgresStore
} from '../src/persistence/supabase-postgres.mjs';
import { createRepositories } from '../src/persistence/repositories.mjs';
import { createCreditLedger } from '../src/persistence/credit-ledger.mjs';
import { createConfiguredState } from '../src/server/app.mjs';

const createdAt = new Date('2026-06-01T12:00:00.000Z');

function createFetchStub(initialRows = {}) {
  const calls = [];

  async function fetchImpl(url, options = {}) {
    calls.push({ url, options });
    const parsed = new URL(url);
    const table = parsed.pathname.split('/').at(-1);

    if (options.method === 'GET') {
      return {
        ok: true,
        status: 200,
        async json() {
          return initialRows[table] ?? [];
        }
      };
    }

    if (options.method === 'POST') {
      return {
        ok: true,
        status: 204,
        async json() {
          return undefined;
        }
      };
    }

    return {
      ok: false,
      status: 405,
      async text() {
        return 'method not allowed';
      }
    };
  }

  fetchImpl.calls = calls;
  return fetchImpl;
}

function eventInput(overrides = {}) {
  return {
    id: 'event-1',
    creatorId: 'supabase:user-1',
    title: 'Production Postgres Cohort',
    description: 'Verify production persistence wiring.',
    category: 'build',
    topic: 'Postgres',
    targetAudience: 'Cohort15 operators.',
    targetSkillLevel: 'intermediate',
    minQuorum: 2,
    maxParticipants: 6,
    lockedEventLink: 'https://meet.google.com/prod',
    firstMeetingAt: new Date('2026-06-20T18:00:00.000Z'),
    meetingDurationMinutes: 60,
    recurrence: 'weekly',
    meetingCount: 4,
    createdAt,
    ...overrides
  };
}

test('Supabase Postgres client hydrates database rows into app records', async () => {
  const fetchImpl = createFetchStub({
    [SUPABASE_POSTGRES_TABLES.users]: [{
      id: 'supabase:user-1',
      display_name: 'Prod User',
      email: 'prod@example.test',
      auth_provider: 'supabase',
      auth_subject: 'user-1',
      created_at: createdAt.toISOString()
    }],
    [SUPABASE_POSTGRES_TABLES.creditTransactions]: [{
      id: 'txn-grant-supabase-user-1-1',
      user_id: 'supabase:user-1',
      amount: 6,
      type: 'grant',
      source: 'admin_bootstrap',
      created_at: createdAt.toISOString()
    }]
  });

  const client = createSupabasePostgresClient({
    supabaseUrl: 'https://project.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl
  });

  const snapshot = await client.loadSnapshot();

  assert.equal(snapshot.users[0].displayName, 'Prod User');
  assert.equal(snapshot.users[0].authSubject, 'user-1');
  assert.equal(snapshot.users[0].createdAt instanceof Date, true);
  assert.equal(snapshot.creditTransactions[0].userId, 'supabase:user-1');
  assert.equal(fetchImpl.calls.filter((call) => call.options.method === 'GET').length, 6);
});

test('Supabase Postgres store flushes repository writes through PostgREST upserts', async () => {
  const fetchImpl = createFetchStub({
    [SUPABASE_POSTGRES_TABLES.users]: [{
      id: 'supabase:user-1',
      display_name: 'Prod User',
      email: 'prod@example.test',
      auth_provider: 'supabase',
      auth_subject: 'user-1',
      created_at: createdAt.toISOString()
    }]
  });
  const store = await createSupabasePostgresStore({
    supabaseUrl: 'https://project.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl
  });
  const repositories = createRepositories({}, { store });
  const ledger = createCreditLedger(repositories.creditTransactions, {
    now: () => createdAt
  });

  ledger.grant('supabase:user-1', 6, 'admin_bootstrap');
  repositories.events.save(buildEvent(eventInput()));
  repositories.purchases.save({
    id: 'purchase-1',
    userId: 'supabase:user-1',
    provider: 'stripe',
    providerCheckoutId: 'checkout-1',
    packageCredits: 6,
    amountCents: 600,
    currency: 'usd',
    status: 'pending',
    createdAt,
    updatedAt: createdAt
  });
  await store.whenIdle();

  const postCalls = fetchImpl.calls.filter((call) => call.options.method === 'POST');
  assert.ok(postCalls.some((call) => call.url.endsWith('/rest/v1/cohort15_credit_transactions')));
  assert.ok(postCalls.some((call) => call.url.endsWith('/rest/v1/cohort15_events')));
  assert.ok(postCalls.some((call) => call.url.endsWith('/rest/v1/cohort15_purchases')));
  assert.equal(postCalls.every((call) => call.options.headers.authorization === 'Bearer service-role-key'), true);

  const transactionCall = postCalls.find((call) => call.url.endsWith('/rest/v1/cohort15_credit_transactions'));
  const rows = JSON.parse(transactionCall.options.body);
  assert.equal(rows[0].user_id, 'supabase:user-1');
  assert.equal(rows[0].created_at, createdAt.toISOString());
});

test('production configured state uses Supabase Postgres without seeding demo users', async () => {
  const fetchImpl = createFetchStub();
  const state = await createConfiguredState({
    fetchImpl,
    env: {
      COHORT15_APP_ENV: 'production',
      COHORT15_APP_URL: 'https://cohort15-mvp.onrender.com',
      COHORT15_SESSION_SECRET: 'a-production-session-secret-at-least-32-chars',
      COHORT15_ADMIN_EMAILS: 'admin@example.test',
      COHORT15_UPLOAD_MODE: 'disabled',
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      STRIPE_SECRET_KEY: 'stripe-key',
      STRIPE_WEBHOOK_SECRET: 'stripe-webhook-secret',
      STRIPE_PRICE_6_CREDITS: 'price_6',
      STRIPE_PRICE_14_CREDITS: 'price_14',
      LINKEDIN_CLIENT_ID: 'linkedin-client-id',
      LINKEDIN_CLIENT_SECRET: 'linkedin-client-secret',
      X_API_KEY: 'x-api-key',
      X_API_SECRET: 'x-api-secret',
      EMAIL_PROVIDER_API_KEY: 'email-provider-key',
      EMAIL_FROM_ADDRESS: 'hello@cohort15.com'
    }
  });

  assert.deepEqual(state.repositories.users.list(), []);
  assert.equal(fetchImpl.calls.filter((call) => call.options.method === 'GET').length, 6);
});
