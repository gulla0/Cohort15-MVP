import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_EXPIRY_DAYS,
  DEFAULT_COHORT_IMAGE_PATH,
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
  computeEarliestFirstMeetingAt,
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
    lockedEventLink: 'https://meet.google.com/cohort',
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
  assert.deepEqual(RECURRENCE_VALUES, ['none', 'daily', 'weekly', 'biweekly', 'monthly']);
  assert.deepEqual(SOCIAL_POST_STATUSES, ['pending', 'posted', 'failed']);
});

test('buildEvent applies default lifecycle and expiry values', () => {
  const event = buildEvent(eventInput());

  assert.equal(event.status, 'open');
  assert.equal(event.socialPostStatus, 'pending');
  assert.equal(event.imageUrl, DEFAULT_COHORT_IMAGE_PATH);
  assert.equal(event.expiresAt.toISOString(), '2026-06-15T12:00:00.000Z');
  assert.equal(event.expiresAt.getTime() - createdAt.getTime(), DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
});

test('event image supports custom URLs and rejects invalid values', () => {
  assert.equal(
    buildEvent(eventInput({ imageUrl: 'https://images.example/cohort.png' })).imageUrl,
    'https://images.example/cohort.png'
  );
  assert.equal(
    buildEvent(eventInput({ imageUrl: '/assets/custom-cohort.png' })).imageUrl,
    '/assets/custom-cohort.png'
  );
  assert.throws(
    () => buildEvent(eventInput({ imageUrl: 'javascript:alert(1)' })),
    /imageUrl must be an http\(s\) URL or an app-relative path/
  );
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
  assert.equal(
    buildEvent(eventInput({ recurrence: 'daily', meetingCount: 5 })).recurrence,
    'daily'
  );
  assert.throws(
    () => buildEvent(eventInput({ lockedEventLink: '' })),
    /lockedEventLink is required/
  );
  assert.throws(
    () => buildEvent(eventInput({ firstMeetingAt: new Date('2026-06-15T12:00:00.000Z') })),
    /firstMeetingAt must be after the 14-day quorum window/
  );
});

test('event validation restricts private meeting links to approved providers', () => {
  const allowedLinks = [
    'https://meet.google.com/abc-defg-hij',
    'https://us02web.zoom.us/j/123456789',
    'https://teams.microsoft.com/l/meetup-join/example',
    'https://discord.gg/cohort15',
    'https://app.slack.com/huddle/team-room'
  ];

  for (const lockedEventLink of allowedLinks) {
    assert.equal(buildEvent(eventInput({ lockedEventLink })).lockedEventLink, lockedEventLink);
  }

  assert.throws(
    () => buildEvent(eventInput({ lockedEventLink: 'https://example.com/private-room' })),
    /lockedEventLink must be an approved Google Meet, Zoom, Microsoft Teams, Discord, or Slack https link/
  );
  assert.throws(
    () => buildEvent(eventInput({ lockedEventLink: 'http://meet.google.com/abc-defg-hij' })),
    /lockedEventLink must be an approved Google Meet, Zoom, Microsoft Teams, Discord, or Slack https link/
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

test('earliest first meeting helper follows the quorum window', () => {
  assert.equal(computeEarliestFirstMeetingAt(createdAt).toISOString(), '2026-06-15T12:00:00.000Z');
});
