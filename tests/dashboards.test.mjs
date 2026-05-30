import assert from 'node:assert/strict';
import test from 'node:test';
import { CREATE_EVENT_TOKEN_COST, SHOW_INTEREST_TOKEN_COST } from '../src/domain/constants.mjs';
import { buildEvent } from '../src/domain/validation.mjs';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createDashboardService } from '../src/services/dashboards.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const now = new Date('2026-06-01T12:00:00.000Z');

function eventFixture(overrides = {}) {
  return buildEvent({
    id: 'event-dashboard',
    creatorId: 'user-creator',
    title: 'Open Source Pairing Cohort',
    description: 'Pair on open source issues for four weeks.',
    category: 'open_source',
    topic: 'Open source',
    targetAudience: 'Developers looking for contribution reps.',
    targetSkillLevel: 'intermediate',
    minQuorum: 1,
    maxParticipants: 6,
    lockedEventLink: 'https://meet.example/private-dashboard',
    firstMeetingAt: new Date('2026-06-20T18:00:00.000Z'),
    meetingDurationMinutes: 75,
    recurrence: 'weekly',
    meetingCount: 4,
    createdAt: now,
    ...overrides
  });
}

function createFixture() {
  const state = createDemoRepositories();
  const service = createDashboardService(state);

  return {
    ...state,
    service
  };
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

test('creator dashboard lists owned cohorts with token state and unlocked links', () => {
  const { repositories, ledger, service } = createFixture();
  const activeEvent = repositories.events.save(eventFixture({ status: 'active' }));
  ledger.hold(activeEvent.creatorId, activeEvent.id, CREATE_EVENT_TOKEN_COST);
  ledger.consumeHeld(activeEvent.creatorId, activeEvent.id, CREATE_EVENT_TOKEN_COST);
  repositories.eventInterests.save({
    id: 'interest-dashboard',
    eventId: activeEvent.id,
    userId: 'user-participant',
    tokensHeld: SHOW_INTEREST_TOKEN_COST,
    status: 'consumed',
    createdAt: now
  });

  const dashboard = service.getCreatorDashboard('user-creator');

  assert.equal(dashboard.cohorts.length, 1);
  assert.equal(dashboard.cohorts[0].event.lockedEventLink, 'https://meet.example/private-dashboard');
  assert.equal(dashboard.cohorts[0].interestCount, 1);
  assert.deepEqual(dashboard.cohorts[0].tokenSummary, {
    held: CREATE_EVENT_TOKEN_COST,
    consumed: CREATE_EVENT_TOKEN_COST,
    refunded: 0
  });
});

test('participant dashboard lists interested cohorts and respects link authorization', () => {
  const { repositories, ledger, service } = createFixture();
  const activeEvent = repositories.events.save(eventFixture({ status: 'active' }));
  ledger.hold('user-participant', activeEvent.id, SHOW_INTEREST_TOKEN_COST);
  ledger.consumeHeld('user-participant', activeEvent.id, SHOW_INTEREST_TOKEN_COST);
  repositories.eventInterests.save({
    id: 'interest-dashboard',
    eventId: activeEvent.id,
    userId: 'user-participant',
    tokensHeld: SHOW_INTEREST_TOKEN_COST,
    status: 'consumed',
    createdAt: now
  });

  const dashboard = service.getParticipantDashboard('user-participant');

  assert.equal(dashboard.interests.length, 1);
  assert.equal(dashboard.interests[0].event.lockedEventLink, 'https://meet.example/private-dashboard');
  assert.equal(dashboard.interests[0].interest.status, 'consumed');
  assert.deepEqual(dashboard.interests[0].tokenSummary, {
    held: SHOW_INTEREST_TOKEN_COST,
    consumed: SHOW_INTEREST_TOKEN_COST,
    refunded: 0
  });
});

test('dashboard routes render creator and participant views', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state);
  const activeEvent = state.repositories.events.save(eventFixture({ status: 'active' }));
  state.ledger.hold(activeEvent.creatorId, activeEvent.id, CREATE_EVENT_TOKEN_COST);
  state.ledger.consumeHeld(activeEvent.creatorId, activeEvent.id, CREATE_EVENT_TOKEN_COST);
  state.ledger.hold('user-participant', activeEvent.id, SHOW_INTEREST_TOKEN_COST);
  state.ledger.consumeHeld('user-participant', activeEvent.id, SHOW_INTEREST_TOKEN_COST);
  state.repositories.eventInterests.save({
    id: 'interest-dashboard',
    eventId: activeEvent.id,
    userId: 'user-participant',
    tokensHeld: SHOW_INTEREST_TOKEN_COST,
    status: 'consumed',
    createdAt: now
  });

  const creator = await invoke(handler, { url: '/dashboard/creator?userId=user-creator', method: 'GET' });
  assert.equal(creator.status, 200);
  assert.match(creator.body, /Creator dashboard/);
  assert.match(creator.body, /Open Source Pairing Cohort/);
  assert.match(creator.body, /src="\/assets\/default-cohort\.png"/);
  assert.match(creator.body, /https:\/\/meet\.example\/private-dashboard/);
  assert.match(creator.body, /creator tokens: 2 in use \/ 2 used \/ 0 returned/);

  const participant = await invoke(handler, { url: '/dashboard/participant?userId=user-participant', method: 'GET' });
  assert.equal(participant.status, 200);
  assert.match(participant.body, /Participant dashboard/);
  assert.match(participant.body, /Seat confirmed/);
  assert.match(participant.body, /src="\/assets\/default-cohort\.png"/);
  assert.match(participant.body, /https:\/\/meet\.example\/private-dashboard/);
  assert.match(participant.body, /participant tokens: 1 in use \/ 1 used \/ 0 returned/);
});

test('combined dashboard route shows creator and participant dashboards together', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state);
  const activeEvent = state.repositories.events.save(eventFixture({ status: 'active' }));
  state.ledger.hold(activeEvent.creatorId, activeEvent.id, CREATE_EVENT_TOKEN_COST);
  state.ledger.consumeHeld(activeEvent.creatorId, activeEvent.id, CREATE_EVENT_TOKEN_COST);
  state.ledger.hold('user-participant', activeEvent.id, SHOW_INTEREST_TOKEN_COST);
  state.ledger.consumeHeld('user-participant', activeEvent.id, SHOW_INTEREST_TOKEN_COST);
  state.repositories.eventInterests.save({
    id: 'interest-dashboard',
    eventId: activeEvent.id,
    userId: 'user-participant',
    tokensHeld: SHOW_INTEREST_TOKEN_COST,
    status: 'consumed',
    createdAt: now
  });

  const response = await invoke(handler, { url: '/dashboard', method: 'GET' });

  assert.equal(response.status, 200);
  assert.match(response.body, /Creator dashboard/);
  assert.match(response.body, /Participant dashboard/);
  assert.match(response.body, /creator tokens: 2 in use \/ 2 used \/ 0 returned/);
  assert.match(response.body, /participant tokens: 1 in use \/ 1 used \/ 0 returned/);
  assert.match(response.body, /<a class="brand-link" href="\/">Cohort15<\/a>/);
  assert.match(response.body, /<div class="topbar-links">/);
  assert.doesNotMatch(response.body, /dashboard\/creator">Creator dashboard/);
  assert.doesNotMatch(response.body, /dashboard\/participant">Participant dashboard/);
});
