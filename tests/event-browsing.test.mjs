import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEvent } from '../src/domain/validation.mjs';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createEventBrowsingService } from '../src/services/event-browsing.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const baseTime = new Date('2026-06-01T12:00:00.000Z');

function eventFixture(overrides = {}) {
  return buildEvent({
    id: 'event-public',
    creatorId: 'user-creator',
    title: 'Open Source Pairing Cohort',
    description: 'Pair on open source issues for four weeks.',
    category: 'open_source',
    topic: 'Open source',
    targetAudience: 'Developers looking for contribution reps.',
    targetSkillLevel: 'intermediate',
    additionalDetails: 'Bring a repository you want to understand better.',
    minQuorum: 2,
    maxParticipants: 6,
    lockedEventLink: 'https://meet.google.com/private-open-source',
    firstMeetingAt: new Date('2026-06-20T18:00:00.000Z'),
    meetingDurationMinutes: 75,
    recurrence: 'weekly',
    meetingCount: 4,
    createdAt: baseTime,
    ...overrides
  });
}

async function invoke(handler, request) {
  const chunks = [];
  const res = {
    statusCode: 0,
    headers: {},
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      chunks.push(body ?? '');
    }
  };

  await handler(request, res);

  return {
    status: res.statusCode,
    headers: res.headers,
    body: chunks.join('')
  };
}

test('event browsing lists only open and active events without private links', () => {
  const state = createDemoRepositories();
  state.repositories.events.save(eventFixture({ id: 'event-open', status: 'open' }));
  state.repositories.events.save(eventFixture({
    id: 'event-active',
    status: 'active',
    createdAt: new Date('2026-06-02T12:00:00.000Z')
  }));
  state.repositories.events.save(eventFixture({ id: 'event-expired', status: 'expired' }));

  const service = createEventBrowsingService(state);
  const events = service.listPublicEvents();

  assert.deepEqual(events.map((event) => event.id), ['event-active', 'event-open']);
  assert.equal(events[0].lockedEventLink, undefined);
  assert.equal(events[0].linkVisibility, 'authorized_only');
  assert.equal(events[1].lockedEventLink, undefined);
  assert.equal(events[1].linkVisibility, 'locked_until_quorum');
});

test('event detail reveals active private links only to authorized users', () => {
  const state = createDemoRepositories();
  state.repositories.events.save(eventFixture({ id: 'event-active', status: 'active' }));
  state.repositories.eventInterests.save({
    id: 'interest-1',
    eventId: 'event-active',
    userId: 'user-participant',
    status: 'active',
    tokensHeld: 1,
    createdAt: baseTime
  });

  const service = createEventBrowsingService(state);
  const anonymous = service.getPublicEvent('event-active');
  const creator = service.getPublicEvent('event-active', 'user-creator');
  const participant = service.getPublicEvent('event-active', 'user-participant');

  assert.equal(anonymous.lockedEventLink, undefined);
  assert.equal(anonymous.linkVisibility, 'authorized_only');
  assert.equal(creator.lockedEventLink, 'https://meet.google.com/private-open-source');
  assert.equal(creator.linkVisibility, 'visible');
  assert.equal(participant.lockedEventLink, 'https://meet.google.com/private-open-source');
  assert.equal(participant.linkVisibility, 'visible');
});

test('cohort feed and detail routes render public fields without leaking locked links', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state);
  state.repositories.events.save(eventFixture({ id: 'event-open', status: 'open' }));

  const feed = await invoke(handler, { url: '/cohorts', method: 'GET' });
  assert.equal(feed.status, 200);
  assert.match(feed.body, /Open Source Pairing Cohort/);
  assert.match(feed.body, /Open source/);
  assert.match(feed.body, /src="\/assets\/default-cohort\.png"/);
  assert.doesNotMatch(feed.body, /private-open-source/);

  const detail = await invoke(handler, { url: '/cohorts/event-open', method: 'GET' });
  assert.equal(detail.status, 200);
  assert.match(detail.body, /Private link locked/);
  assert.match(detail.body, /tokens are returned/);
  assert.match(detail.body, /src="\/assets\/default-cohort\.png"/);
  assert.doesNotMatch(detail.body, /private-open-source/);
});

test('active cohort detail route reveals link for creator viewer', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state);
  state.repositories.events.save(eventFixture({ id: 'event-active', status: 'active' }));

  const anonymous = await invoke(handler, { url: '/cohorts/event-active', method: 'GET' });
  assert.equal(anonymous.status, 200);
  assert.match(anonymous.body, /Private link unlocked for members/);
  assert.doesNotMatch(anonymous.body, /private-open-source/);

  const creator = await invoke(handler, {
    url: '/cohorts/event-active?viewerId=user-creator',
    method: 'GET'
  });
  assert.equal(creator.status, 200);
  assert.match(creator.body, /https:\/\/meet\.google\.com\/private-open-source/);
});
