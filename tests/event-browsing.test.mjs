import test from 'node:test';
import assert from 'node:assert/strict';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createEventBrowsingService } from '../src/services/event-browsing.mjs';
import { renderCohortCard, renderCohortDetailPage } from '../src/ui/cohorts.mjs';

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
  assert.match(home.body, /Your local time:/);
  assert.match(home.body, /weekday: 'short'/);
  assert.match(home.body, /timeZoneName: 'long'/);
  assert.doesNotMatch(home.body, /dateStyle|timeStyle/);
  assert.match(home.body, /3 more needed/);
  assert.doesNotMatch(home.body, /private@example\.com|meet\.google\.com/);
  assert.ok(home.body.indexOf('Newer active') < home.body.indexOf('Older active'));
  assert.doesNotMatch(home.body, /href="\/cohorts\/expired"/);

  const detail = await invoke(handler, '/cohorts/b-active');
  assert.equal(detail.status, 200);
  assert.match(detail.body, /googletagmanager\.com\/gtag\/js\?id=G-LF22TLDSBV/);
  assert.match(detail.body, /Older active &lt;test&gt;/);
  assert.match(detail.body, /Times are converted by your browser and shown in your local timezone/);
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

test('cards summarize long formatted descriptions for scanning', () => {
  const html = renderCohortCard({
    ...cohort({
      id: 'summary',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
      expiresAt: '2026-06-25T12:00:00.000Z',
      firstMeetingAt: '2026-07-10T22:00:00.000Z',
      interestCount: 0,
      collectionStatus: 'active',
      quorumStatus: 'gathering',
      quorumMetAt: null,
      finalMeetingEndsAt: '2026-07-17T23:00:00.000Z',
      description: `This is a serious request for aligned people.

1. Technical co-founder candidate
   Someone who can handle product-quality implementation.

2. Marketing / growth co-founder candidate
   Someone strong at early-stage positioning.

Before joining, self-qualify honestly:

* Do I care about the mission?
* Can I commit meaningful time?

Working chemistry matters and the full request continues with more context.`,
    }),
  });

  assert.match(html, /class="cohort-card-summary"/);
  assert.match(html, /<p>This is a serious request for aligned people\.<\/p>/);
  assert.match(html, /<ol><li>Technical co-founder candidate<br>Someone who can handle product-quality implementation\.<\/li><\/ol>/);
  assert.match(html, /<ol start="2"><li>Marketing \/ growth co-founder candidate<br>Someone strong at early-stage positioning\.<\/li><\/ol>/);
  assert.match(html, /<ul><li>Do I care about the mission\?<\/li><li>Can I commit meaningful time\?<\/li><\/ul>/);
  assert.match(html, /Full request continues on the detail page\./);
  assert.doesNotMatch(html, /Working chemistry matters/);
});

test('detail page organizes long text into escaped paragraphs and lists', () => {
  const html = renderCohortDetailPage({
    ...cohort({
      description: `This is a serious request for aligned people.

1. Technical co-founder candidate
   Someone who can handle product-quality implementation.

2. Marketing / growth co-founder candidate
   Someone strong at early-stage positioning.

Before joining, self-qualify honestly:

* Do I care about the mission?
* Can I commit meaningful time?`,
      targetAudience: `People who may want to build Cohort15.

- Technical builders
- Growth operators`,
      additionalDetails: 'Bring a thoughtful point of view. <script>alert("x")</script>',
    }),
    id: 'formatted',
    firstMeetingAt: '2026-07-10T22:00:00.000Z',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    expiresAt: '2026-06-25T12:00:00.000Z',
    interestCount: 0,
    collectionStatus: 'active',
    quorumStatus: 'gathering',
    quorumMetAt: null,
    finalMeetingEndsAt: '2026-07-17T23:00:00.000Z',
  });

  assert.match(html, /<section class="detail-content" aria-label="Cohort details">/);
  assert.match(html, /<h2>About this cohort<\/h2><div class="formatted-text"><p>This is a serious request for aligned people\.<\/p>/);
  assert.match(html, /<ol><li>Technical co-founder candidate<br>Someone who can handle product-quality implementation\.<\/li><\/ol>/);
  assert.match(html, /<ol start="2"><li>Marketing \/ growth co-founder candidate<br>Someone strong at early-stage positioning\.<\/li><\/ol>/);
  assert.match(html, /<ul><li>Do I care about the mission\?<\/li><li>Can I commit meaningful time\?<\/li><\/ul>/);
  assert.match(html, /<h2>Who it’s for<\/h2>/);
  assert.match(html, /<ul><li>Technical builders<\/li><li>Growth operators<\/li><\/ul>/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
});
