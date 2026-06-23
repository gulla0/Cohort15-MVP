import assert from 'node:assert/strict';
import { test } from 'node:test';

import { notificationIdempotencyKey } from '../src/domain/models.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createLofiStore } from '../src/persistence/store.mjs';

const CREATED_AT = '2026-01-01T12:00:00.000Z';

function validCohortInput(overrides = {}) {
  return {
    creatorEmail: ' creator@example.com ',
    title: 'Lofi founders circle',
    description: 'A focused group for founders validating a lofi product direction.',
    category: 'build',
    topic: 'Founder validation',
    targetAudience: 'Early stage builders',
    targetSkillLevel: 'intermediate',
    additionalDetails: 'Bring one open product question.',
    minQuorum: 2,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-01-10T10:00',
    meetingDurationMinutes: 60,
    recurrence: 'weekly',
    meetingCount: 3,
    ...overrides,
  };
}

async function createRepository() {
  return createLocalRepositories({
    store: createLofiStore(),
    randomUUID: () => crypto.randomUUID(),
  });
}

test('local repositories persist only required cohort fields and public views hide private email', async () => {
  const repositories = await createRepository();
  const cohort = await repositories.createCohort(validCohortInput(), {
    id: '5d464d18-c0a6-4c5a-9260-3e27d1c89a11',
    now: CREATED_AT,
  });

  assert.deepEqual(Object.keys(cohort), [
    'id', 'creatorEmail', 'title', 'description', 'category', 'topic',
    'targetAudience', 'targetSkillLevel', 'additionalDetails', 'minQuorum',
    'meetingLink', 'creatorTimeZone', 'firstMeetingAt', 'firstMeetingLocal',
    'meetingDurationMinutes', 'recurrence', 'meetingCount', 'createdAt',
    'updatedAt', 'expiresAt', 'quorumMetAt',
  ]);

  const publicCohort = await repositories.getPublicCohortById(cohort.id, { now: CREATED_AT });
  assert.equal('creatorEmail' in publicCohort, false);
  assert.equal('meetingLink' in publicCohort, false);
  assert.doesNotMatch(JSON.stringify(publicCohort), /creator@example.com/u);
});

test('local repositories generate ids with the default Web Crypto receiver intact', async () => {
  const repositories = createLocalRepositories({
    store: createLofiStore(),
    now: () => new Date(CREATED_AT),
  });
  const cohort = await repositories.createCohort(validCohortInput());
  assert.match(cohort.id, /^[0-9a-f-]{36}$/u);
});

test('interest acceptance is atomic and rejects creator, duplicate, expired, and already-met attempts', async () => {
  const repositories = await createRepository();
  const cohort = await repositories.createCohort(validCohortInput(), {
    id: '73d0d9cc-a5d1-42b6-b1f4-568b6ea77ed0',
    now: CREATED_AT,
  });

  await assert.rejects(
    () => repositories.acceptInterest(
      { cohortId: cohort.id, email: 'creator@example.com' },
      { id: 'bb841752-1d61-41e4-9a62-fccdd18da08e', now: '2026-01-01T12:01:00.000Z' },
    ),
    (error) => error.code === 'creator_email',
  );

  const first = await repositories.acceptInterest(
    { cohortId: cohort.id, email: 'First@example.com' },
    { id: 'b1c463ba-55cf-47b5-9641-fa9feef818c4', now: '2026-01-01T12:02:00.000Z' },
  );
  assert.equal(first.reachedQuorum, false);
  assert.equal(first.interestCount, 1);

  await assert.rejects(
    () => repositories.acceptInterest(
      { cohortId: cohort.id, email: ' first@example.com ' },
      { id: 'be24638a-5501-4a4f-827d-5538e4de905e', now: '2026-01-01T12:02:30.000Z' },
    ),
    (error) => error.code === 'duplicate_email',
  );

  const second = await repositories.acceptInterest(
    { cohortId: cohort.id, email: 'second@example.com' },
    { id: '2de42cf4-5aeb-4b02-8d40-0c1b5af6ab56', now: '2026-01-01T12:03:00.000Z' },
  );
  assert.equal(second.reachedQuorum, true);
  assert.equal(second.interestCount, 2);
  assert.equal(second.cohort.quorumMetAt, '2026-01-01T12:03:00.000Z');

  await assert.rejects(
    () => repositories.acceptInterest(
      { cohortId: cohort.id, email: 'third@example.com' },
      { id: '4381f107-acd6-4650-8c53-5bd87ba478ff', now: '2026-01-01T12:04:00.000Z' },
    ),
    (error) => error.code === 'already_met',
  );

  await assert.rejects(
    () => repositories.acceptInterest(
      { cohortId: 'missing-cohort', email: 'person@example.com' },
      { id: 'fa04c07e-4fd5-4766-b775-d00df81de87f', now: '2026-01-01T12:04:00.000Z' },
    ),
    (error) => error.name === 'RepositoryNotFoundError',
  );

  const expired = await repositories.createCohort(validCohortInput({
    firstMeetingLocal: '2026-01-20T10:00',
  }), {
    id: 'f0c45fac-4f95-4e72-b91a-9336be9d0b6a',
    now: CREATED_AT,
  });
  await assert.rejects(
    () => repositories.acceptInterest(
      { cohortId: expired.id, email: 'late@example.com' },
      { id: '495a40b9-fdbd-4b43-abed-7f0b3d9a43d1', now: expired.expiresAt },
    ),
    (error) => error.code === 'expired',
  );
});

