import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { DomainValidationError } from '../src/domain/validation.mjs';
import { createLofiStore } from '../src/persistence/store.mjs';
import {
  createLocalRepositories, InsufficientCreditsError, RepositoryConflictError,
} from '../src/persistence/repositories.mjs';

const NOW = '2026-07-15T12:00:00.000Z';
const digest = (value) => createHash('sha256').update(value).digest('hex');

function fixture() {
  let id = 0;
  return createLocalRepositories({
    store: createLofiStore(), now: () => new Date(NOW), randomUUID: () => `id-${++id}`,
  });
}

test('provisioning normalizes identity and creates the signup grant exactly once under concurrency', async () => {
  const repositories = fixture();
  const results = await Promise.all(Array.from({ length: 8 }, () => repositories.provisionUser({
    supabaseSubject: 'subject-1', email: ' Person@Example.COM ',
  })));
  assert.equal(new Set(results.map(({ user }) => user.id)).size, 1);
  assert.equal(results.filter(({ created }) => created).length, 1);
  assert.equal(results.filter(({ grantCreated }) => grantCreated).length, 1);
  assert.equal(results[0].user.email, 'person@example.com');
  assert.deepEqual(await repositories.getCreditBalance(results[0].user.id), {
    funded: 2, available: 2, held: 0, consumed: 0, refunded: 0,
  });

  await assert.rejects(
    repositories.provisionUser({ supabaseSubject: 'subject-2', email: 'person@example.com' }),
    (error) => error instanceof RepositoryConflictError && error.code === 'identity_conflict',
  );
});

test('sessions persist digests only, expire, and can be invalidated', async () => {
  const repositories = fixture();
  const { user } = await repositories.provisionUser({ supabaseSubject: 'subject-1', email: 'person@example.com' });
  const session = await repositories.createSession({
    userId: user.id,
    tokenDigest: digest('private-session-token'),
    csrfDigest: digest('private-csrf-token'),
    expiresAt: '2026-07-15T20:00:00.000Z',
  });
  assert.equal(JSON.stringify(session).includes('private-session-token'), false);
  assert.equal((await repositories.getSessionByTokenDigest(session.tokenDigest)).user.id, user.id);
  assert.equal(await repositories.deleteSessionByTokenDigest(session.tokenDigest), true);
  await assert.rejects(repositories.getSessionByTokenDigest(session.tokenDigest), /session not found/u);
  await assert.rejects(
    repositories.createSession({ ...session, tokenDigest: 'raw-token', expiresAt: '2026-07-15T20:00:00.000Z' }),
    DomainValidationError,
  );
});

test('credit holds serialize safely and consume or refund immutably and idempotently', async () => {
  const repositories = fixture();
  const { user } = await repositories.provisionUser({ supabaseSubject: 'subject-1', email: 'person@example.com' });
  const first = await repositories.holdCredits({
    userId: user.id, amount: 1, idempotencyKey: 'hold:one', cohortId: 'cohort-1', source: 'interest',
  });
  const replay = await repositories.holdCredits({
    userId: user.id, amount: 1, idempotencyKey: 'hold:one', cohortId: 'cohort-1', source: 'interest',
  });
  assert.equal(replay.created, false);
  assert.equal(replay.transaction.id, first.transaction.id);
  const consumed = await repositories.consumeCreditHold({
    userId: user.id, holdId: first.transaction.id, idempotencyKey: 'consume:one',
  });
  assert.deepEqual(consumed.balance, { funded: 2, available: 1, held: 0, consumed: 1, refunded: 0 });
  assert.equal((await repositories.consumeCreditHold({
    userId: user.id, holdId: first.transaction.id, idempotencyKey: 'consume:one',
  })).created, false);
  await assert.rejects(
    repositories.refundCreditHold({ userId: user.id, holdId: first.transaction.id, idempotencyKey: 'refund:one' }),
    (error) => error.code === 'hold_settled',
  );

  const second = await repositories.holdCredits({
    userId: user.id, amount: 1, idempotencyKey: 'hold:two', cohortId: 'cohort-2',
  });
  const refunded = await repositories.refundCreditHold({
    userId: user.id, holdId: second.transaction.id, idempotencyKey: 'refund:two',
  });
  assert.deepEqual(refunded.balance, { funded: 2, available: 1, held: 0, consumed: 1, refunded: 1 });
  assert.equal((await repositories.listCreditTransactionsByUserId(user.id)).length, 5);
});

