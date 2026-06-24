import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createFeedbackService } from '../src/services/feedback.mjs';
import { createRollingWindowLimiter } from '../src/services/rate-limit.mjs';
import { renderHomePage } from '../src/ui/home.mjs';

const config = Object.freeze({
  appEnv: 'test',
  isProduction: false,
  appUrl: 'http://localhost:3000',
  googleAnalyticsId: 'G-TEST',
});

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

function repositories() {
  return createLocalRepositories({
    store: createLofiStore(),
    now: () => new Date('2026-06-24T12:00:00.000Z'),
    randomUUID: () => 'feedback-record-1',
  });
}

function feedbackInput(overrides = {}) {
  return {
    sessionId: 'session-1',
    path: '/research',
    actionContext: {
      readResearch: true,
      openedCohortRequest: false,
      unknown: true,
    },
    lookingForGroup: 'yes',
    groupIntent: 'both',
    didCreateOrJoin: 'not_yet',
    whyOrWhyNot: 'I want a serious AI learning group but did not find one yet.',
    completionState: 'partial',
    lastStep: 5,
    submittedOnClose: true,
    ...overrides,
  };
}

test('feedback service upserts partial and completed responses by session id', async () => {
  const repo = repositories();
  const service = createFeedbackService({ repositories: repo });

  const partial = await service.submit(feedbackInput({
    contactEmail: '',
    contactX: '',
  }), { clientIp: '192.0.2.1' });
  assert.equal(partial.id, 'feedback-record-1');
  assert.equal(partial.completionState, 'partial');
  assert.equal(partial.submittedOnClose, true);
  assert.deepEqual(partial.actionContext, {
    openedCohortRequest: false,
    startedCohortForm: false,
    submittedCohortRequest: false,
    openedCohortDetail: false,
    submittedInterest: false,
    readResearch: true,
  });

  const completed = await service.submit(feedbackInput({
    completionState: 'completed',
    lastStep: 6,
    submittedOnClose: false,
    contactEmail: ' Founder@example.com ',
    contactX: '@cohort15dotcom',
    contactLinkedin: 'https://www.linkedin.com/in/harsha-gullapalli-4b23451a',
  }), { clientIp: '192.0.2.1' });

  assert.equal(completed.id, partial.id);
  assert.equal(completed.contactEmail, 'founder@example.com');
  assert.equal(completed.completionState, 'completed');
  assert.equal(completed.lastStep, 6);
  assert.ok(completed.completedAt);
  assert.equal((await repo.listFeedback()).length, 1);
});

test('feedback service rejects unsafe paths, invalid enums, malformed context, and rate limits', async () => {
  const repo = repositories();
  const service = createFeedbackService({
    repositories: repo,
    limiter: createRollingWindowLimiter({ limit: 1, windowMs: 60_000 }),
  });

  await assert.rejects(
    service.submit(feedbackInput({ path: 'https://evil.example' })),
    (error) => error.field === 'path',
  );
  await assert.rejects(
    service.submit(feedbackInput({ lookingForGroup: 'maybe' })),
    (error) => error.field === 'lookingForGroup',
  );
  await assert.rejects(
    service.submit(feedbackInput({ actionContext: '{bad json' })),
    (error) => error.field === 'actionContext',
  );

  await service.submit(feedbackInput({ sessionId: 'allowed' }), { clientIp: '192.0.2.2' });
  await assert.rejects(
    service.submit(feedbackInput({ sessionId: 'blocked' }), { clientIp: '192.0.2.2' }),
    (error) => error.name === 'RateLimitExceededError',
  );
});

