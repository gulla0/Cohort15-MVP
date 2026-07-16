import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createEventBrowsingService } from '../src/services/event-browsing.mjs';
import {
  cohortCardScript, portableCohortRequest, portableRequestScript, renderCohortCard,
  renderCohortDetailPage,
} from '../src/ui/cohorts.mjs';

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
    const response = {
      status: 0,
      headers: {},
      body: '',
      rawBody: Buffer.alloc(0),
      writeHead(status, headers) { this.status = status; this.headers = headers; },
      end(body = '') {
        this.rawBody = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
        this.body = this.rawBody.toString('utf8');
        resolve(this);
      },
    };
    Promise.resolve(handler(req, response)).catch(reject);
  });
}

function metaContent(html, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const propertyPattern = new RegExp(`<meta property="${escaped}" content="([^"]*)">`, 'u');
  const namePattern = new RegExp(`<meta name="${escaped}" content="([^"]*)">`, 'u');
  return propertyPattern.exec(html)?.[1] ?? namePattern.exec(html)?.[1] ?? '';
}

function portableTextMarkup(html) {
  return /<textarea class="portable-request-text"[^>]*>([\s\S]*?)<\/textarea>/u.exec(html)?.[1] ?? '';
}

function portableScriptSource() {
  return portableRequestScript().replace(/^<script>|<\/script>$/gu, '');
}

