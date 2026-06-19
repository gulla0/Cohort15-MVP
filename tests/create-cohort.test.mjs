import test from 'node:test';
import assert from 'node:assert/strict';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createCohortService, HoneypotSubmissionError } from '../src/services/create-cohort.mjs';
import { createRollingWindowLimiter } from '../src/services/rate-limit.mjs';
import { renderCreateCohortPage } from '../src/ui/create-cohort.mjs';

const config = Object.freeze({
  appEnv: 'test',
  isProduction: false,
  appUrl: 'http://localhost:3000',
  googleAnalyticsId: 'G-TEST',
});

function validSubmission(overrides = {}) {
  return {
    website: '',
    creatorEmail: ' Creator@Example.COM ',
    title: 'Build a tiny compiler',
    description: 'Work through a tiny compiler implementation together.',
    category: 'build',
    topic: 'Compilers',
    targetAudience: 'Developers learning language implementation',
    targetSkillLevel: 'intermediate',
    additionalDetails: '',
    minQuorum: '3',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2099-06-20T18:30',
    meetingDurationMinutes: '60',
    recurrence: 'weekly',
    meetingCount: '4',
    ...overrides,
  };
}

function invoke(handler, {
  url = '/', method = 'GET', headers = {}, body = '', remoteAddress = '127.0.0.1',
} = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      url,
      method,
      headers,
      socket: { remoteAddress },
      async *[Symbol.asyncIterator]() { if (body) yield Buffer.from(body); },
    };
    const response = {
      status: undefined,
      headers: undefined,
      body: '',
      writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; },
      end(value = '') { this.body = String(value); resolve(this); },
    };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

