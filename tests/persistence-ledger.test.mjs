import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { buildEvent } from '../src/domain/validation.mjs';
import { FUTURE_TOKEN_SOURCES, TABLES } from '../src/persistence/schema.mjs';
import { createRepositories } from '../src/persistence/repositories.mjs';
import { createDemoRepositories, DEMO_USERS } from '../src/persistence/seeds.mjs';
import { createJsonFileStore } from '../src/persistence/store.mjs';
import { createTokenLedger } from '../src/persistence/token-ledger.mjs';

const createdAt = new Date('2026-06-01T12:00:00.000Z');

function eventInput(overrides = {}) {
  return {
    id: 'event-1',
    creatorId: 'user-creator',
    title: 'Beginner TypeScript Build Cohort',
    description: 'Build small TypeScript projects together.',
    category: 'build',
    topic: 'TypeScript',
    targetAudience: 'Beginner developers who know basic JavaScript.',
    targetSkillLevel: 'beginner',
    minQuorum: 5,
    maxParticipants: 8,
    lockedEventLink: 'https://meet.example/cohort',
    firstMeetingAt: new Date('2026-06-20T18:00:00.000Z'),
    meetingDurationMinutes: 90,
    recurrence: 'weekly',
    meetingCount: 4,
    createdAt,
    ...overrides
  };
}

test('schema defines MVP persistence tables and leaves purchase source path explicit', () => {
  assert.deepEqual(Object.keys(TABLES), [
    'users',
    'events',
    'eventInterests',
    'tokenTransactions',
    'socialPosts'
  ]);
  assert.equal(TABLES.eventInterests.unique.includes('eventId'), true);
  assert.equal(TABLES.eventInterests.unique.includes('userId'), true);
  assert.deepEqual(FUTURE_TOKEN_SOURCES, ['purchase']);
});

test('repositories persist users, events, interests, transactions, and social posts', () => {
  const repositories = createRepositories();
  repositories.users.create({
    id: 'user-creator',
    displayName: 'Demo Creator',
    createdAt
  });
  repositories.events.save(buildEvent(eventInput()));
  repositories.eventInterests.save({
    id: 'interest-1',
    eventId: 'event-1',
    userId: 'user-participant',
    tokensHeld: 1,
    status: 'active',
    createdAt
  });
  repositories.tokenTransactions.append({
    id: 'txn-1',
    userId: 'user-creator',
    eventId: 'event-1',
    amount: 2,
    type: 'hold',
    createdAt
  });
  repositories.socialPosts.save({
    id: 'post-1',
    eventId: 'event-1',
    platform: 'x',
    postText: 'Join the TypeScript cohort.',
    status: 'pending',
    createdAt
  });

  assert.equal(repositories.users.findById('user-creator').displayName, 'Demo Creator');
  assert.equal(repositories.events.findById('event-1').title, 'Beginner TypeScript Build Cohort');
  assert.equal(repositories.eventInterests.listByEvent('event-1').length, 1);
  assert.equal(repositories.tokenTransactions.listByUser('user-creator').length, 1);
  assert.equal(repositories.socialPosts.listByEvent('event-1').length, 1);
});

test('event interests are unique for a user and event', () => {
  const repositories = createRepositories();
  const interest = {
    id: 'interest-1',
    eventId: 'event-1',
    userId: 'user-participant',
    tokensHeld: 1,
    status: 'active',
    createdAt
  };

  repositories.eventInterests.save(interest);

  assert.throws(() => repositories.eventInterests.save({
    ...interest,
    id: 'interest-2'
  }), /unique by eventId and userId/);
});

test('token ledger derives available and held balances from auditable records', () => {
  const repositories = createRepositories();
  const ledger = createTokenLedger(repositories.tokenTransactions, {
    now: () => createdAt
  });

  ledger.grant('user-creator', 6);
  assert.deepEqual(ledger.balanceForUser('user-creator'), {
    grantedOrPurchased: 6,
    held: 0,
    consumed: 0,
    refunded: 0,
    available: 6
  });

  ledger.hold('user-creator', 'event-1', 2);
  assert.deepEqual(ledger.balanceForUser('user-creator'), {
    grantedOrPurchased: 6,
    held: 2,
    consumed: 0,
    refunded: 0,
    available: 4
  });

  ledger.consumeHeld('user-creator', 'event-1', 2);
  assert.deepEqual(ledger.balanceForUser('user-creator'), {
    grantedOrPurchased: 6,
    held: 0,
    consumed: 2,
    refunded: 0,
    available: 4
  });
});

test('token ledger refunds holds and rejects insufficient available or held tokens', () => {
  const repositories = createRepositories();
  const ledger = createTokenLedger(repositories.tokenTransactions, {
    now: () => createdAt
  });

  ledger.grant('user-participant', 1);
  assert.throws(() => ledger.hold('user-participant', 'event-1', 2), /Insufficient available tokens/);

  ledger.hold('user-participant', 'event-1', 1);
  assert.throws(() => ledger.refundHeld('user-participant', 'event-1', 2), /Insufficient held tokens/);

  ledger.refundHeld('user-participant', 'event-1', 1);
  assert.deepEqual(ledger.balanceForUser('user-participant'), {
    grantedOrPurchased: 1,
    held: 0,
    consumed: 0,
    refunded: 1,
    available: 1
  });
});

test('demo seeds create users and starting token grants through ledger transactions', () => {
  const { repositories, ledger } = createDemoRepositories();

  assert.deepEqual(repositories.users.list().map((user) => user.id), DEMO_USERS.map((user) => user.id));
  assert.equal(repositories.tokenTransactions.list().every((transaction) => transaction.type === 'grant'), true);
  assert.equal(ledger.balanceForUser('user-creator').available, 6);
  assert.equal(ledger.balanceForUser('user-participant').available, 6);
});

test('json file store persists records across repository reloads', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cohort15-store-'));
  const filePath = join(dir, 'state.json');

  try {
    const firstState = createDemoRepositories({
      store: createJsonFileStore(filePath)
    });

    firstState.repositories.events.save(buildEvent(eventInput()));
    firstState.ledger.hold('user-creator', 'event-1', 2);
    firstState.repositories.socialPosts.save({
      id: 'post-1',
      eventId: 'event-1',
      platform: 'x',
      postText: 'Join the TypeScript cohort.',
      status: 'pending',
      createdAt
    });

    const secondState = createDemoRepositories({
      store: createJsonFileStore(filePath)
    });

    assert.equal(secondState.repositories.users.list().length, 2);
    assert.equal(secondState.repositories.events.findById('event-1').title, 'Beginner TypeScript Build Cohort');
    assert.equal(secondState.repositories.socialPosts.findById('post-1').status, 'pending');
    assert.equal(secondState.ledger.balanceForUser('user-creator').held, 2);
    assert.equal(secondState.repositories.tokenTransactions.listByUser('user-creator').filter((transaction) => (
      transaction.type === 'grant' && transaction.source === 'seed_demo_tokens'
    )).length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