test('concurrent holds never overdraw available credits', async () => {
  const repositories = fixture();
  const { user } = await repositories.provisionUser({ supabaseSubject: 'subject-1', email: 'person@example.com' });
  const outcomes = await Promise.allSettled(Array.from({ length: 3 }, (_, index) => repositories.holdCredits({
    userId: user.id, amount: 1, idempotencyKey: `hold:${index}`, cohortId: `cohort-${index}`,
  })));
  assert.equal(outcomes.filter(({ status }) => status === 'fulfilled').length, 2);
  const failure = outcomes.find(({ status }) => status === 'rejected').reason;
  assert.equal(failure instanceof InsufficientCreditsError, true);
  assert.deepEqual(await repositories.getCreditBalance(user.id), {
    funded: 2, available: 0, held: 2, consumed: 0, refunded: 0,
  });
});

test('purchase fulfillment and Stripe event processing are exact-once', async () => {
  const repositories = fixture();
  const { user } = await repositories.provisionUser({ supabaseSubject: 'subject-1', email: 'person@example.com' });
  const pending = await repositories.createPendingPurchase({
    userId: user.id, packageId: 'six_credits', credits: 6, amountCents: 600, currency: 'USD',
    stripeCheckoutSessionId: null, stripePaymentIntentId: null, fulfilledAt: null,
  });
  await repositories.setPurchaseCheckoutSession(pending.id, 'cs_test_1');
  const fulfillment = {
    purchaseId: pending.id, userId: user.id, packageId: 'six_credits', credits: 6,
    amountCents: 600, currency: 'usd', stripeCheckoutSessionId: 'cs_test_1',
    stripePaymentIntentId: 'pi_test_1',
  };
  const results = await Promise.all([
    repositories.fulfillPurchase(fulfillment), repositories.fulfillPurchase(fulfillment),
  ]);
  assert.equal(results.filter(({ fulfilled }) => fulfilled).length, 1);
  assert.deepEqual(await repositories.getCreditBalance(user.id), {
    funded: 8, available: 8, held: 0, consumed: 0, refunded: 0,
  });
  const event = { eventId: 'evt_1', eventType: 'checkout.session.completed', outcome: 'fulfilled' };
  assert.equal((await repositories.recordStripeEvent(event)).created, true);
  assert.equal((await repositories.recordStripeEvent(event)).created, false);
});

test('legacy cohort and interest records retain explicit nullable account links', async () => {
  const repositories = fixture();
  const cohort = await repositories.createCohort({
    creatorEmail: 'creator@example.com', title: 'Build a tiny compiler',
    description: 'Work through a tiny compiler implementation together.', category: 'build',
    topic: 'Compilers', targetAudience: 'Developers learning language implementation',
    targetSkillLevel: 'intermediate', minQuorum: 2,
    meetingLink: 'https://meet.google.com/abc-defg-hij', creatorTimeZone: 'America/Detroit',
    firstMeetingLocal: '2026-08-10T18:00', meetingDurationMinutes: 60,
    recurrence: 'weekly', meetingCount: 2,
  });
  const interest = await repositories.acceptInterest({ cohortId: cohort.id, email: 'joiner@example.com' });
  assert.equal(cohort.creatorUserId, null);
  assert.equal(interest.interest.userId, null);
  assert.equal(JSON.stringify(await repositories.getPublicCohortById(cohort.id)).includes('creatorUserId'), false);
});
