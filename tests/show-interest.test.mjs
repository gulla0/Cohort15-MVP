import assert from 'node:assert/strict';
import test from 'node:test';
import { CREATE_EVENT_TOKEN_COST, SHOW_INTEREST_TOKEN_COST } from '../src/domain/constants.mjs';
import { buildEvent } from '../src/domain/validation.mjs';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createShowInterestService } from '../src/services/show-interest.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const now = new Date('2026-06-01T12:00:00.000Z');

function eventFixture(overrides = {}) {
  return buildEvent({
    id: 'event-interest',
    creatorId: 'user-creator',
    title: 'Open Source Pairing Cohort',
    description: 'Pair on open source issues for four weeks.',
    category: 'open_source',
    topic: 'Open source',
    targetAudience: 'Developers looking for contribution reps.',
    targetSkillLevel: 'intermediate',
    minQuorum: 2,
    maxParticipants: 6,
    lockedEventLink: 'https://meet.example/private-open-source',
    firstMeetingAt: new Date('2026-06-20T18:00:00.000Z'),
    meetingDurationMinutes: 75,
    recurrence: 'weekly',
    meetingCount: 4,
    createdAt: now,
    ...overrides
  });
}

function createFixture(options = {}) {
  const state = createDemoRepositories();
  const service = createShowInterestService({
    ...state,
    options: {
      now: () => now,
      createInterestId: () => options.interestId ?? 'interest-created'
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

test('show interest records a 1-token hold and active interest', () => {
  const { repositories, ledger, service } = createFixture();
  const event = repositories.events.save(eventFixture());
  ledger.hold(event.creatorId, event.id, CREATE_EVENT_TOKEN_COST);

  const result = service.showInterest({ eventId: event.id, userId: 'user-participant' });

  assert.equal(result.activated, false);
  assert.equal(result.interest.id, 'interest-created');
  assert.equal(result.interest.status, 'active');
  assert.equal(result.interest.tokensHeld, SHOW_INTEREST_TOKEN_COST);
  assert.equal(ledger.balanceForUser('user-participant').held, SHOW_INTEREST_TOKEN_COST);
});

test('show interest rejects creators without changing the UI default participant path', async () => {
  const { repositories, ledger, service } = createFixture();
  const event = repositories.events.save(eventFixture());
  ledger.hold(event.creatorId, event.id, CREATE_EVENT_TOKEN_COST);

  assert.throws(
    () => service.showInterest({ eventId: event.id, userId: 'user-creator' }),
    /Creators cannot show interest/
  );

  const handler = createRequestHandler({ repositories, ledger });
  const detail = await invoke(handler, { url: `/cohorts/${event.id}`, method: 'GET' });

  assert.equal(detail.status, 200);
  assert.match(detail.body, /<option value="user-participant" selected>Demo Participant<\/option>/);
  assert.doesNotMatch(detail.body, /<option value="user-creator" selected>Demo Creator<\/option>/);
});

test('show interest rejects duplicate active interest and participant cap overflow', () => {
  const { repositories, ledger, service } = createFixture();
  const event = repositories.events.save(eventFixture());
  ledger.hold(event.creatorId, event.id, CREATE_EVENT_TOKEN_COST);

  service.showInterest({ eventId: event.id, userId: 'user-participant' });

  assert.throws(
    () => service.showInterest({ eventId: event.id, userId: 'user-participant' }),
    /already has active interest/
  );

  repositories.users.create({
    id: 'user-other',
    displayName: 'Other Participant',
    createdAt: now
  });
  repositories.users.create({
    id: 'user-second',
    displayName: 'Second Participant',
    createdAt: now
  });
  const cappedEvent = repositories.events.save(eventFixture({
    id: 'event-capped',
    minQuorum: 2,
    maxParticipants: 2
  }));
  ledger.hold(cappedEvent.creatorId, cappedEvent.id, CREATE_EVENT_TOKEN_COST);
  repositories.eventInterests.save({
    id: 'interest-capped-1',
    eventId: cappedEvent.id,
    userId: 'user-other',
    tokensHeld: SHOW_INTEREST_TOKEN_COST,
    status: 'active',
    createdAt: now
  });
  repositories.eventInterests.save({
    id: 'interest-capped-2',
    eventId: cappedEvent.id,
    userId: 'user-second',
    tokensHeld: SHOW_INTEREST_TOKEN_COST,
    status: 'active',
    createdAt: now
  });

  assert.throws(
    () => service.showInterest({ eventId: cappedEvent.id, userId: 'user-participant' }),
    /participant cap/
  );
});

test('show interest activates event at quorum and consumes held tokens', () => {
  const { repositories, ledger, service } = createFixture();
  const event = repositories.events.save(eventFixture({ minQuorum: 1, maxParticipants: 3 }));
  ledger.hold(event.creatorId, event.id, CREATE_EVENT_TOKEN_COST);

  const result = service.showInterest({ eventId: event.id, userId: 'user-participant' });

  assert.equal(result.activated, true);
  assert.equal(result.event.status, 'active');
  assert.equal(repositories.events.findById(event.id).status, 'active');
  assert.equal(repositories.eventInterests.findById('interest-created').status, 'consumed');

  const transactions = repositories.tokenTransactions.listByEvent(event.id);
  assert.equal(transactions.filter((transaction) => transaction.type === 'consume').length, 2);
  assert.equal(ledger.balanceForUser('user-creator').consumed, CREATE_EVENT_TOKEN_COST);
  assert.equal(ledger.balanceForUser('user-participant').consumed, SHOW_INTEREST_TOKEN_COST);
});

test('show interest route unlocks the private link for the participant when quorum is met', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state);
  const event = state.repositories.events.save(eventFixture({ minQuorum: 1, maxParticipants: 3 }));
  state.ledger.hold(event.creatorId, event.id, CREATE_EVENT_TOKEN_COST);

  const response = await invoke(handler, {
    url: `/cohorts/${event.id}/interest`,
    method: 'POST',
    body: new URLSearchParams({ userId: 'user-participant' }).toString()
  });

  assert.equal(response.status, 200);
  assert.match(response.body, /Quorum met/);
  assert.match(response.body, /Private link unlocked/);
  assert.match(response.body, /Open dashboard/);
  assert.match(response.body, /href="\/dashboard\?participantUserId=user-participant"/);
  assert.match(response.body, /https:\/\/meet\.example\/private-open-source/);
});
