import test from 'node:test';
import assert from 'node:assert/strict';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createCohortService, HoneypotSubmissionError } from '../src/services/create-cohort.mjs';
import { createRollingWindowLimiter } from '../src/services/rate-limit.mjs';
import { renderCreateCohortPage } from '../src/ui/create-cohort.mjs';

const NOW = new Date('2026-06-18T12:00:00.000Z');
const config = Object.freeze({ appEnv: 'test', isProduction: false, appUrl: 'http://localhost:3000', googleAnalyticsId: 'G-TEST' });
const actor = Object.freeze({ userId: 'user-1', email: 'creator@example.com' });
const auth = Object.freeze({ user: { id: actor.userId, email: actor.email }, balance: { available: 2 }, csrfToken: 'csrf' });
const sessions = Object.freeze({
  async authenticate() { return auth; },
  verifyCsrf(value, token) { return value === auth && token === 'csrf'; },
});

function validSubmission(overrides = {}) {
  return {
    website: '', title: 'Build a tiny compiler',
    description: 'Work through a tiny compiler implementation together.', category: 'build',
    topic: 'Compilers', targetAudience: 'Developers learning language implementation',
    targetSkillLevel: 'intermediate', additionalDetails: '', minQuorum: '3',
    meetingLink: 'https://meet.google.com/abc-defg-hij', creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2099-06-20T18:30', meetingDurationMinutes: '60',
    recurrence: 'weekly', meetingCount: '4', ...overrides,
  };
}

function invoke(handler, { url = '/', method = 'GET', headers = {}, body = '' } = {}) {
  return new Promise((resolve, reject) => {
    const req = { url, method, headers, socket: { remoteAddress: '127.0.0.1' }, async *[Symbol.asyncIterator]() { if (body) yield Buffer.from(body); } };
    const response = { status: 0, headers: {}, body: '', writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; }, end(value = '') { this.body = String(value); resolve(this); } };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

async function fixture() {
  const store = createLofiStore();
  let id = 0;
  const repositories = createLocalRepositories({ store, now: () => NOW, randomUUID: () => `record-${++id}` });
  await repositories.provisionUser({ supabaseSubject: 'subject-1', email: actor.email }, { id: actor.userId, grantId: 'grant-1', now: NOW });
  return { store, repositories };
}

test('authenticated creation form derives identity, includes CSRF, and explains its two-credit cost', () => {
  const html = renderCreateCohortPage({ auth });
  assert.match(html, /name="csrf" value="csrf"/);
  assert.match(html, /Creating costs <strong>2 credits<\/strong>/);
  assert.match(html, /Confirm and use 2 credits/);
  assert.doesNotMatch(html, /name="creatorEmail"|Private creator email/);
  assert.match(html, /resolvedOptions\(\)\.timeZone/);
  assert.match(html, /data-cohort-preview/);
});

test('funded create service ignores client identity and honeypot consumes no allowance', async () => {
  const { store, repositories } = await fixture();
  const service = createCohortService({ repositories, limiter: createRollingWindowLimiter({ limit: 1, windowMs: 3_600_000 }) });
  await assert.rejects(service.create(validSubmission({ website: 'bot' }), { clientIp: '192.0.2.1', actor }), HoneypotSubmissionError);
  const cohort = await service.create(validSubmission({ creatorEmail: 'attacker@example.com' }), { clientIp: '192.0.2.1', actor });
  assert.equal(cohort.creatorEmail, actor.email);
  assert.equal(cohort.creatorUserId, actor.userId);
  assert.equal((await repositories.getCreditBalance(actor.userId)).available, 0);
  assert.equal(store.listCohorts().length, 1);
});

test('create routes require sign-in and CSRF, then atomically create and hold credits', async () => {
  const { store, repositories } = await fixture();
  const anonymous = createRequestHandler({ config, repositories });
  const redirected = await invoke(anonymous, { url: '/cohorts/new' });
  assert.equal(redirected.status, 303);
  assert.equal(redirected.headers.location, '/auth/sign-in?return_to=%2Fcohorts%2Fnew');
  assert.equal((await invoke(anonymous, { url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'csrf=x' })).status, 401);

  const handler = createRequestHandler({ config, repositories, sessions });
  const invalidCsrf = await invoke(handler, { url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(validSubmission()).toString() });
  assert.equal(invalidCsrf.status, 403);
  const response = await invoke(handler, { url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: config.appUrl }, body: new URLSearchParams({ ...validSubmission(), csrf: 'csrf' }).toString() });
  assert.equal(response.status, 303);
  assert.equal(store.listCohorts().length, 1);
  assert.equal((await repositories.getCreditBalance(actor.userId)).available, 0);
});

test('insufficient creation returns 402 with a Buy credits gate and creates nothing', async () => {
  const { store, repositories } = await fixture();
  await repositories.holdCredits({ userId: actor.userId, amount: 2, idempotencyKey: 'other', source: 'test' });
  const handler = createRequestHandler({ config, repositories, sessions });
  const response = await invoke(handler, { url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...validSubmission(), csrf: 'csrf' }).toString() });
  assert.equal(response.status, 402);
  assert.match(response.body, /Creating a cohort costs 2 credits/);
  assert.match(response.body, /href="\/credits\/buy">Buy credits/);
  assert.equal(store.listCohorts().length, 0);
});

test('creation preserves media, origin, validation, body-size, and rate-limit boundaries', async () => {
  const { repositories } = await fixture();
  const handler = createRequestHandler({ config, repositories, sessions });
  assert.equal((await invoke(handler, { url: '/cohorts', method: 'POST' })).status, 415);
  assert.equal((await invoke(handler, { url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' } })).status, 403);
  assert.equal((await invoke(handler, { url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'content-length': '131073' } })).status, 413);
  const invalid = await invoke(handler, { url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...validSubmission({ firstMeetingLocal: '2026-06-20T18:30' }), csrf: 'csrf' }).toString() });
  assert.equal(invalid.status, 400);
  assert.match(invalid.body, /First meeting date and time must be more than seven days/);
});