test('POST /feedback saves private feedback and returns JSON only', async () => {
  const repo = repositories();
  const handler = createRequestHandler({ config, repositories: repo });
  const body = JSON.stringify(feedbackInput({
    contactEmail: 'person@example.com',
    contactOther: 'discord person',
  }));

  const saved = await invoke(handler, {
    url: '/feedback',
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: config.appUrl },
    body,
  });
  assert.equal(saved.status, 200);
  assert.deepEqual(JSON.parse(saved.body), {
    ok: true,
    id: 'feedback-record-1',
    completionState: 'partial',
  });
  const [record] = await repo.listFeedback();
  assert.equal(record.contactEmail, 'person@example.com');
  assert.equal(record.contactOther, 'discord person');

  const home = await invoke(handler, { url: '/' });
  assert.equal(home.status, 200);
  assert.match(home.body, /Help shape Cohort15/);
  assert.doesNotMatch(home.body, /person@example\.com|discord person/);
});

test('POST /feedback enforces media type, origin, body size, JSON, and validation policy', async () => {
  const handler = createRequestHandler({ config, repositories: repositories() });
  assert.equal((await invoke(handler, {
    url: '/feedback', method: 'POST', body: '{}',
  })).status, 415);
  assert.equal((await invoke(handler, {
    url: '/feedback', method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: '{}',
  })).status, 403);
  assert.equal((await invoke(handler, {
    url: '/feedback', method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': '32769' },
    body: '{}',
  })).status, 413);
  assert.equal((await invoke(handler, {
    url: '/feedback', method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{bad',
  })).status, 400);
  const invalid = await invoke(handler, {
    url: '/feedback', method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(feedbackInput({ lookingForGroup: 'maybe' })),
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(JSON.parse(invalid.body), {
    ok: false,
    error: 'validation_error',
    field: 'lookingForGroup',
  });
});

test('feedback widget renders founder icon links and mobile-friendly controls', () => {
  const html = renderHomePage({ googleAnalyticsId: 'G-TEST' });
  assert.match(html, /data-feedback-widget/);
  assert.match(html, /data-feedback-open aria-expanded="false"/);
  assert.match(html, /<input type="radio" name="lookingForGroup" value="yes"> Yes/);
  assert.match(html, /<input type="radio" name="lookingForGroup" value="no"> No/);
  assert.doesNotMatch(html, /value="not_sure"|Send feedback/);
  assert.match(html, /href="https:\/\/x\.com\/cohort15dotcom"/);
  assert.match(html, /href="https:\/\/www\.linkedin\.com\/in\/harsha-gullapalli-4b23451a"/);
  assert.match(html, /href="mailto:cohort15dotcom@gmail\.com"/);
  assert.match(html, /Founder’s socials/);
  assert.match(html, /I’m Harsha, the founder of Cohort15/);
  assert.match(html, /Reach me directly/);
  assert.match(html, /One is enough\. Use whatever feels easiest\./);
  assert.match(html, /data-feedback-step-5-title>How was the experience\?/);
  assert.match(html, /What felt clear, confusing, useful, or missing\?/);
  assert.match(html, /What got in the way\?/);
  assert.match(html, /Timing, unclear fit, missing group, form friction, or anything else\./);
  assert.match(html, /fetch\('\/feedback'/);
  assert.match(html, /keepalive: closing/);
  assert.match(html, /scheduleAutoSave/);
  assert.match(html, /setTimeout\(\(\) => \{/);
  assert.match(html, /cohort15\.feedback\.opened-session\.v1/);
  assert.match(html, /cohort15\.feedback\.dismissed-session\.v1/);
  assert.match(html, /setTimeout\(autoOpen, 25000\)/);
  assert.match(html, /setTimeout\(autoOpen, 500\)/);
  assert.match(html, /location\.pathname\.startsWith\('\/research'\)/);
  assert.match(html, /location\.pathname === '\/cohorts\/new'/);
  assert.match(html, /location\.pathname\.startsWith\('\/cohorts\/'\)/);
  assert.match(html, /clearBranchValues/);
  assert.match(html, /setTimeout\(\(\) => \{ closePanel\(\); \}, 1200\)/);
  assert.doesNotMatch(html, /https:\/\/www\.linkedin\.com\/in\/harsha-gullapalli-4b23451a[^"]*<\/a>/);
  assert.equal((html.match(/We’re building Cohort15/g) ?? []).length, 1);
});
