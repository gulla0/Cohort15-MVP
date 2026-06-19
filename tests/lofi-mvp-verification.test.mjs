import test from 'node:test';
import assert from 'node:assert/strict';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const config = Object.freeze({
  appEnv: 'test',
  isProduction: false,
  appUrl: 'http://localhost:3000',
  googleAnalyticsId: 'G-TEST',
});

function submission(overrides = {}) {
  return {
    website: '',
    creatorEmail: ' Creator@Example.COM ',
    title: 'Build a launch-ready compiler',
    description: 'Build and test a small compiler with a focused peer cohort.',
    category: 'build',
    topic: 'Compilers',
    targetAudience: 'Developers learning language implementation',
    targetSkillLevel: 'intermediate',
    additionalDetails: 'Bring a small parser idea.',
    minQuorum: '2',
    meetingLink: 'https://meet.google.com/launch-gate-room',
    creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-06-27T18:00',
    meetingDurationMinutes: '60',
    recurrence: 'none',
    meetingCount: '1',
    ...overrides,
  };
}

function invoke(handler, {
  url = '/', method = 'GET', headers = {}, body = '', remoteAddress = '127.0.0.1',
} = {}) {
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

function postForm(handler, url, values, headers = {}) {
  return invoke(handler, {
    url,
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(values).toString(),
    remoteAddress: '192.0.2.20',
  });
}

test('complete anonymous flow creates, browses, filters, reaches quorum, expires, and hides the ended link', async () => {
  let now = new Date('2026-06-18T12:00:00.000Z');
  let id = 0;
  const store = createLofiStore();
  const repositories = createLocalRepositories({
    store,
    now: () => now,
    randomUUID: () => `record-${++id}`,
  });
  const sent = [];
  const handler = createRequestHandler({
    config,
    repositories,
    emailProvider: { async send(message) { sent.push(message); } },
  });

  const created = await postForm(handler, '/cohorts', submission());
  assert.equal(created.status, 303);
  assert.equal(created.headers.location, '/cohorts/record-1');

  const home = await invoke(handler, { url: '/' });
  assert.equal(home.status, 200);
  assert.match(home.body, /Build a launch-ready compiler/);
  assert.match(home.body, /data-local-time/);
  assert.match(home.body, /shown in your local timezone/i);
  assert.doesNotMatch(home.body, /creator@example\.com|launch-gate-room/);
  assert.doesNotMatch((await invoke(handler, { url: '/?status=expired' })).body, /Build a launch-ready compiler/);
  assert.match((await invoke(handler, { url: '/?status=active' })).body, /Build a launch-ready compiler/);

  const creatorAttempt = await postForm(handler, '/cohorts/record-1/interests', {
    email: 'creator@example.com', website: '',
  });
  assert.equal(creatorAttempt.status, 409);

  const first = await postForm(handler, '/cohorts/record-1/interests', {
    email: ' Person@Example.com ', website: '',
  });
  assert.equal(first.status, 303);
  assert.equal((await postForm(handler, '/cohorts/record-1/interests', {
    email: 'person@example.com', website: '',
  })).status, 409);

  const beforeQuorum = await invoke(handler, { url: '/cohorts/record-1' });
  assert.doesNotMatch(beforeQuorum.body, /launch-gate-room|person@example\.com/);

  const second = await postForm(handler, '/cohorts/record-1/interests', {
    email: 'second@example.com', website: '',
  });
  assert.equal(second.status, 303);
  const atQuorum = await invoke(handler, { url: '/cohorts/record-1' });
  assert.match(atQuorum.body, /Open meeting link/);
  assert.match(atQuorum.body, /launch-gate-room/);
  assert.doesNotMatch(atQuorum.body, /creator@example\.com|person@example\.com|second@example\.com/);

  now = new Date('2026-06-25T12:00:00.000Z');
  const expired = await invoke(handler, { url: '/?status=expired' });
  assert.match(expired.body, /Build a launch-ready compiler/);
  assert.match(expired.body, /Expired/);
  const expiredDetail = await invoke(handler, { url: '/cohorts/record-1' });
  assert.match(expiredDetail.body, /launch-gate-room/);

  now = new Date('2026-06-27T23:00:00.000Z');
  const afterFinalMeeting = await invoke(handler, { url: '/cohorts/record-1' });
  assert.match(afterFinalMeeting.body, /Build a launch-ready compiler/);
  assert.doesNotMatch(afterFinalMeeting.body, /Open meeting link|launch-gate-room/);

  assert.equal(store.listCohorts().length, 1);
  assert.equal(store.listInterestsByCohortId('record-1').length, 2);
  assert.equal(sent.length, 6);
  assert.equal(new Set(sent.map(({ idempotencyKey }) => idempotencyKey)).size, sent.length);
});
