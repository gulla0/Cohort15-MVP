import test from 'node:test';
import assert from 'node:assert/strict';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createEventBrowsingService } from '../src/services/event-browsing.mjs';
import { renderCohortDetailPage } from '../src/ui/cohorts.mjs';

const NOW = new Date('2026-06-18T12:00:00.000Z');
const config = Object.freeze({ appEnv: 'test', appUrl: 'http://localhost:3000', googleAnalyticsId: 'G-LF22TLDSBV' });

function cohort(overrides = {}) {
  return {
    creatorEmail: 'private@example.com', title: 'A safe <cohort>', description: 'Build something useful together.',
    category: 'build', topic: 'Compilers', targetAudience: 'Curious developers', targetSkillLevel: 'intermediate',
    minQuorum: 3, meetingLink: 'https://meet.google.com/abc-defg-hij', creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-07-10T18:00', meetingDurationMinutes: 60,
    recurrence: 'weekly', meetingCount: 2,
    ...overrides,
  };
}

function invoke(handler, url = '/') {
  return new Promise((resolve, reject) => {
    const req = { url, method: 'GET', headers: {} };
    const response = { status: 0, headers: {}, body: '', writeHead(status, headers) { this.status = status; this.headers = headers; }, end(body = '') { this.body = String(body); resolve(this); } };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

async function fixture() {
  const repositories = createLocalRepositories({ store: createLofiStore(), now: () => NOW, randomUUID: () => 'unused' });
  await repositories.createCohort(cohort({ title: 'Older active <test>' }), { id: 'b-active', now: new Date('2026-06-17T12:00:00.000Z') });
  await repositories.createCohort(cohort({ title: 'Newer active' }), { id: 'a-active', now: new Date('2026-06-18T12:00:00.000Z') });
  await repositories.createCohort(cohort({ title: 'Expired' }), { id: 'expired', now: new Date('2026-06-01T12:00:00.000Z') });
  return repositories;
}

test('browsing normalizes filters and preserves active-first repository ordering', async () => {
  const service = createEventBrowsingService({ repositories: await fixture() });
  assert.deepEqual((await service.list()).cohorts.map(({ id }) => id), ['a-active', 'b-active', 'expired']);
  assert.deepEqual((await service.list({ status: 'expired' })).cohorts.map(({ id }) => id), ['expired']);
  const invalid = await service.list({ status: 'unknown' });
  assert.equal(invalid.status, 'all');
  assert.equal(invalid.cohorts.length, 3);
});

test('home and detail routes render public lifecycle data, local-time hooks, and no private values', async () => {
  const repositories = await fixture();
  const handler = createRequestHandler({ config, repositories });
  const home = await invoke(handler, '/?status=active');
  assert.equal(home.status, 200);
  assert.match(home.body, /G-LF22TLDSBV/);
  assert.match(home.body, /aria-current="page">Active/);
  assert.match(home.body, /data-local-time/);
  assert.match(home.body, /3 more needed/);
  assert.doesNotMatch(home.body, /private@example\.com|meet\.google\.com/);
  assert.ok(home.body.indexOf('Newer active') < home.body.indexOf('Older active'));
  assert.doesNotMatch(home.body, /href="\/cohorts\/expired"/);

  const detail = await invoke(handler, '/cohorts/b-active');
  assert.equal(detail.status, 200);
  assert.match(detail.body, /Older active &lt;test&gt;/);
  assert.match(detail.body, /Times are shown in your local timezone/);
  assert.match(detail.body, /Duration<\/dt><dd>60 minutes/);
  assert.doesNotMatch(detail.body, /private@example\.com|meet\.google\.com/);
  assert.equal((await invoke(handler, '/cohorts')).status, 302);
  assert.equal((await invoke(handler, '/cohorts/missing')).status, 404);
});

test('detail exposes the meeting link only after quorum and before the final meeting ends', () => {
  const { meetingLink, ...publicFields } = cohort();
  const base = { ...publicFields, firstMeetingAt: '2026-07-10T22:00:00.000Z', createdAt: NOW.toISOString(), expiresAt: '2026-06-25T12:00:00.000Z', id: 'met', updatedAt: NOW.toISOString(), interestCount: 3, collectionStatus: 'expired', quorumStatus: 'met', quorumMetAt: NOW.toISOString(), finalMeetingEndsAt: '2026-07-17T23:00:00.000Z' };
  assert.match(renderCohortDetailPage({ ...base, meetingLink }), /meet\.google\.com/);
  assert.doesNotMatch(renderCohortDetailPage(base), /meet\.google\.com/);
});
