import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  createSupabasePostgresRepositories,
  RPCS,
  TABLES,
} from '../src/persistence/supabase-postgres.mjs';

const CREATED_AT = '2026-01-01T12:00:00.000Z';
const SUPABASE_URL = 'https://example.supabase.co';
const SERVICE_ROLE_KEY = 'service-role-secret';

function validCohortInput(overrides = {}) {
  return {
    creatorEmail: ' creator@example.com ',
    title: 'Lofi founders circle',
    description: 'A focused group for founders validating a lofi product direction.',
    category: 'build',
    topic: 'Founder validation',
    targetAudience: 'Early stage builders',
    targetSkillLevel: 'intermediate',
    additionalDetails: 'Bring one open product question.',
    minQuorum: 2,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-01-10T10:00',
    meetingDurationMinutes: 60,
    recurrence: 'weekly',
    meetingCount: 3,
    ...overrides,
  };
}

function createFetchStub(...responses) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({
      url,
      method: init.method ?? 'GET',
      headers: init.headers ?? {},
      body: init.body == null ? null : JSON.parse(init.body),
    });
    const next = responses.shift();
    if (!next) throw new Error('unexpected fetch call');
    return {
      ok: next.ok ?? true,
      status: next.status ?? 200,
      async text() {
        return next.body == null ? '' : JSON.stringify(next.body);
      },
    };
  };
  return { fetchImpl, calls };
}

test('Supabase cohort inserts use only service-role headers and isolated lofi tables', async () => {
  const { fetchImpl, calls } = createFetchStub({
    body: [{
      id: '66203c07-eaa9-4e7e-8ce0-7963f569fbd3',
      creator_email: 'creator@example.com',
      title: 'Lofi founders circle',
      description: 'A focused group for founders validating a lofi product direction.',
      category: 'build',
      topic: 'Founder validation',
      target_audience: 'Early stage builders',
      target_skill_level: 'intermediate',
      additional_details: 'Bring one open product question.',
      min_quorum: 2,
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      creator_time_zone: 'America/Detroit',
      first_meeting_at: '2026-01-10T15:00:00.000Z',
      first_meeting_local: '2026-01-10T10:00',
      meeting_duration_minutes: 60,
      recurrence: 'weekly',
      meeting_count: 3,
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
      expires_at: '2026-01-08T12:00:00.000Z',
      quorum_met_at: null,
    }],
  });
  const repositories = createSupabasePostgresRepositories({
    url: SUPABASE_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
    fetchImpl,
  });

  await repositories.createCohort(validCohortInput(), {
    id: '66203c07-eaa9-4e7e-8ce0-7963f569fbd3',
    now: CREATED_AT,
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, new RegExp(`/rest/v1/${TABLES.cohorts}$`, 'u'));
  assert.equal(calls[0].headers.apikey, SERVICE_ROLE_KEY);
  assert.equal(calls[0].headers.Authorization, `Bearer ${SERVICE_ROLE_KEY}`);
  assert.equal(calls[0].body.creator_email, 'creator@example.com');
  assert.equal(calls[0].body.id, '66203c07-eaa9-4e7e-8ce0-7963f569fbd3');
});

test('Supabase repositories call the default Web Crypto UUID generator with its receiver', async () => {
  let insertedRow;
  const fetchImpl = async (_url, init = {}) => {
    insertedRow = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify([insertedRow]);
      },
    };
  };
  const repositories = createSupabasePostgresRepositories({
    url: SUPABASE_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
    fetchImpl,
  });

  const cohort = await repositories.createCohort(validCohortInput(), { now: CREATED_AT });

  assert.match(cohort.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
  assert.equal(insertedRow.id, cohort.id);
});