test('creation page contains the exact anonymous form surface and timezone capture', () => {
  const html = renderCreateCohortPage();
  for (const field of [
    'creatorEmail', 'title', 'description', 'category', 'topic', 'targetAudience',
    'targetSkillLevel', 'additionalDetails', 'minQuorum', 'meetingLink',
    'creatorTimeZone', 'firstMeetingLocal', 'meetingDurationMinutes', 'recurrence',
    'meetingCount', 'website',
  ]) assert.match(html, new RegExp(`name="${field}"`));
  assert.match(html, /email stays private/i);
  assert.match(html, /For safety/);
  assert.match(html, /resolvedOptions\(\)\.timeZone/);
  assert.match(html, /placeholder="A short, specific name for the cohort"/);
  assert.match(html, /placeholder="Explain what the group will work on and what participants can expect"/);
  assert.match(html, /placeholder="People needed to unlock the meeting link \(1–15\)"/);
  assert.match(html, /querySelectorAll\('\[placeholder\]'\)/);
  assert.match(html, /addEventListener\('focus'/);
  assert.match(html, /field\.placeholder = ''/);
  assert.match(html, /Date\.now\(\) \+ \(7 \* 24 \* 60 \* 60 \* 1000\)/);
  assert.match(html, /firstMeetingInput\.min =/);
  assert.match(html, /setInterval\(updateMeetingMinimum, 30 \* 1000\)/);
  assert.doesNotMatch(html, /creatorName|maximumParticipants|type="file"/);
});

test('creation page explains validation errors and safely restores submitted values', () => {
  const html = renderCreateCohortPage({
    error: {
      field: 'firstMeetingLocal',
      message: 'First meeting date and time must be more than seven days after submission.',
    },
    values: {
      creatorEmail: 'creator@example.com',
      title: '<Launch test>',
      description: 'A description worth preserving after an error.',
      category: 'build',
      targetSkillLevel: 'intermediate',
      firstMeetingLocal: '2026-06-20T18:30',
      recurrence: 'weekly',
      meetingCount: '4',
      website: 'do-not-reflect',
    },
  });

  assert.match(html, /First meeting date and time must be more than seven days after submission\./);
  assert.match(html, /value="creator@example\.com"/);
  assert.match(html, /value="&lt;Launch test&gt;"/);
  assert.match(html, /A description worth preserving after an error\./);
  assert.match(html, /value="build" selected/);
  assert.match(html, /value="intermediate" selected/);
  assert.match(html, /name="firstMeetingLocal"[^>]+value="2026-06-20T18:30"[^>]+aria-invalid="true"/);
  assert.match(html, /value="weekly" selected/);
  assert.match(html, /name="meetingCount"[^>]+value="4"/);
  assert.doesNotMatch(html, /do-not-reflect/);
});

test('create service normalizes private email and honeypot consumes no allowance', async () => {
  const store = createLofiStore();
  const repositories = createLocalRepositories({
    store,
    now: () => new Date('2026-06-18T12:00:00.000Z'),
    randomUUID: () => 'cohort-1',
  });
  const limiter = createRollingWindowLimiter({ limit: 1, windowMs: 3_600_000 });
  const service = createCohortService({ repositories, limiter });

  await assert.rejects(
    service.create(validSubmission({ website: 'bot' }), { clientIp: '192.0.2.1' }),
    HoneypotSubmissionError,
  );
  const cohort = await service.create(validSubmission(), { clientIp: '192.0.2.1' });
  assert.equal(cohort.creatorEmail, 'creator@example.com');
  assert.equal(cohort.firstMeetingAt, '2099-06-20T22:30:00.000Z');
  assert.equal(store.listCohorts().length, 1);
});

test('POST /cohorts enforces request policy and redirects without private data', async () => {
  const store = createLofiStore();
  let id = 0;
  const repositories = createLocalRepositories({
    store,
    now: () => new Date('2026-06-18T12:00:00.000Z'),
    randomUUID: () => `cohort-${++id}`,
  });
  const handler = createRequestHandler({ config, repositories });
  const encoded = new URLSearchParams(validSubmission()).toString();

  assert.equal((await invoke(handler, { url: '/cohorts/new' })).status, 200);
  assert.equal((await invoke(handler, { url: '/cohorts', method: 'POST' })).status, 415);
  assert.equal((await invoke(handler, {
    url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' }, body: encoded,
  })).status, 403);
  assert.equal((await invoke(handler, {
    url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'content-length': '65537' }, body: encoded,
  })).status, 413);

  const response = await invoke(handler, {
    url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8', origin: config.appUrl }, body: encoded,
  });
  assert.equal(response.status, 303);
  assert.equal(response.headers.location, '/cohorts/cohort-1');
  assert.doesNotMatch(response.headers.location, /creator|example/i);
  assert.equal(store.listCohorts().length, 1);

  const invalid = await invoke(handler, {
    url: '/cohorts',
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8', origin: config.appUrl },
    body: new URLSearchParams(validSubmission({
      title: 'Keep this title',
      firstMeetingLocal: '2026-06-20T18:30',
    })).toString(),
  });
  assert.equal(invalid.status, 400);
  assert.match(invalid.body, /First meeting date and time must be more than seven days after submission\./);
  assert.match(invalid.body, /value="Keep this title"/);
  assert.match(invalid.body, /value=" Creator@Example\.COM "/);
  assert.equal(store.listCohorts().length, 1);
});

test('sixth successful creation returns 429 with Retry-After', async () => {
  const store = createLofiStore();
  let id = 0;
  const repositories = createLocalRepositories({ store, randomUUID: () => `cohort-${++id}` });
  const handler = createRequestHandler({ config, repositories });
  const encoded = new URLSearchParams(validSubmission()).toString();
  const request = () => invoke(handler, {
    url: '/cohorts', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: encoded,
  });
  for (let attempt = 0; attempt < 5; attempt += 1) assert.equal((await request()).status, 303);
  const rejected = await request();
  assert.equal(rejected.status, 429);
  assert.ok(Number(rejected.headers['retry-after']) >= 1);
  assert.equal(store.listCohorts().length, 5);
});
