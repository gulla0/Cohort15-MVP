import test from 'node:test';
import assert from 'node:assert/strict';

import { createLofiStore } from '../src/persistence/store.mjs';
import { createLocalRepositories } from '../src/persistence/repositories.mjs';
import { createRequestHandler } from '../src/server/app.mjs';
import { createRollingWindowLimiter } from '../src/services/rate-limit.mjs';
import { createShowInterestService, InterestHoneypotSubmissionError } from '../src/services/show-interest.mjs';
import { renderCohortDetailPage } from '../src/ui/cohorts.mjs';

const NOW = new Date('2026-06-18T12:00:00.000Z');
const config = Object.freeze({ appEnv: 'test', isProduction: false, appUrl: 'http://localhost:3000', googleAnalyticsId: 'G-TEST' });
function cohort(overrides = {}) { return { title: 'Build a tiny compiler', description: 'Work through a tiny compiler implementation together.', category: 'build', topic: 'Compilers', targetAudience: 'Developers learning language implementation', targetSkillLevel: 'intermediate', minQuorum: 3, meetingLink: 'https://meet.google.com/abc-defg-hij', creatorTimeZone: 'America/Detroit', firstMeetingLocal: '2026-07-10T18:00', meetingDurationMinutes: 60, recurrence: 'weekly', meetingCount: 2, ...overrides }; }
function actor(index) { return Object.freeze({ userId: `user-${index}`, email: `person-${index}@example.com` }); }
function sessionsFor(current) { const auth = { user: { id: current.userId, email: current.email }, balance: { available: 2 }, csrfToken: 'csrf' }; return { async authenticate() { return auth; }, verifyCsrf(value, token) { return value === auth && token === 'csrf'; } }; }
function invoke(handler, { url, method = 'GET', headers = {}, body = '' }) { return new Promise((resolve, reject) => { const req = { url, method, headers, socket: { remoteAddress: '127.0.0.1' }, async *[Symbol.asyncIterator]() { if (body) yield Buffer.from(body); } }; const response = { status: 0, headers: {}, body: '', writeHead(status, responseHeaders) { this.status = status; this.headers = responseHeaders; }, end(value = '') { this.body = String(value); resolve(this); } }; Promise.resolve(handler(req, response)).catch(reject); }); }

async function fixture({ minQuorum = 3 } = {}) {
  const store = createLofiStore(); let id = 0;
  const repositories = createLocalRepositories({ store, now: () => NOW, randomUUID: () => `record-${++id}` });
  const actors = [actor(0), actor(1), actor(2), actor(3)];
  for (const [index, current] of actors.entries()) await repositories.provisionUser({ supabaseSubject: `subject-${index}`, email: current.email }, { id: current.userId, grantId: `grant-${index}`, now: NOW });
  const created = await repositories.createFundedCohort(cohort({ minQuorum }), actors[0], { id: 'cohort-1', holdId: 'creator-hold', now: NOW });
  return { store, repositories, actors, cohort: created.cohort };
}

test('authenticated interest derives private identity and rejects honeypot, creator, and duplicates before holds', async () => {
  const { store, repositories, actors } = await fixture();
  const service = createShowInterestService({ repositories, limiter: createRollingWindowLimiter({ limit: 2, windowMs: 3_600_000 }) });
  await assert.rejects(service.show('cohort-1', { website: 'bot' }, { clientIp: '192.0.2.1', actor: actors[1] }), InterestHoneypotSubmissionError);
  await assert.rejects(service.show('cohort-1', {}, { clientIp: '192.0.2.1', actor: actors[0] }), (error) => error.code === 'creator_user');
  const accepted = await service.show('cohort-1', { email: 'attacker@example.com' }, { clientIp: '192.0.2.1', actor: actors[1] });
  assert.equal(accepted.interest.email, actors[1].email);
  assert.equal(accepted.interest.userId, actors[1].userId);
  await assert.rejects(service.show('cohort-1', {}, { clientIp: '192.0.2.2', actor: actors[1] }), (error) => error.code === 'duplicate_user');
  assert.equal(store.listInterestsByCohortId('cohort-1').length, 1);
  assert.equal((await repositories.getCreditBalance(actors[1].userId)).held, 1);
});