test('Supabase interest acceptance uses the isolated RPC and maps repository conflicts', async () => {
  const { fetchImpl, calls } = createFetchStub(
    {
      body: [{
        interest_id: 'b10a8e44-c1b6-49d1-a6fa-e6ccf4f2f8ea',
        interest_created_at: '2026-01-01T12:02:00.000Z',
        interest_count: 2,
        reached_quorum: true,
        conflict_code: null,
        quorum_met_at: '2026-01-01T12:02:00.000Z',
      }],
    },
    {
      body: {
        id: '89a31d99-22ef-453f-ab9d-c53be1df8cd0',
        creator_email: 'creator@example.com',
        title: 'Lofi founders circle',
        description: 'A focused group for founders validating a lofi product direction.',
        category: 'build',
        topic: 'Founder validation',
        target_audience: 'Early stage builders',
        target_skill_level: 'intermediate',
        additional_details: 'Bring one open product question.',
        min_quorum: 2,
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        creator_time_zone: 'America/Detroit',
        first_meeting_at: '2026-01-10T15:00:00.000Z',
        first_meeting_local: '2026-01-10T10:00',
        meeting_duration_minutes: 60,
        recurrence: 'weekly',
        meeting_count: 3,
        created_at: CREATED_AT,
        updated_at: '2026-01-01T12:02:00.000Z',
        expires_at: '2026-01-08T12:00:00.000Z',
        quorum_met_at: '2026-01-01T12:02:00.000Z',
      },
    },
  );
  const repositories = createSupabasePostgresRepositories({
    url: SUPABASE_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
    fetchImpl,
  });

  const accepted = await repositories.acceptInterest(
    {
      cohortId: '89a31d99-22ef-453f-ab9d-c53be1df8cd0',
      email: 'Person@example.com',
    },
    {
      id: 'b10a8e44-c1b6-49d1-a6fa-e6ccf4f2f8ea',
      now: '2026-01-01T12:02:00.000Z',
    },
  );

  assert.equal(accepted.reachedQuorum, true);
  assert.equal(accepted.interest.email, 'person@example.com');
  assert.equal(accepted.cohort.quorumMetAt, '2026-01-01T12:02:00.000Z');
  assert.match(calls[0].url, new RegExp(`/rest/v1/rpc/${RPCS.acceptInterest}$`, 'u'));
  assert.deepEqual(calls[0].body, {
    p_cohort_id: '89a31d99-22ef-453f-ab9d-c53be1df8cd0',
    p_interest_id: 'b10a8e44-c1b6-49d1-a6fa-e6ccf4f2f8ea',
    p_email: 'person@example.com',
    p_now: '2026-01-01T12:02:00.000Z',
  });

  const conflictFetch = createFetchStub({
    body: [{
      interest_id: null,
      interest_created_at: null,
      interest_count: 0,
      reached_quorum: false,
      conflict_code: 'duplicate_email',
      quorum_met_at: null,
    }],
  });
  const conflictRepositories = createSupabasePostgresRepositories({
    url: SUPABASE_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
    fetchImpl: conflictFetch.fetchImpl,
  });
  await assert.rejects(
    () => conflictRepositories.acceptInterest(
      {
        cohortId: '89a31d99-22ef-453f-ab9d-c53be1df8cd0',
        email: 'Person@example.com',
      },
      {
        id: '7946c588-a5fd-47fd-a6b1-b1f6bb72fa9a',
        now: '2026-01-01T12:03:00.000Z',
      },
    ),
    (error) => error.code === 'duplicate_email',
  );
});

test('Supabase notification deliveries use unique idempotency keys and outcome patches', async () => {
  const { fetchImpl, calls } = createFetchStub(
    { status: 409, ok: false, body: { message: 'duplicate key value violates unique constraint' } },
    {
      body: {
        id: '2d5352f6-cd8f-492c-8dc0-1d0cf985f730',
        idempotency_key: 'participant_confirmation:interest-1',
        cohort_id: 'cohort-1',
        interest_id: 'interest-1',
        recipient_email: 'person@example.com',
        type: 'participant_confirmation',
        status: 'pending',
        attempt_count: 0,
        provider_error_code: null,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
        sent_at: null,
      },
    },
    {
      body: {
        id: '2d5352f6-cd8f-492c-8dc0-1d0cf985f730',
        idempotency_key: 'participant_confirmation:interest-1',
        cohort_id: 'cohort-1',
        interest_id: 'interest-1',
        recipient_email: 'person@example.com',
        type: 'participant_confirmation',
        status: 'pending',
        attempt_count: 0,
        provider_error_code: null,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
        sent_at: null,
      },
    },
    {
      body: [{
        id: '2d5352f6-cd8f-492c-8dc0-1d0cf985f730',
        idempotency_key: 'participant_confirmation:interest-1',
        cohort_id: 'cohort-1',
        interest_id: 'interest-1',
        recipient_email: 'person@example.com',
        type: 'participant_confirmation',
        status: 'sent',
        attempt_count: 1,
        provider_error_code: null,
        created_at: CREATED_AT,
        updated_at: '2026-01-01T12:05:00.000Z',
        sent_at: '2026-01-01T12:05:00.000Z',
      }],
    },
  );
  const repositories = createSupabasePostgresRepositories({
    url: SUPABASE_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
    fetchImpl,
  });

  const ensured = await repositories.ensureNotificationDelivery({
    idempotencyKey: 'participant_confirmation:interest-1',
    cohortId: 'cohort-1',
    interestId: 'interest-1',
    recipientEmail: 'person@example.com',
    type: 'participant_confirmation',
  }, {
    id: '47f84a22-0b4e-4451-8daa-b8b35b5cfe62',
    now: CREATED_AT,
  });
  assert.equal(ensured.created, false);

  const updated = await repositories.recordNotificationOutcome('participant_confirmation:interest-1', {
    status: 'sent',
    attemptCount: 1,
  }, { now: '2026-01-01T12:05:00.000Z' });
  assert.equal(updated.status, 'sent');
  assert.equal(updated.sentAt, '2026-01-01T12:05:00.000Z');
  assert.match(calls[3].url, new RegExp(`/rest/v1/${TABLES.notificationDeliveries}\\?`, 'u'));
  assert.equal(calls[3].method, 'PATCH');
});

