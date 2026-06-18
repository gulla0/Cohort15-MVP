import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createCohort,
  createInterest,
  createNotificationDelivery,
  notificationIdempotencyKey,
} from '../src/domain/models.mjs';
import {
  acceptsInterest,
  collectionStatus,
  DomainValidationError,
  finalMeetingEndsAt,
  generateMeetingStarts,
  localDateTimeToInstant,
  normalizeCohortSubmission,
  quorumStatus,
  serializePublicCohort,
  validateMeetingLink,
} from '../src/domain/validation.mjs';

const CREATED_AT = '2026-01-01T12:00:00.000Z';

function validInput(overrides = {}) {
  return {
    creatorEmail: ' Creator@Example.COM ',
    title: '  Learn distributed systems  ',
    description: 'A focused group for learning distributed systems.',
    category: 'learn',
    topic: 'Distributed systems',
    targetAudience: 'Backend engineers',
    targetSkillLevel: 'intermediate',
    additionalDetails: '  Bring a notebook.  ',
    minQuorum: '5',
    meetingLink: 'https://meet.google.com/abc-defg-hij?authuser=0#room',
    creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-01-10T10:00',
    meetingDurationMinutes: '60',
    recurrence: 'weekly',
    meetingCount: '4',
    ...overrides,
  };
}

function cohort(overrides = {}) {
  return createCohort(validInput(overrides), { id: 'cohort-1', now: CREATED_AT });
}

test('normalizes submission strings, email, numbers, and exact expiry', () => {
  const normalized = normalizeCohortSubmission(
    validInput({ firstMeetingLocal: '2026-01-10T10:00:59.999' }),
    { createdAt: CREATED_AT },
  );
  assert.equal(normalized.creatorEmail, 'creator@example.com');
  assert.equal(normalized.title, 'Learn distributed systems');
  assert.equal(normalized.additionalDetails, 'Bring a notebook.');
  assert.equal(normalized.minQuorum, 5);
  assert.equal(normalized.expiresAt, '2026-01-08T12:00:00.000Z');
  assert.equal(normalized.firstMeetingLocal, '2026-01-10T10:00');
  assert.equal(normalized.firstMeetingAt, '2026-01-10T15:00:00.000Z');
});

test('measures text limits in Unicode code points and accepts exact boundaries', () => {
  const normalized = normalizeCohortSubmission(validInput({
    title: '😀😀😀',
    description: 'd'.repeat(20),
    topic: 't'.repeat(100),
    targetAudience: 'a'.repeat(500),
    additionalDetails: 'x'.repeat(2_000),
    minQuorum: 1,
    meetingDurationMinutes: 480,
    recurrence: 'none',
    meetingCount: 1,
  }), { createdAt: CREATED_AT });
  assert.equal([...normalized.title].length, 3);
  assert.equal(normalized.meetingCount, 1);
});

test('rejects under/over limits, malformed email, bad enums, and unknown fields', () => {
  const invalidCases = [
    ['title', { title: 'ab' }],
    ['description', { description: 'x'.repeat(2_001) }],
    ['creatorEmail', { creatorEmail: 'not-an-email' }],
    ['minQuorum', { minQuorum: 16 }],
    ['meetingDurationMinutes', { meetingDurationMinutes: 14 }],
    ['meetingCount', { recurrence: 'none', meetingCount: 2 }],
    ['meetingCount', { recurrence: 'daily', meetingCount: 1 }],
    ['category', { category: 'other' }],
    ['creatorTimeZone', { creatorTimeZone: 'Mars/Olympus' }],
  ];
  for (const [field, overrides] of invalidCases) {
    assert.throws(
      () => normalizeCohortSubmission(validInput(overrides), { createdAt: CREATED_AT }),
      (error) => error instanceof DomainValidationError && error.field === field,
    );
  }
  assert.throws(
    () => normalizeCohortSubmission({ ...validInput(), maximumParticipants: 20 }, { createdAt: CREATED_AT }),
    (error) => error.field === 'maximumParticipants' && !error.message.includes('20'),
  );
});

test('rejects invalid local dates and first-meeting equality with expiry', () => {
  assert.throws(
    () => normalizeCohortSubmission(validInput({ firstMeetingLocal: '2026-02-30T10:00' }), { createdAt: CREATED_AT }),
    (error) => error.field === 'firstMeetingLocal',
  );
  assert.throws(
    () => normalizeCohortSubmission(validInput({ firstMeetingLocal: '2026-01-08T07:00' }), { createdAt: CREATED_AT }),
    (error) => error.field === 'firstMeetingAt',
  );
});

test('meeting links require approved HTTPS hosts without credentials or ports', () => {
  assert.match(validateMeetingLink(' https://subdomain.zoom.us/j/123?q=1#x '), /^https:/u);
  for (const link of [
    'http://zoom.us/j/123',
    'https://evilzoom.us/j/123',
    'https://user:pass@zoom.us/j/123',
    'https://zoom.us:444/j/123',
  ]) assert.throws(() => validateMeetingLink(link), DomainValidationError);
});

test('daily/weekly/biweekly recurrence preserves local wall-clock time through DST', () => {
  const daily = cohort({
    creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-03-07T10:00',
    recurrence: 'daily',
    meetingCount: 3,
  });
  assert.deepEqual(generateMeetingStarts(daily), [
    '2026-03-07T15:00:00.000Z',
    '2026-03-08T14:00:00.000Z',
    '2026-03-09T14:00:00.000Z',
  ]);
  assert.equal(generateMeetingStarts(cohort({ recurrence: 'weekly' })).length, 4);
  assert.equal(generateMeetingStarts(cohort({ recurrence: 'biweekly' })).length, 4);
});