test('one concurrent funded interest reaches quorum and consumes every account-backed hold once', async () => {
  const { repositories, actors } = await fixture({ minQuorum: 2 });
  const service = createShowInterestService({ repositories, limiter: createRollingWindowLimiter({ limit: 10, windowMs: 3_600_000 }) });
  const results = await Promise.all([
    service.show('cohort-1', {}, { clientIp: '192.0.2.1', actor: actors[1] }),
    service.show('cohort-1', {}, { clientIp: '192.0.2.2', actor: actors[2] }),
  ]);
  assert.equal(results.filter((result) => result.reachedQuorum).length, 1);
  assert.equal((await repositories.getCreditBalance(actors[0].userId)).consumed, 2);
  assert.equal((await repositories.getCreditBalance(actors[1].userId)).consumed, 1);
  assert.equal((await repositories.getCreditBalance(actors[2].userId)).consumed, 1);
  const publicCohort = await repositories.getPublicCohortById('cohort-1', { now: NOW });
  assert.equal(publicCohort.quorumStatus, 'met');
  assert.equal(publicCohort.meetingLink, 'https://meet.google.com/abc-defg-hij');
});

test('lazy expiry settlement refunds creator and participant holds exactly once before balance reads', async () => {
  const { repositories, actors } = await fixture({ minQuorum: 3 });
  await repositories.acceptFundedInterest({ cohortId: 'cohort-1' }, actors[1], { id: 'interest-1', holdId: 'interest-hold', now: NOW });
  const afterExpiry = new Date('2026-06-26T12:00:00.000Z');
  const creatorBalance = await repositories.getCreditBalance(actors[0].userId, { now: afterExpiry });
  const participantBalance = await repositories.getCreditBalance(actors[1].userId, { now: afterExpiry });
  assert.deepEqual(creatorBalance, { funded: 2, available: 2, held: 0, consumed: 0, refunded: 2 });
  assert.deepEqual(participantBalance, { funded: 2, available: 2, held: 0, consumed: 0, refunded: 1 });
  await repositories.getCreditBalance(actors[1].userId, { now: afterExpiry });
  assert.equal((await repositories.listCreditTransactionsByUserId(actors[1].userId)).filter((item) => item.type === 'refund').length, 1);
});

test('public detail stays browseable while interest requires sign-in and authenticated forms contain CSRF but no email', async () => {
  const { repositories, actors } = await fixture();
  const publicCohort = await repositories.getPublicCohortById('cohort-1', { now: NOW });
  const anonymous = renderCohortDetailPage(publicCohort);
  assert.match(anonymous, /Sign in to show interest/);
  assert.doesNotMatch(anonymous, /name="email"|person-0@example/);
  const authenticated = renderCohortDetailPage(publicCohort, { auth: { ...sessionsFor(actors[1]), user: actors[1], csrfToken: 'csrf', balance: { available: 2 } } });
  assert.match(authenticated, /name="csrf" value="csrf"/);
  assert.match(authenticated, /Use 1 credit and show interest/);
  assert.doesNotMatch(authenticated, /name="email"|person-1@example/);
});

test('interest route enforces auth and CSRF and returns 402 without records when credits are insufficient', async () => {
  const { store, repositories, actors } = await fixture();
  const anonymous = createRequestHandler({ config, repositories });
  assert.equal((await invoke(anonymous, { url: '/cohorts/cohort-1/interests', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'csrf=x' })).status, 401);
  const handler = createRequestHandler({ config, repositories, sessions: sessionsFor(actors[1]) });
  assert.equal((await invoke(handler, { url: '/cohorts/cohort-1/interests', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'csrf=bad' })).status, 403);
  await repositories.holdCredits({ userId: actors[1].userId, amount: 2, idempotencyKey: 'other', source: 'test' });
  const gated = await invoke(handler, { url: '/cohorts/cohort-1/interests', method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'csrf=csrf' });
  assert.equal(gated.status, 402);
  assert.match(gated.body, /Showing interest costs 1 credit/);
  assert.match(gated.body, /Buy credits/);
  assert.equal(store.listInterestsByCohortId('cohort-1').length, 0);
});
