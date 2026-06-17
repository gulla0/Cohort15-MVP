import assert from 'node:assert/strict';
import test from 'node:test';
import { CREATE_EVENT_CREDIT_COST, SHOW_INTEREST_CREDIT_COST } from '../src/domain/constants.mjs';
import { buildEvent } from '../src/domain/validation.mjs';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createExpireCohortsService } from '../src/services/expire-cohorts.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const createdAt = new Date('2026-06-01T12:00:00.000Z');
const expiredAt = new Date('2026-06-15T12:00:00.000Z');
const processingAt = new Date('2026-06-16T12:00:00.000Z');

function eventFixture(overrides = {}) {
  return buildEvent({
    id: 'event-expiring',
    creatorId: 'user-creator',
    title: 'Open Source Pairing Cohort',
    description: 'Pair on open source issues for four weeks.',
    category: 'open_source',
    topic: 'Open source',
    targetAudience: 'Developers looking for contribution reps.',
    targetSkillLevel: 'intermediate',
    minQuorum: 2,
    maxParticipants: 6,
    lockedEventLink: 'https://meet.google.com/private-open-source',
    firstMeetingAt: new Date('2026-06-20T18:00:00.000Z'),
    meetingDurationMinutes: 75,
    recurrence: 'weekly',
    meetingCount: 4,
    createdAt,
    expiresAt: expiredAt,
    ...overrides
  });
}

function createFixture(options = {}) {
  const state = createDemoRepositories();
  const service = createExpireCohortsService({
    ...state,
    options: {
      now: () => options.now ?? processingAt
    }
  });

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

test('expiry processing expires overdue open cohorts and refunds held credits', () => {
  const { repositories, ledger, service } = createFixture();
  const event = repositories.events.save(eventFixture());
  ledger.hold(event.creatorId, event.id, CREATE_EVENT_CREDIT_COST);
  ledger.hold('user-participant', event.id, SHOW_INTEREST_CREDIT_COST);
  repositories.eventInterests.save({
    id: 'interest-expiring',
    eventId: event.id,
    userId: 'user-participant',
    creditsHeld: SHOW_INTEREST_CREDIT_COST,
    status: 'active',
    createdAt
  });

  const result = service.expireDueCohorts();

  assert.equal(result.expiredCount, 1);
  assert.equal(result.results[0].event.status, 'expired');
  assert.equal(repositories.events.findById(event.id).status, 'expired');
  assert.equal(repositories.eventInterests.findById('interest-expiring').status, 'refunded');
  assert.equal(ledger.balanceForUser('user-creator').held, 0);
  assert.equal(ledger.balanceForUser('user-creator').refunded, CREATE_EVENT_CREDIT_COST);
  assert.equal(ledger.balanceForUser('user-participant').held, 0);
  assert.equal(ledger.balanceForUser('user-participant').refunded, SHOW_INTEREST_CREDIT_COST);

  const refundTransactions = repositories.creditTransactions
    .listByEvent(event.id)
    .filter((transaction) => transaction.type === 'refund');
  assert.equal(refundTransactions.length, 2);
});

test('expiry processing ignores active and not-yet-expired cohorts', () => {
  const { repositories, ledger, service } = createFixture();
  const activeEvent = repositories.events.save(eventFixture({
    id: 'event-active',
    status: 'active'
  }));
  const futureEvent = repositories.events.save(eventFixture({
    id: 'event-future',
    expiresAt: new Date('2026-06-20T12:00:00.000Z')
  }));
  ledger.hold(activeEvent.creatorId, activeEvent.id, CREATE_EVENT_CREDIT_COST);
  ledger.hold(futureEvent.creatorId, futureEvent.id, CREATE_EVENT_CREDIT_COST);

  const result = service.expireDueCohorts();

  assert.equal(result.expiredCount, 0);
  assert.equal(repositories.events.findById(activeEvent.id).status, 'active');
  assert.equal(repositories.events.findById(futureEvent.id).status, 'open');
  assert.equal(ledger.balanceForUser('user-creator').refunded, 0);
});

test('expiry route returns expired ids and expired cohorts are not public', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    runtimeConfig: {
      appEnv: 'development',
      isProduction: false,
      appUrl: 'http://localhost:3000',
      auth: {},
      stripe: {},
      adminEmails: ['creator@example.test']
    }
  });
  const event = state.repositories.events.save(eventFixture());
  state.ledger.hold(event.creatorId, event.id, CREATE_EVENT_CREDIT_COST);

  const signInResponse = await invoke(handler, {
    url: '/auth/sign-in',
    method: 'POST',
    body: new URLSearchParams({ userId: 'user-creator' }).toString()
  });
  const cookie = signInResponse.headers['set-cookie'].split(';')[0];

  const response = await invoke(handler, {
    url: `/admin/expire-cohorts?now=${encodeURIComponent(processingAt.toISOString())}`,
    method: 'POST',
    headers: { cookie },
    body: ''
  });

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    processedAt: processingAt.toISOString(),
    expiredCount: 1,
    expiredEventIds: [event.id]
  });

  const detail = await invoke(handler, { url: `/cohorts/${event.id}`, method: 'GET' });
  assert.equal(detail.status, 404);
  assert.doesNotMatch(detail.body, /private-open-source/);
});