function cardScriptSource() {
  return cohortCardScript().replace(/^<script>|<\/script>$/gu, '');
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
  assert.match(home.body, /class="cohort-card-actions"[\s\S]*class="card-copy-icon"[\s\S]*>Copy request<\/button>/u);
  assert.match(home.body, /data-cohort-card data-cohort-href="\/cohorts\/b-active"/u);
  assert.match(home.body, /document\.querySelectorAll\('\[data-cohort-card\]'\)/u);
  assert.match(home.body, /http:\/\/localhost:3000\/cohorts\/b-active/u);
  assert.doesNotMatch(home.body, /private@example\.com|meet\.google\.com/);
  assert.ok(home.body.indexOf('Newer active') < home.body.indexOf('Older active'));
  assert.doesNotMatch(home.body, /href="\/cohorts\/expired"/);

  const detail = await invoke(handler, '/cohorts/b-active');
  assert.equal(detail.status, 200);
  assert.match(detail.body, /googletagmanager\.com\/gtag\/js\?id=G-LF22TLDSBV/);
  assert.match(detail.body, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(detail.body, /<meta property="og:title" content="Older active &lt;test&gt; \| Cohort15">/);
  assert.match(detail.body, /<meta property="og:url" content="http:\/\/localhost:3000\/cohorts\/b-active">/);
  assert.match(detail.body, /<meta property="og:image" content="http:\/\/localhost:3000\/cohorts\/b-active\/social-image\.png">/);
  assert.match(detail.body, /<meta property="og:image:type" content="image\/png">/);
  assert.match(detail.body, /Older active &lt;test&gt;/);
  assert.match(detail.body, /Times are converted by your browser and shown in your local timezone/);
  assert.match(detail.body, /Duration<\/dt><dd>60 minutes/);
  assert.match(detail.body, />Copy cohort request<\/button>/u);
  assert.doesNotMatch(detail.body, /card-copy-icon/u);
  assert.doesNotMatch(detail.body, /private@example\.com|meet\.google\.com/);

  const socialImage = await invoke(handler, '/cohorts/b-active/social-image.png');
  assert.equal(socialImage.status, 200);
  assert.match(socialImage.headers['content-type'], /image\/png/);
  assert.match(socialImage.headers['cache-control'], /max-age=300/);
  assert.deepEqual([...socialImage.rawBody.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(socialImage.rawBody.length > 1000);
  assert.doesNotMatch(socialImage.body, /private@example\.com|meet\.google\.com/);

  assert.equal((await invoke(handler, '/cohorts')).status, 302);
  assert.equal((await invoke(handler, '/cohorts/missing')).status, 404);
  assert.equal((await invoke(handler, '/cohorts/missing/social-image.svg')).status, 404);
});

test('cohort detail metadata uses concise titles and descriptions for social previews', () => {
  const html = renderCohortDetailPage({
    ...cohort({
      id: 'long-meta',
      title: 'Co-founder search for Cohort15: technical, growth, and accelerator-experienced collaborators',
      description: 'This is the first serious Cohort15 request, and it tests the system itself: can one clear intent attract a small number of serious, aligned people? Cohort15 is an early-stage product for forming small, committed online groups.',
    }),
    firstMeetingAt: '2026-07-10T22:00:00.000Z',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    expiresAt: '2026-06-25T12:00:00.000Z',
    interestCount: 0,
    collectionStatus: 'active',
    quorumStatus: 'gathering',
    quorumMetAt: null,
    finalMeetingEndsAt: '2026-07-17T23:00:00.000Z',
  }, { appUrl: 'https://cohort15.com' });

  assert.match(html, /<h1>Co-founder search for Cohort15: technical, growth, and accelerator-experienced collaborators<\/h1>/);
  assert.ok(metaContent(html, 'og:title').length <= 60);
  assert.ok(metaContent(html, 'twitter:title').length <= 70);
  assert.ok(metaContent(html, 'description').length <= 125);
  assert.ok(metaContent(html, 'og:description').length <= 125);
  assert.ok(metaContent(html, 'twitter:description').length <= 125);
  assert.match(metaContent(html, 'og:title'), /… \| Cohort15$/u);
  assert.match(metaContent(html, 'twitter:title'), /… \| Cohort15$/u);
  assert.match(metaContent(html, 'description'), /…$/u);
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

test('portable cohort requests are deterministic, private-safe, and at most 280 code points', () => {
  const publicCohort = {
    ...cohort({
      id: 'portable-max',
      title: `${'😀'.repeat(120)} private@example.com`,
      description: `${'A focused purpose '.repeat(260)} https://meet.google.com/secret-room www.example.com`,
      minQuorum: 15,
      meetingDurationMinutes: 480,
      recurrence: 'biweekly',
      meetingCount: 52,
    }),
    firstMeetingAt: '2026-12-31T23:59:00.000Z',
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    expiresAt: '2026-06-25T12:00:00.000Z',
    interestCount: 14,
    collectionStatus: 'active',
    quorumStatus: 'gathering',
    quorumMetAt: null,
    finalMeetingEndsAt: '2028-12-31T23:59:00.000Z',
  };
  const options = { appUrl: 'https://cohort15.com', now: NOW };
  const payload = portableCohortRequest(publicCohort, options);
  const card = renderCohortCard(publicCohort, options);
  const detail = renderCohortDetailPage(publicCohort, options);

  assert.ok(Array.from(payload).length <= 280);
  assert.match(payload, /^Cohort request: /u);
  assert.match(payload, /https:\/\/cohort15\.com\/cohorts\/portable-max$/u);
  assert.doesNotMatch(payload, /private@example\.com|meet\.google\.com|www\.example\.com/u);
  assert.match(card, /class="portable-request card-portable-request"/u);
  assert.match(card, /<a class="text-link" href="\/cohorts\/portable-max">View cohort details →<\/a>/u);
  assert.match(card, /<svg class="card-copy-icon"[^>]*aria-hidden="true"[^>]*focusable="false"/u);
  assert.match(card, />Copy request<\/button>/u);
  assert.match(detail, />Copy cohort request<\/button>/u);
  assert.equal(portableTextMarkup(card), portableTextMarkup(detail));
  assert.equal(portableTextMarkup(card), payload);
  assert.doesNotMatch(portableTextMarkup(card), /private@example\.com|meet\.google\.com/u);
});

test('portable cohort requests express schedule and lifecycle context in readable UTC text', () => {
  const base = {
    ...cohort({ id: 'readable', recurrence: 'weekly', meetingCount: 2 }),
    firstMeetingAt: '2026-07-24T22:00:00.000Z',
    interestCount: 2,
    minQuorum: 3,
    collectionStatus: 'active',
    quorumStatus: 'gathering',
    finalMeetingEndsAt: '2026-07-31T23:00:00.000Z',
  };
  const options = { appUrl: 'https://cohort15.com', now: NOW };
  const forming = portableCohortRequest(base, options);
  assert.match(forming, /Jul 24, 2026 at 10:00 PM UTC · Weekly · 2 meetings × 60 min · 2 of 3 interested/u);

  const oneTime = portableCohortRequest({
    ...base,
    id: 'one-time',
    firstMeetingAt: '2026-01-02T00:05:00.000Z',
    recurrence: 'none',
    meetingCount: 1,
  }, options);
  assert.match(oneTime, /Jan 2, 2026 at 12:05 AM UTC · One time · 1 meeting × 60 min/u);

  const met = portableCohortRequest({ ...base, collectionStatus: 'expired', quorumStatus: 'met', interestCount: 3 }, options);
  assert.match(met, /Quorum met \(3 of 3 interested\)/u);
  const closed = portableCohortRequest({ ...base, collectionStatus: 'expired', quorumStatus: 'gathering' }, options);
  assert.match(closed, /Collection closed/u);
});

test('whole cohort cards navigate except for interactions and selected text', () => {
  function cardHarness({ matchingAncestor = '', selection = '', defaultPrevented = false } = {}) {
    let click;
    let navigatedTo = '';
    const card = {
      dataset: { cohortHref: '/cohorts/encoded-id' },
      addEventListener(type, listener) { if (type === 'click') click = listener; },
    };
    vm.runInNewContext(cardScriptSource(), {
      document: { querySelectorAll() { return [card]; } },
      getSelection() { return { isCollapsed: !selection, toString() { return selection; } }; },
      location: { assign(value) { navigatedTo = value; } },
    });
    const event = {
      defaultPrevented,
      target: { closest(selector) {
        return selector.split(', ').includes(matchingAncestor) ? {} : null;
      } },
    };
    click(event);
    return navigatedTo;
  }

  assert.equal(cardHarness(), '/cohorts/encoded-id');
  for (const interactive of [
    'a', 'button', 'textarea', 'input', 'select', 'label', 'form', '[contenteditable]', '[data-portable-request]',
  ]) {
    assert.equal(cardHarness({ matchingAncestor: interactive }), '');
  }
  assert.equal(cardHarness({ selection: 'selected card text' }), '');
  assert.equal(cardHarness({ defaultPrevented: true }), '');
});

test('portable request controls report clipboard success and expose selectable fallback on failure', async () => {
  function browserHarness(clipboard) {
    let click;
    const button = { addEventListener(type, listener) { if (type === 'click') click = listener; } };
    const status = { textContent: '' };
    const fallback = {
      value: 'Cohort request: Test\nhttps://cohort15.com/cohorts/test',
      hidden: true,
      focused: false,
      selected: false,
      focus() { this.focused = true; },
      select() { this.selected = true; },
    };
    const control = { querySelector(selector) {
      if (selector === '[data-portable-request-button]') return button;
      if (selector === '[data-portable-request-status]') return status;
      return fallback;
    } };
    vm.runInNewContext(portableScriptSource(), {
      document: { querySelectorAll() { return [control]; } },
      navigator: clipboard === undefined ? {} : { clipboard },
    });
    return { click, fallback, status };
  }

  let copied = '';
  const success = browserHarness({ async writeText(value) { copied = value; } });
  await success.click();
  assert.equal(copied, success.fallback.value);
  assert.equal(success.status.textContent, 'Cohort request copied.');
  assert.equal(success.fallback.hidden, true);

  const failure = browserHarness(undefined);
  await failure.click();
  assert.equal(failure.status.textContent, 'Could not copy the cohort request. Select and copy it manually.');
  assert.equal(failure.fallback.hidden, false);
  assert.equal(failure.fallback.focused, true);
  assert.equal(failure.fallback.selected, true);
});