test('Supabase feedback upserts use the isolated feedback table and session conflict key', async () => {
  const { fetchImpl, calls } = createFetchStub(
    { status: 406, ok: false, body: { message: 'JSON object requested, multiple or no rows returned' } },
    {
      body: [{
        id: '3c6d7f06-24fa-41d5-a942-35b93b0ce1dc',
        session_id: 'feedback-session-1',
        path: '/research',
        action_context: { readResearch: true },
        looking_for_group: 'yes',
        looking_for_instead: null,
        group_intent: 'both',
        did_create_or_join: 'not_yet',
        why_or_why_not: 'I want a serious group.',
        contact_email: 'person@example.com',
        contact_x: '@cohort15dotcom',
        contact_linkedin: null,
        contact_other: null,
        completion_state: 'completed',
        last_step: 6,
        submitted_on_close: false,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
        completed_at: CREATED_AT,
      }],
    },
  );
  const repositories = createSupabasePostgresRepositories({
    url: SUPABASE_URL,
    serviceRoleKey: SERVICE_ROLE_KEY,
    fetchImpl,
  });

  const saved = await repositories.upsertFeedback({
    sessionId: 'feedback-session-1',
    path: '/research',
    actionContext: { readResearch: true },
    lookingForGroup: 'yes',
    groupIntent: 'both',
    didCreateOrJoin: 'not_yet',
    whyOrWhyNot: 'I want a serious group.',
    contactEmail: 'Person@Example.com',
    contactX: '@cohort15dotcom',
    completionState: 'completed',
    lastStep: 6,
  }, {
    id: '3c6d7f06-24fa-41d5-a942-35b93b0ce1dc',
    now: CREATED_AT,
  });

  assert.equal(saved.contactEmail, 'person@example.com');
  assert.equal(saved.completionState, 'completed');
  assert.match(calls[0].url, new RegExp(`/rest/v1/${TABLES.feedback}\\?`, 'u'));
  assert.match(calls[1].url, new RegExp(`/rest/v1/${TABLES.feedback}\\?on_conflict=session_id$`, 'u'));
  assert.equal(calls[1].method, 'POST');
  assert.equal(calls[1].headers.Prefer, 'resolution=merge-duplicates,return=representation');
  assert.equal(calls[1].body.session_id, 'feedback-session-1');
  assert.equal(calls[1].body.contact_email, 'person@example.com');
  assert.equal(calls[1].body.action_context.readResearch, true);
});

test('migration is isolated to cohort15_lofi objects with RLS and no browser policies', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/20260618000000_cohort15_lofi.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /create table public\.cohort15_lofi_cohorts/u);
  assert.match(migration, /create table public\.cohort15_lofi_interests/u);
  assert.match(migration, /create table public\.cohort15_lofi_notification_deliveries/u);
  assert.match(migration, /create or replace function public\.cohort15_lofi_accept_interest/u);
  assert.match(migration, /enable row level security/iu);
  assert.match(migration, /set search_path = ''/u);
  assert.match(
    migration,
    /revoke all on function public\.cohort15_lofi_accept_interest\([^;]+\) from public, anon, authenticated;/u,
  );
  assert.match(migration, /v_email text := lower\(btrim\(p_email\)\)/u);
  assert.equal(/create policy/iu.test(migration), false);
  assert.equal(
    /create\s+(?:table|function|type|view)\s+[^\n;]*(?:auth\.|users\b|credits\b|purchases\b|images\b|social\b|rate[_-]?limit\b)/iu.test(migration),
    false,
  );
});

test('feedback migration is isolated, private, and service-role only', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/20260624000000_cohort15_lofi_feedback.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /create table if not exists public\.cohort15_lofi_feedback/u);
  assert.match(migration, /session_id text not null unique/u);
  assert.match(migration, /action_context jsonb not null default/u);
  assert.match(migration, /alter table public\.cohort15_lofi_feedback enable row level security/u);
  assert.match(migration, /revoke all on table public\.cohort15_lofi_feedback from anon/u);
  assert.match(migration, /grant select, insert, update on table public\.cohort15_lofi_feedback to service_role/u);
  assert.equal(/create policy/iu.test(migration), false);
  assert.equal(/production[_-]?mvp|cohort15_users|credits|purchases/iu.test(migration), false);
});

test('interest RPC correction qualifies table columns that conflict with output names', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/20260618000001_fix_cohort15_lofi_accept_interest.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /update public\.cohort15_lofi_cohorts as cohorts/u);
  assert.match(migration, /and cohorts\.quorum_met_at is null/u);
  assert.match(migration, /v_interest_count >= cohorts\.min_quorum/u);
  assert.match(migration, /returning cohorts\.quorum_met_at into v_quorum_met_at/u);
  assert.match(migration, /select cohorts\.quorum_met_at/u);
});
