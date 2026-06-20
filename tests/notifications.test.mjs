import test from 'node:test';
import assert from 'node:assert/strict';

import { createResendEmailProvider, EmailProviderError } from '../src/email/resend.mjs';
import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createSupabasePostgresRepositories, TABLES } from '../src/persistence/supabase-postgres.mjs';
import { createCohortService } from '../src/services/create-cohort.mjs';
import { createNotificationService } from '../src/services/notifications.mjs';
import { createRollingWindowLimiter } from '../src/services/rate-limit.mjs';
import { createShowInterestService } from '../src/services/show-interest.mjs';

const NOW = new Date('2026-06-18T12:00:00.000Z');

function submission(overrides = {}) {
  return {
    creatorEmail: 'creator@example.com', title: 'Build a tiny compiler',
    description: 'Work through a tiny compiler implementation together.', category: 'build',
    topic: 'Compilers', targetAudience: 'Developers learning language implementation',
    targetSkillLevel: 'intermediate', additionalDetails: '', minQuorum: 2,
    meetingLink: 'https://meet.google.com/abc-defg-hij', creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-07-10T18:00', meetingDurationMinutes: 60,
    recurrence: 'weekly', meetingCount: 2, ...overrides,
  };
}

function fixture(emailProvider) {
  const store = createLofiStore();
  let id = 0;
  const repositories = createLocalRepositories({
    store, now: () => NOW, randomUUID: () => `record-${++id}`,
  });
  const notifications = createNotificationService({
    repositories, emailProvider, appUrl: 'https://cohort15.com',
  });
  const limiter = () => createRollingWindowLimiter({ limit: 10, windowMs: 3_600_000 });
  return {
    store,
    repositories,
    creator: createCohortService({ repositories, limiter: limiter(), notifications }),
    interest: createShowInterestService({ repositories, limiter: limiter(), notifications }),
    notifications,
  };
}

test('Resend adapter sends one recipient with fixed sender, reply-to, and five-second timeout', async () => {
  let request;
  const provider = createResendEmailProvider({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => { request = { url, options }; return { ok: true, status: 200 }; },
  });
  await provider.send({
    to: 'person@example.com', subject: 'Subject', html: '<p>Hello</p>', idempotencyKey: 'key-1',
  });

  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.authorization, 'Bearer test-key');
  assert.equal(request.options.headers['idempotency-key'], 'key-1');
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(request.options.body), {
    from: 'Cohort15 <updates@cohort15.com>', reply_to: 'cohort15dotcom@gmail.com',
    to: ['person@example.com'], subject: 'Subject', html: '<p>Hello</p>',
  });
});