test('only one concurrent acceptance records the quorum transition', async () => {
  const repositories = await createRepository();
  const cohort = await repositories.createCohort(validCohortInput({ minQuorum: 1 }), {
    id: 'e31c7208-5e34-4977-86f9-d8c591f37805',
    now: CREATED_AT,
  });

  const [first, second] = await Promise.allSettled([
    repositories.acceptInterest(
      { cohortId: cohort.id, email: 'first@example.com' },
      { id: '38b4d0df-7302-49ea-8f2b-e4d96fe54624', now: '2026-01-01T12:01:00.000Z' },
    ),
    repositories.acceptInterest(
      { cohortId: cohort.id, email: 'second@example.com' },
      { id: '98579757-2e85-4f4e-a046-b0f95ab06d9d', now: '2026-01-01T12:01:01.000Z' },
    ),
  ]);

  const successes = [first, second].filter((result) => result.status === 'fulfilled');
  const failures = [first, second].filter((result) => result.status === 'rejected');
  assert.equal(successes.length, 1);
  assert.equal(failures.length, 1);
  assert.equal(successes[0].value.reachedQuorum, true);
  assert.equal(failures[0].reason.code, 'already_met');
  assert.equal((await repositories.getCohortById(cohort.id)).quorumMetAt, '2026-01-01T12:01:00.000Z');
});

test('notification delivery uses deterministic idempotency and records outcomes', async () => {
  const repositories = await createRepository();
  const cohort = await repositories.createCohort(validCohortInput(), {
    id: '9df83637-9a16-4bc0-85e1-96dcf7de23f7',
    now: CREATED_AT,
  });
  const accepted = await repositories.acceptInterest(
    { cohortId: cohort.id, email: 'person@example.com' },
    { id: '3e9e3739-367d-4ef3-86f1-2e81eef7e54d', now: '2026-01-01T12:02:00.000Z' },
  );

  const idempotencyKey = notificationIdempotencyKey({
    type: 'participant_confirmation',
    cohortId: cohort.id,
    interestId: accepted.interest.id,
    recipientEmail: accepted.interest.email,
  });

  const first = await repositories.ensureNotificationDelivery({
    idempotencyKey,
    cohortId: cohort.id,
    interestId: accepted.interest.id,
    recipientEmail: accepted.interest.email,
    type: 'participant_confirmation',
  }, {
    id: '150814fc-b7d2-4f2f-9742-c438dbd9ef50',
    now: '2026-01-01T12:03:00.000Z',
  });
  assert.equal(first.created, true);

  const duplicate = await repositories.ensureNotificationDelivery({
    idempotencyKey,
    cohortId: cohort.id,
    interestId: accepted.interest.id,
    recipientEmail: accepted.interest.email,
    type: 'participant_confirmation',
  }, {
    id: '7fb80861-9c48-40a7-a08f-928e02ea1bc8',
    now: '2026-01-01T12:04:00.000Z',
  });
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.delivery.id, first.delivery.id);

  const failed = await repositories.recordNotificationOutcome(idempotencyKey, {
    status: 'failed',
    attemptCount: 1,
    providerErrorCode: 'timeout',
  }, { now: '2026-01-01T12:05:00.000Z' });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.providerErrorCode, 'timeout');

  const sent = await repositories.recordNotificationOutcome(idempotencyKey, {
    status: 'sent',
    attemptCount: 2,
  }, { now: '2026-01-01T12:06:00.000Z' });
  assert.equal(sent.status, 'sent');
  assert.equal(sent.attemptCount, 2);
  assert.equal(sent.sentAt, '2026-01-01T12:06:00.000Z');
});