test('spring-forward gaps move forward by the gap and fall-back chooses earlier instant', () => {
  assert.equal(
    localDateTimeToInstant('2026-03-08T02:30', 'America/Detroit').toISOString(),
    '2026-03-08T07:30:00.000Z',
  );
  assert.equal(
    localDateTimeToInstant('2026-11-01T01:30', 'America/Detroit').toISOString(),
    '2026-11-01T05:30:00.000Z',
  );
});

test('monthly recurrence clamps month-end and retargets the original day', () => {
  const monthly = cohort({
    creatorTimeZone: 'UTC',
    firstMeetingLocal: '2026-01-31T10:00',
    recurrence: 'monthly',
    meetingCount: 4,
  });
  assert.deepEqual(generateMeetingStarts(monthly), [
    '2026-01-31T10:00:00.000Z',
    '2026-02-28T10:00:00.000Z',
    '2026-03-31T10:00:00.000Z',
    '2026-04-30T10:00:00.000Z',
  ]);
  assert.equal(finalMeetingEndsAt(monthly), '2026-04-30T11:00:00.000Z');
});

test('collection and quorum boundaries derive from instants', () => {
  const value = cohort();
  assert.equal(collectionStatus(value, '2026-01-08T11:59:59.999Z'), 'active');
  assert.equal(collectionStatus(value, value.expiresAt), 'expired');
  assert.equal(quorumStatus(value), 'gathering');
  assert.equal(acceptsInterest(value, '2026-01-08T11:59:59.999Z'), true);
  const met = { ...value, quorumMetAt: '2026-01-02T00:00:00.000Z' };
  assert.equal(quorumStatus(met), 'met');
  assert.equal(acceptsInterest(met), false);
});

test('public serialization never exposes emails and gates only the meeting link', () => {
  const value = cohort();
  const beforeQuorum = serializePublicCohort(value, { interestCount: 2, now: CREATED_AT });
  assert.equal(beforeQuorum.firstMeetingAt, value.firstMeetingAt);
  assert.equal(beforeQuorum.meetingDurationMinutes, 60);
  assert.equal('creatorEmail' in beforeQuorum, false);
  assert.doesNotMatch(JSON.stringify(beforeQuorum), /email/iu);
  assert.equal('meetingLink' in beforeQuorum, false);

  const met = { ...value, quorumMetAt: '2026-01-08T11:00:00.000Z' };
  assert.equal(serializePublicCohort(met, { now: value.expiresAt }).meetingLink, value.meetingLink);
  assert.equal(
    'meetingLink' in serializePublicCohort(met, { now: finalMeetingEndsAt(met) }),
    false,
  );
});

test('record factories expose only the specified fields and normalize private email', () => {
  const value = cohort();
  assert.deepEqual(Object.keys(value), [
    'id', 'creatorEmail', 'title', 'description', 'category', 'topic',
    'targetAudience', 'targetSkillLevel', 'additionalDetails', 'minQuorum',
    'meetingLink', 'creatorTimeZone', 'firstMeetingAt', 'firstMeetingLocal',
    'meetingDurationMinutes', 'recurrence', 'meetingCount', 'createdAt',
    'updatedAt', 'expiresAt', 'quorumMetAt',
  ]);
  const interest = createInterest(
    { cohortId: value.id, email: ' PERSON@Example.com ' },
    { id: 'interest-1', now: CREATED_AT },
  );
  assert.equal(interest.email, 'person@example.com');
  assert.deepEqual(Object.keys(interest), ['id', 'cohortId', 'email', 'createdAt']);

  const delivery = createNotificationDelivery({
    idempotencyKey: 'participant_confirmation:interest-1',
    cohortId: value.id,
    interestId: interest.id,
    recipientEmail: interest.email,
    type: 'participant_confirmation',
  }, { id: 'delivery-1', now: CREATED_AT });
  assert.deepEqual(Object.keys(delivery), [
    'id', 'idempotencyKey', 'cohortId', 'interestId', 'recipientEmail', 'type',
    'status', 'attemptCount', 'providerErrorCode', 'createdAt', 'updatedAt', 'sentAt',
  ]);
  assert.equal(delivery.status, 'pending');
});

test('notification idempotency keys are deterministic and never contain raw emails', () => {
  assert.equal(notificationIdempotencyKey({
    type: 'creator_confirmation', cohortId: 'cohort-1', recipientEmail: 'creator@example.com',
  }), 'creator_confirmation:cohort-1');
  assert.equal(notificationIdempotencyKey({
    type: 'participant_confirmation', cohortId: 'cohort-1', interestId: 'interest-1',
    recipientEmail: 'person@example.com',
  }), 'participant_confirmation:interest-1');
  const quorumKey = notificationIdempotencyKey({
    type: 'quorum_met', cohortId: 'cohort-1', recipientEmail: ' Person@Example.com ',
  });
  assert.match(quorumKey, /^quorum_met:cohort-1:[a-f0-9]{64}$/u);
  assert.doesNotMatch(quorumKey, /person|@/iu);
  assert.throws(() => createNotificationDelivery({
    idempotencyKey: 'wrong',
    cohortId: 'cohort-1',
    recipientEmail: 'person@example.com',
    type: 'quorum_met',
  }), (error) => error.field === 'idempotencyKey');
});
