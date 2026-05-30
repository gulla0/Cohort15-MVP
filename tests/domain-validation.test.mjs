import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_EXPIRY_DAYS,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  RECURRENCE_VALUES,
  SOCIAL_POST_STATUSES,
  TARGET_SKILL_LEVELS
} from '../src/domain/constants.mjs';
import {
  buildEvent,
  canViewLockedEventLink,
  computeDefaultExpiresAt,
  serializeEventForViewer,
  validateEvent,
  validateEventInterest,
  validateSocialPost,
  validateTokenTransaction
} from '../src/domain/validation.mjs';

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
    additionalDetails: 'Bring a small project idea.',
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

test('domain constants match the MVP enum values', () => {
  assert.deepEqual(EVENT_CATEGORIES, [
    'learn',
    'build',
    'practice',
    'accountability',
    'open_source',
    'explore'
  ]);
  assert.deepEqual(TARGET_SKILL_LEVELS, ['beginner', 'intermediate', 'advanced', 'any']);
  assert.deepEqual(EVENT_STATUSES, ['open', 'active', 'expired', 'cancelled', 'completed']);
  assert.deepEqual(RECURRENCE_VALUES, ['none', 'weekly', 'biweekly', 'monthly']);
  assert.deepEqual(SOCIAL_POST_STATUSES, ['pending', 'posted', 'failed']);
});

test('buildEvent applies default lifecycle and expiry values', () => {
  const event = buildEvent(eventInput());

  assert.equal(event.status, 'open');
  assert.equal(event.socialPostStatus, 'pending');
  assert.equal(event.expiresAt.toISOString(), '2026-06-15T12:00:00.000Z');
  assert.equal(event.expiresAt.getTime() - createdAt.getTime(), DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
});

test('event validation enforces participant cap, recurrence, and required link rules', () => {
  assert.deepEqual(validateEvent(buildEvent(eventInput({ maxParticipants: 15 }))), []);

  assert.throws(
    () => buildEvent(eventInput({ maxParticipants: 4 })),
    /Max participants cannot be lower than quorum/
  );
  assert.throws(
    () => buildEvent(eventInput({ maxParticipants: 16 })),
    /Max participants cannot be greater than 15/
  );
  assert.throws(
    () => buildEvent(eventInput({ recurrence: 'none', meetingCount: 2 })),
    /One-time events must have exactly one meeting/
  );
  assert.throws(
    () => buildEvent(eventInput({ recurrence: 'weekly', meetingCount: 1 })),
    /Repeating events must have at least two meetings/
  );
  assert.throws(
    () => buildEvent(eventInput({ lockedEventLink: '' })),
    /lockedEventLink is required/
  );
});

test('locked event links are hidden until activation and only visible to authorized users', () => {
  const openEvent = buildEvent(eventInput());
  const activeEvent = buildEvent(eventInput({ status: 'active' }));

  assert.equal(canViewLockedEventLink(openEvent, { userId: 'user-creator' }), false);
  assert.equal(serializeEventForViewer(openEvent, { userId: 'user-creator' }).lockedEventLink, undefined);
  assert.equal(
    serializeEventForViewer(openEvent, { userId: 'user-creator' }).linkVisibility,
    'locked_until_quorum'
  );

  assert.equal(canViewLockedEventLink(activeEvent, { userId: 'user-creator' }), true);
  assert.equal(canViewLockedEventLink(activeEvent, {
    userId: 'user-participant',
    interestedUserIds: ['user-participant']
  }), true);
  assert.equal(canViewLockedEventLink(activeEvent, { userId: 'public-user' }), false);
  assert.equal(
    serializeEventForViewer(activeEvent, { userId: 'public-user' }).linkVisibility,
    'authorized_only'
  );
});

test('related object validators represent interest, token, and social post rules', () => {
  assert.deepEqual(validateEventInterest({
    id: 'interest-1',
    eventId: 'event-1',
    userId: 'user-participant',
    tokensHeld: 1,
    status: 'active',
    createdAt
  }), []);

  assert.deepEqual(validateTokenTransaction({
    id: 'txn-1',
    userId: 'user-participant',
    eventId: 'event-1',
    amount: 1,
    type: 'hold',
    createdAt
  }), []);

  assert.deepEqual(validateSocialPost({
    id: 'post-1',
    eventId: 'event-1',
    platform: 'x',
    postText: 'Join the TypeScript cohort.',
    status: 'pending',
    createdAt
  }), []);

  assert.match(validateEventInterest({
    id: 'interest-1',
    eventId: 'event-1',
    userId: 'user-participant',
    tokensHeld: 2,
    status: 'active',
    createdAt
  }).join(' '), /tokensHeld must be 1/);
});

test('expiry helper rejects invalid dates', () => {
  assert.throws(() => computeDefaultExpiresAt(new Date('invalid')), /createdAt must be a valid Date/);
});
