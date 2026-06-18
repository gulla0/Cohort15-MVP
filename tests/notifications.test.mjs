import test from 'node:test';
import assert from 'node:assert/strict';

import { createResendEmailProvider, EmailProviderError } from '../src/email/resend.mjs';
import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
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
  assert.equal(calls.length, 2);
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
