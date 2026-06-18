import test from 'node:test';
import assert from 'node:assert/strict';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createRollingWindowLimiter } from '../src/services/rate-limit.mjs';
import {
  createShowInterestService, InterestHoneypotSubmissionError,
} from '../src/services/show-interest.mjs';
import { renderCohortDetailPage } from '../src/ui/cohorts.mjs';

const NOW = new Date('2026-06-18T12:00:00.000Z');
const config = Object.freeze({
  appEnv: 'test', isProduction: false, appUrl: 'http://localhost:3000', googleAnalyticsId: 'G-TEST',
});

function cohort(overrides = {}) {
  return {
    creatorEmail: 'creator@example.com', title: 'Build a tiny compiler',
    description: 'Work through a tiny compiler implementation together.', category: 'build',
    topic: 'Compilers', targetAudience: 'Developers learning language implementation',
    targetSkillLevel: 'intermediate', minQuorum: 3,
    meetingLink: 'https://meet.google.com/abc-defg-hij', creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-07-10T18:00', meetingDurationMinutes: 60,
    recurrence: 'weekly', meetingCount: 2, ...overrides,
  };
}

function invoke(handler, {
  url, method = 'GET', headers = {}, body = '', remoteAddress = '127.0.0.1',
}) {
  return new Promise((resolve, reject) => {
    const req = {
      url, method, headers, socket: { remoteAddress },
      async *[Symbol.asyncIterator]() { if (body) yield Buffer.from(body); },
    };
    const response = {
      status: 0, headers: {}, body: '',
      writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; },
      end(value = '') { this.body = String(value); resolve(this); },
    };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

async function fixture({ minQuorum = 3, createdAt = NOW } = {}) {
  const store = createLofiStore();
  let id = 0;
  const repositories = createLocalRepositories({
    store, now: () => NOW, randomUUID: () => `record-${++id}`,
  });
  await repositories.createCohort(cohort({ minQuorum }), { id: 'cohort-1', now: createdAt });
  return { store, repositories };
}

test('interest service normalizes email and rejected writes consume no allowance', async () => {
  const { store, repositories } = await fixture();
  const service = createShowInterestService({
    repositories, limiter: createRollingWindowLimiter({ limit: 1, windowMs: 3_600_000 }),
  });

  await assert.rejects(
    service.show('cohort-1', { email: 'person@example.com', website: 'bot' }, { clientIp: '192.0.2.1' }),
    InterestHoneypotSubmissionError,
  );
  await assert.rejects(
    service.show('cohort-1', { email: ' Creator@Example.com ', website: '' }, { clientIp: '192.0.2.1' }),
    (error) => error.code === 'creator_email',
  );
  const accepted = await service.show(
    'cohort-1', { email: ' Person@Example.COM ', website: '' }, { clientIp: '192.0.2.1' },
  );
  assert.equal(accepted.interest.email, 'person@example.com');
  assert.equal(store.listInterestsByCohortId('cohort-1').length, 1);
});

test('one concurrent accepted interest reaches quorum and unlocks the public link immediately', async () => {
  const { repositories } = await fixture({ minQuorum: 2 });
  const service = createShowInterestService({
    repositories, limiter: createRollingWindowLimiter({ limit: 10, windowMs: 3_600_000 }),
  });
  const results = await Promise.all([
    service.show('cohort-1', { email: 'one@example.com' }, { clientIp: '192.0.2.1' }),
    service.show('cohort-1', { email: 'two@example.com' }, { clientIp: '192.0.2.2' }),
  ]);
  assert.equal(results.filter(({ reachedQuorum }) => reachedQuorum).length, 1);

  const publicCohort = await repositories.getPublicCohortById('cohort-1', { now: NOW });
  assert.equal(publicCohort.interestCount, 2);
  assert.equal(publicCohort.quorumStatus, 'met');
  assert.equal(publicCohort.meetingLink, 'https://meet.google.com/abc-defg-hij');
  const html = renderCohortDetailPage(publicCohort);
  assert.match(html, /Open meeting link/);
  assert.doesNotMatch(html, /name="email"|one@example|two@example/);
});

test('detail form appears only while collection is active and gathering', async () => {
  const { repositories } = await fixture();
  const active = await repositories.getPublicCohortById('cohort-1', { now: NOW });
  const html = renderCohortDetailPage(active);
  assert.match(html, /name="email"/);
  assert.match(html, /name="website"/);
  assert.match(html, /email stays private/i);

  const expired = await repositories.getPublicCohortById('cohort-1', { now: new Date('2026-06-26T12:00:00.000Z') });
  assert.doesNotMatch(renderCohortDetailPage(expired), /name="email"/);
});

test('POST interest enforces policy, conflicts safely, and redirects without private data', async () => {
  const { store, repositories } = await fixture({ minQuorum: 2 });
  const handler = createRequestHandler({ config, repositories });
  const post = (values, headers = { 'content-type': 'application/x-www-form-urlencoded' }) => invoke(handler, {
    url: '/cohorts/cohort-1/interests', method: 'POST', headers,
    body: new URLSearchParams(values).toString(),
  });

  assert.equal((await post({ email: 'person@example.com' }, {})).status, 415);
  assert.equal((await post({ email: 'person@example.com' }, {
    'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example',
  })).status, 403);
  assert.equal((await post({ email: 'person@example.com' }, {
    'content-type': 'application/x-www-form-urlencoded', 'content-length': '65537',
  })).status, 413);
  const invalid = await post({ email: 'not-an-email' });
  assert.equal(invalid.status, 400);
  assert.doesNotMatch(invalid.body, /not-an-email/);
  assert.equal((await post({ email: 'creator@example.com' })).status, 409);

  const accepted = await post({ email: ' Person@Example.COM ' });
  assert.equal(accepted.status, 303);
  assert.equal(accepted.headers.location, '/cohorts/cohort-1');
  assert.doesNotMatch(accepted.headers.location, /person|example/i);
  assert.equal((await post({ email: 'person@example.com' })).status, 409);
  assert.equal((await post({ email: 'second@example.com' })).status, 303);
  assert.equal((await post({ email: 'third@example.com' })).status, 409);
  assert.equal(store.listInterestsByCohortId('cohort-1').length, 2);

  const detail = await invoke(handler, { url: '/cohorts/cohort-1' });
  assert.match(detail.body, /Open meeting link/);
  assert.doesNotMatch(detail.body, /name="email"|person@example|second@example/);
  assert.equal((await post({ email: 'nobody@example.com' }, {
    'content-type': 'application/x-www-form-urlencoded', origin: config.appUrl,
  })).status, 409);
  assert.equal((await invoke(handler, {
    url: '/cohorts/missing/interests', method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=a%40b.com',
  })).status, 404);
});

test('eleventh successful interest from one IP returns 429 with Retry-After', async () => {
  const { store, repositories } = await fixture({ minQuorum: 15 });
  const handler = createRequestHandler({ config, repositories });
  const request = (attempt) => invoke(handler, {
    url: '/cohorts/cohort-1/interests', method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: `person-${attempt}@example.com` }).toString(),
  });
  for (let attempt = 0; attempt < 10; attempt += 1) assert.equal((await request(attempt)).status, 303);
  const rejected = await request(10);
  assert.equal(rejected.status, 429);
  assert.ok(Number(rejected.headers['retry-after']) >= 1);
  assert.equal(store.listInterestsByCohortId('cohort-1').length, 10);
});
