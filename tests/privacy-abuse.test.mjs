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
  resendApiKey: 're_test_secret_value',
  supabaseServiceRoleKey: 'supabase-secret-value',
});

function createInput(overrides = {}) {
  return {
    website: '', creatorEmail: 'private-creator@example.com', title: 'Privacy launch gate',
    description: 'Verify that launch privacy boundaries hold across public routes.',
    category: 'build', topic: 'Privacy', targetAudience: 'Privacy-conscious builders',
    targetSkillLevel: 'any', additionalDetails: '', minQuorum: '2',
    meetingLink: 'https://meet.google.com/private-pre-quorum-link',
    creatorTimeZone: 'UTC', firstMeetingLocal: '2099-01-10T12:00',
    meetingDurationMinutes: '60', recurrence: 'none', meetingCount: '1',
    ...overrides,
  };
}

function invoke(handler, {
  url = '/', method = 'GET', headers = {}, body = '', remoteAddress = '203.0.113.44',
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

function form(handler, url, values, headers = {}) {
  return invoke(handler, {
    url, method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
    body: new URLSearchParams(values).toString(),
  });
}

test('honeypots, request guards, public responses, and logs preserve private values', async () => {
  const store = createLofiStore();
  let id = 0;
  const repositories = createLocalRepositories({ store, randomUUID: () => `private-${++id}` });
  const sent = [];
  const handler = createRequestHandler({
    config,
    repositories,
    emailProvider: { async send(message) { sent.push(message); } },
  });
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...values) => logs.push(values.join(' '));
  console.error = (...values) => logs.push(values.join(' '));

  try {
    assert.equal((await form(handler, '/cohorts', createInput({ website: 'bot-value' }))).status, 400);
    assert.equal(store.listCohorts().length, 0);
    assert.equal(sent.length, 0);

    assert.equal((await invoke(handler, {
      url: '/cohorts', method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'private-creator@example.com',
    })).status, 415);
    assert.equal((await form(handler, '/cohorts', createInput(), { origin: 'https://evil.example' })).status, 403);
    assert.equal((await form(handler, '/cohorts', createInput(), { 'content-length': '65537' })).status, 413);

    const created = await form(handler, '/cohorts', createInput());
    assert.equal(created.status, 303);
    assert.equal(created.headers.location, '/cohorts/private-1');

    assert.equal((await form(handler, '/cohorts/private-1/interests', {
      email: 'private-participant@example.com', website: 'bot-value',
    })).status, 400);
    assert.equal(store.listInterestsByCohortId('private-1').length, 0);
    assert.equal(sent.length, 1);

    const publicResponses = await Promise.all([
      invoke(handler, { url: '/' }),
      invoke(handler, { url: '/cohorts/private-1' }),
      form(handler, '/cohorts/private-1/interests', { email: 'invalid-private-email', website: '' }),
    ]);
    assert.equal(publicResponses[2].status, 400);
    const publicText = publicResponses.map(({ body, headers }) => `${JSON.stringify(headers)} ${body}`).join('\n');
    assert.doesNotMatch(publicText, /private-creator@example\.com|private-participant@example\.com/);
    assert.doesNotMatch(publicText, /203\.0\.113\.44|re_test_secret_value|supabase-secret-value/);
    assert.doesNotMatch(publicText, /private-pre-quorum-link|invalid-private-email/);
    assert.doesNotMatch(logs.join('\n'), /private-creator|private-participant|203\.0\.113\.44|secret|private-pre-quorum-link/);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
});

test('deferred product routes and mutations remain absent', async () => {
  const handler = createRequestHandler({ config });
  const absentPaths = [
    '/auth/sign-in', '/auth/callback', '/dashboard', '/credits', '/credits/buy',
    '/payments', '/stripe/webhook', '/admin', '/admin/expire-cohorts', '/images',
    '/uploads', '/social', '/social/publish', '/cohorts/private-1/edit',
  ];
  for (const url of absentPaths) {
    for (const method of ['GET', 'POST']) {
      const response = await invoke(handler, { url, method });
      assert.equal(response.status, 404, `${method} ${url} should remain absent`);
    }
  }
});