test('Resend adapter sanitizes provider failures without reading response bodies', async () => {
  const provider = createResendEmailProvider({
    apiKey: 'test-key', fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  await assert.rejects(
    provider.send({ to: 'person@example.com', subject: 'x', html: 'x', idempotencyKey: 'key' }),
    (error) => error instanceof EmailProviderError && error.code === 'http_429'
      && !error.message.includes('person@example.com'),
  );
});

test('Resend adapter sends up to one hundred emails in one idempotent batch request', async () => {
  let request;
  const provider = createResendEmailProvider({
    apiKey: 'test-key',
    fetchImpl: async (url, options) => { request = { url, options }; return { ok: true, status: 200 }; },
  });
  await provider.sendBatch({
    messages: [
      { to: 'first@example.com', subject: 'First', html: '<p>First</p>' },
      { to: 'second@example.com', subject: 'Second', html: '<p>Second</p>' },
    ],
    idempotencyKey: 'batch-key-1',
  });

  assert.equal(request.url, 'https://api.resend.com/emails/batch');
  assert.equal(request.options.headers['idempotency-key'], 'batch-key-1');
  assert.equal(JSON.parse(request.options.body).length, 2);
  assert.deepEqual(JSON.parse(request.options.body).map(({ to }) => to), [
    ['first@example.com'], ['second@example.com'],
  ]);
});

test('creation and interest confirmations are persisted once and provider failure does not undo writes', async () => {
  const calls = [];
  const emailProvider = { async send(message) {
    calls.push(message);
    if (message.to === 'participant@example.com') throw new EmailProviderError('http_503');
  } };
  const { store, creator, interest, notifications } = fixture(emailProvider);
  const cohort = await creator.create({ ...submission({ minQuorum: 3 }), website: '' }, { clientIp: '192.0.2.1' });
  const accepted = await interest.show(cohort.id, { email: 'participant@example.com' }, { clientIp: '192.0.2.2' });

  assert.equal(store.listCohorts().length, 1);
  assert.equal(store.listInterestsByCohortId(cohort.id).length, 1);
  let deliveries = store.listNotificationDeliveriesByCohortId(cohort.id);
  assert.deepEqual(deliveries.map(({ status }) => status), ['sent', 'failed']);
  assert.equal(deliveries[1].providerErrorCode, 'http_503');
  assert.equal(deliveries[1].attemptCount, 1);

  await notifications.cohortCreated(cohort);
  await notifications.interestAccepted(accepted);
  deliveries = store.listNotificationDeliveriesByCohortId(cohort.id);
  assert.equal(deliveries.length, 2);
  assert.equal(deliveries[1].attemptCount, 2);
  assert.equal(calls.length, 3);
});

test('quorum sends separate participant confirmation and one private delivery per accepted recipient', async () => {
  const calls = [];
  const { store, creator, interest } = fixture({ async send(message) { calls.push(message); } });
  const cohort = await creator.create({ ...submission(), website: '' }, { clientIp: '192.0.2.1' });
  await interest.show(cohort.id, { email: 'one@example.com' }, { clientIp: '192.0.2.2' });
  await interest.show(cohort.id, { email: 'two@example.com' }, { clientIp: '192.0.2.3' });

  const deliveries = store.listNotificationDeliveriesByCohortId(cohort.id);
  assert.equal(deliveries.filter(({ type }) => type === 'creator_confirmation').length, 1);
  assert.equal(deliveries.filter(({ type }) => type === 'participant_confirmation').length, 2);
  assert.equal(deliveries.filter(({ type }) => type === 'quorum_met').length, 3);
  assert.equal(calls.length, 6);
  assert.ok(calls.every(({ to }) => typeof to === 'string'));
  assert.equal(calls.filter(({ to }) => to === 'two@example.com').length, 2);
  for (const call of calls.filter(({ subject }) => subject.startsWith('Quorum reached'))) {
    assert.match(call.html, /meet\.google\.com\/abc-defg-hij/);
    assert.match(call.html, /2026-07-10T18:00/);
  }
});

test('Supabase and Resend adapters recover quorum after accepted email outcome writes fail', async () => {
  const cohortId = '89a31d99-22ef-453f-ab9d-c53be1df8cd0';
  const interestId = 'b10a8e44-c1b6-49d1-a6fa-e6ccf4f2f8ea';
  const timestamp = '2026-06-18T12:00:00.000Z';
  const cohortRow = {
    id: cohortId,
    creator_email: 'creator@example.com',
    title: 'Build a tiny compiler',
    description: 'Work through a tiny compiler implementation together.',
    category: 'build',
    topic: 'Compilers',
    target_audience: 'Developers learning language implementation',
    target_skill_level: 'intermediate',
    additional_details: null,
    min_quorum: 1,
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    creator_time_zone: 'America/Detroit',
    first_meeting_at: '2026-07-10T22:00:00.000Z',
    first_meeting_local: '2026-07-10T18:00',
    meeting_duration_minutes: 60,
    recurrence: 'weekly',
    meeting_count: 2,
    created_at: timestamp,
    updated_at: timestamp,
    expires_at: '2026-06-25T12:00:00.000Z',
    quorum_met_at: timestamp,
  };
  const interestRow = {
    id: interestId, cohort_id: cohortId, email: 'participant@example.com', created_at: timestamp,
  };
  const rows = new Map();
  const failedAcceptancePatches = new Set();
  let deliveryId = 0;

  const supabaseFetch = async (rawUrl, init = {}) => {
    const url = new URL(rawUrl);
    const body = init.body == null ? null : JSON.parse(init.body);
    let status = 200;
    let payload;
    if (url.pathname.endsWith('/rpc/cohort15_lofi_accept_interest')) {
      payload = [{
        interest_id: interestId,
        interest_created_at: timestamp,
        interest_count: 1,
        reached_quorum: true,
        conflict_code: null,
        quorum_met_at: timestamp,
      }];
    } else if (url.pathname.endsWith(`/${TABLES.cohorts}`)) {
      payload = cohortRow;
    } else if (url.pathname.endsWith(`/${TABLES.interests}`)) {
      payload = [interestRow];
    } else if (url.pathname.endsWith(`/${TABLES.notificationDeliveries}`) && init.method === 'POST') {
      if (rows.has(body.idempotency_key)) {
        status = 409;
        payload = { message: 'duplicate delivery' };
      } else {
        const row = {
          ...body,
          id: `delivery-${++deliveryId}`,
        };
        rows.set(row.idempotency_key, row);
        payload = [row];
      }
    } else if (url.pathname.endsWith(`/${TABLES.notificationDeliveries}`) && init.method === 'PATCH') {
      const key = url.searchParams.get('idempotency_key').replace(/^eq\./u, '');
      const row = rows.get(key);
      const shouldFailOnce = body.status === 'sent'
        && (row.type === 'participant_confirmation'
          || (row.type === 'quorum_met' && row.recipient_email === 'creator@example.com'));
      if (shouldFailOnce && !failedAcceptancePatches.has(key)) {
        failedAcceptancePatches.add(key);
        status = 503;
        payload = { message: 'temporary persistence failure' };
      } else {
        Object.assign(row, body);
        payload = [row];
      }
    } else if (url.pathname.endsWith(`/${TABLES.notificationDeliveries}`)) {
      const key = url.searchParams.get('idempotency_key').replace(/^eq\./u, '');
      payload = rows.get(key) ?? null;
      if (!payload) status = 406;
    } else {
      throw new Error(`unexpected Supabase request: ${url.pathname}`);
    }
    return {
      ok: status >= 200 && status < 300,
      status,
      async text() { return JSON.stringify(payload); },
    };
  };

  const resendRequests = [];
  const repositories = createSupabasePostgresRepositories({
    url: 'https://example.supabase.co',
    serviceRoleKey: 'test-service-role-key',
    fetchImpl: supabaseFetch,
    now: () => new Date(timestamp),
    randomUUID: () => `delivery-${deliveryId + 1}`,
  });
  const emailProvider = createResendEmailProvider({
    apiKey: 'test-resend-key',
    fetchImpl: async (url, init) => {
      resendRequests.push({ url, key: init.headers['idempotency-key'] });
      return { ok: true, status: 200 };
    },
  });
  const logs = [];
  const notifications = createNotificationService({
    repositories,
    emailProvider,
    appUrl: 'https://cohort15.com',
    logger: { error(event, details) { logs.push({ event, details }); } },
  });
  const accepted = await repositories.acceptInterest({ cohortId, email: interestRow.email }, {
    id: interestId, now: timestamp,
  });

  assert.equal(accepted.reachedQuorum, true);
  await notifications.interestAccepted(accepted);

  let deliveries = [...rows.values()];
  assert.equal(deliveries.find(({ type }) => type === 'participant_confirmation').status, 'pending');
  assert.equal(deliveries.filter(({ type }) => type === 'quorum_met').length, 2);
  assert.ok(deliveries.filter(({ type }) => type === 'quorum_met').every(({ status }) => status === 'sent'));

  const requestsBeforeRecovery = resendRequests.length;
  await notifications.recoverQuorumNotifications(accepted.cohort);

  deliveries = [...rows.values()];
  assert.ok(deliveries.filter(({ type }) => type === 'quorum_met').every(({ status }) => status === 'sent'));
  assert.equal(resendRequests.length, requestsBeforeRecovery);
  const creatorQuorumKey = deliveries.find(({ type, recipient_email: recipient }) => (
    type === 'quorum_met' && recipient === 'creator@example.com'
  )).idempotency_key;
  const batchRequests = resendRequests.filter(({ url }) => url.endsWith('/emails/batch'));
  assert.equal(batchRequests.length, 2);
  assert.deepEqual(batchRequests.map(({ key }) => key), [
    `quorum_met_batch:${cohortId}`, `quorum_met_batch:${cohortId}`,
  ]);
  assert.ok(!batchRequests.some(({ key }) => key === creatorQuorumKey));
  assert.equal(new Set(deliveries.map(({ idempotency_key: key }) => key)).size, deliveries.length);
  assert.ok(logs.some(({ details }) => details.phase === 'record_provider_acceptance'));
  assert.doesNotMatch(JSON.stringify(logs), /@|meet\.google|test-service|test-resend/u);
});

test('notification infrastructure exceptions never turn an accepted submission into failure', async () => {
  const store = createLofiStore();
  const repositories = createLocalRepositories({ store, now: () => NOW, randomUUID: () => 'cohort-1' });
  const creator = createCohortService({
    repositories,
    limiter: createRollingWindowLimiter({ limit: 1, windowMs: 3_600_000 }),
    notifications: { async cohortCreated() { throw new Error('database unavailable'); } },
  });
  const cohort = await creator.create({ ...submission(), website: '' }, { clientIp: '192.0.2.1' });
  assert.equal(cohort.id, 'cohort-1');
  assert.equal(store.listCohorts().length, 1);
});

test('interest notification exceptions are logged without request or recipient data', async () => {
  const store = createLofiStore();
  let id = 0;
  const repositories = createLocalRepositories({
    store, now: () => NOW, randomUUID: () => `record-${++id}`,
  });
  const cohort = await repositories.createCohort(submission({ minQuorum: 1 }));
  const logs = [];
  const service = createShowInterestService({
    repositories,
    limiter: createRollingWindowLimiter({ limit: 1, windowMs: 3_600_000 }),
    notifications: {
      async interestAccepted() {
        throw new Error('recipient@example.com https://private.example secret-value');
      },
    },
    logger: { error(event, details) { logs.push({ event, details }); } },
  });

  const accepted = await service.show(cohort.id, { email: 'recipient@example.com' }, {
    clientIp: '192.0.2.10',
  });

  assert.equal(accepted.reachedQuorum, true);
  assert.deepEqual(logs, [{
    event: 'notification_processing_failed',
    details: { operation: 'interest_accepted', cohortId: cohort.id },
  }]);
  assert.doesNotMatch(JSON.stringify(logs), /@|192\.0\.2\.10|private\.example|secret-value/u);
});
