import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

const now = new Date('2026-06-01T12:00:00.000Z');

function validCreateInput(overrides = {}) {
  return {
    creatorId: 'user-creator',
    title: 'Practical AI Build Cohort',
    description: 'Build useful AI workflows together over a short online series.',
    category: 'build',
    topic: 'AI workflows',
    targetAudience: 'Operators and builders who want practical implementation reps.',
    targetSkillLevel: 'intermediate',
    minQuorum: '1',
    maxParticipants: '5',
    lockedEventLink: 'https://meet.google.com/private-ai-build',
    firstMeetingAt: '2026-06-20T18:00:00.000Z',
    meetingDurationMinutes: '90',
    recurrence: 'weekly',
    meetingCount: '4',
    ...overrides
  };
}

function encodeForm(values) {
  return new URLSearchParams(values).toString();
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

async function signIn(handler, userId) {
  const response = await invoke(handler, {
    url: '/auth/sign-in',
    method: 'POST',
    body: new URLSearchParams({ userId, returnTo: '/' }).toString()
  });

  assert.equal(response.status, 303);
  return response.headers['set-cookie'].split(';')[0];
}

test('MVP success path creates, promotes, unlocks, and exposes dashboards without leaking locked links early', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    now: () => now
  });
  const creatorCookie = await signIn(handler, 'user-creator');

  const createResponse = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    headers: { cookie: creatorCookie },
    body: encodeForm(validCreateInput())
  });
  assert.equal(createResponse.status, 201);
  assert.match(createResponse.body, /Cohort created/);
  assert.match(createResponse.body, /href="\/dashboard"/);
  assert.doesNotMatch(createResponse.body, /private-ai-build/);

  const [event] = state.repositories.events.list();
  assert.equal(event.status, 'open');
  assert.equal(event.imageUrl, '/assets/default-cohort.png');
  assert.equal(event.socialPostStatus, 'pending');
  assert.equal(state.ledger.balanceForUser('user-creator').held, 2);

  const [socialPost] = state.repositories.socialPosts.list();
  assert.match(socialPost.postText, /Practical AI Build Cohort/);
  assert.match(socialPost.postText, /AI workflows/);
  assert.match(socialPost.postText, new RegExp(`/cohorts/${event.id}`));
  assert.doesNotMatch(socialPost.postText, /private-ai-build/);

  const publicDetail = await invoke(handler, {
    url: `/cohorts/${event.id}`,
    method: 'GET'
  });
  assert.equal(publicDetail.status, 200);
  assert.match(publicDetail.body, /Private link locked/);
  assert.match(publicDetail.body, /Sign in<\/a> to use 1 credit and show interest/);
  assert.doesNotMatch(publicDetail.body, /<select name="userId"/);
  assert.match(publicDetail.body, /src="\/assets\/default-cohort\.png"/);
  assert.doesNotMatch(publicDetail.body, /private-ai-build/);

  const participantCookie = await signIn(handler, 'user-participant');
  const interestResponse = await invoke(handler, {
    url: `/cohorts/${event.id}/interest`,
    method: 'POST',
    headers: { cookie: participantCookie },
    body: ''
  });
  assert.equal(interestResponse.status, 200);
  assert.match(interestResponse.body, /Quorum met/);
  assert.match(interestResponse.body, /Open dashboard/);
  assert.match(interestResponse.body, /https:\/\/meet\.google\.com\/private-ai-build/);

  assert.equal(state.repositories.events.findById(event.id).status, 'active');
  assert.equal(state.ledger.balanceForUser('user-creator').consumed, 2);
  assert.equal(state.ledger.balanceForUser('user-participant').consumed, 1);
  assert.equal(state.ledger.balanceForUser('user-participant').held, 0);

  const anonymousActiveDetail = await invoke(handler, {
    url: `/cohorts/${event.id}`,
    method: 'GET'
  });
  assert.equal(anonymousActiveDetail.status, 200);
  assert.match(anonymousActiveDetail.body, /Private link unlocked for members/);
  assert.doesNotMatch(anonymousActiveDetail.body, /private-ai-build/);

  const combinedDashboard = await invoke(handler, {
    url: '/dashboard',
    method: 'GET',
    headers: { cookie: participantCookie }
  });
  assert.equal(combinedDashboard.status, 200);
  assert.match(combinedDashboard.body, /My Cohorts &amp; Events/);
  assert.match(combinedDashboard.body, /Account Credits/);
  assert.match(combinedDashboard.body, /Active Cohorts &amp; Schedule/);
  assert.match(combinedDashboard.body, /Created Cohorts/);
  assert.match(combinedDashboard.body, /Interested Cohorts/);
  assert.match(combinedDashboard.body, /Practical AI Build Cohort/);
  assert.match(combinedDashboard.body, /src="\/assets\/default-cohort\.png"/);
  assert.match(combinedDashboard.body, /Seat confirmed/);
  assert.match(combinedDashboard.body, /https:\/\/meet\.google\.com\/private-ai-build/);
  assert.equal([...combinedDashboard.body.matchAll(/<h2>Available<\/h2>/g)].length, 1);
  assert.equal([...combinedDashboard.body.matchAll(/<h2>In use<\/h2>/g)].length, 1);
  assert.equal([...combinedDashboard.body.matchAll(/<h2>Used<\/h2>/g)].length, 1);
  assert.match(combinedDashboard.body, />5 credit\(s\)</);
  assert.match(combinedDashboard.body, />1 credit\(s\)</);
  assert.doesNotMatch(combinedDashboard.body, /Returned/);
  assert.doesNotMatch(combinedDashboard.body, /creator credits:/);
  assert.doesNotMatch(combinedDashboard.body, /participant credits:/);
  assert.doesNotMatch(combinedDashboard.body, /<h2>Demo Creator<\/h2>/);
  assert.doesNotMatch(combinedDashboard.body, /<h2>Demo Participant<\/h2>/);
});

test('MVP expiry path refunds held creator and participant credits and removes expired cohorts from public discovery', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state, {
    now: () => now,
    runtimeConfig: {
      appEnv: 'development',
      isProduction: false,
      appUrl: 'http://localhost:3000',
      auth: {},
      stripe: {},
      adminEmails: ['creator@example.test']
    }
  });
  const creatorCookie = await signIn(handler, 'user-creator');

  const createResponse = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    headers: { cookie: creatorCookie },
    body: encodeForm(validCreateInput({
      title: 'Slow Quorum Cohort',
      minQuorum: '2',
      lockedEventLink: 'https://meet.google.com/private-slow-quorum'
    }))
  });
  assert.equal(createResponse.status, 201);

  const [event] = state.repositories.events.list();
  const participantCookie = await signIn(handler, 'user-participant');
  const interestResponse = await invoke(handler, {
    url: `/cohorts/${event.id}/interest`,
    method: 'POST',
    headers: { cookie: participantCookie },
    body: ''
  });
  assert.equal(interestResponse.status, 200);
  assert.equal(state.repositories.events.findById(event.id).status, 'open');
  assert.equal(state.ledger.balanceForUser('user-creator').held, 2);
  assert.equal(state.ledger.balanceForUser('user-participant').held, 1);

  const expireResponse = await invoke(handler, {
    url: `/admin/expire-cohorts?now=${encodeURIComponent('2030-01-01T00:00:00.000Z')}`,
    method: 'POST',
    headers: { cookie: creatorCookie },
    body: ''
  });
  assert.equal(expireResponse.status, 200);
  assert.deepEqual(JSON.parse(expireResponse.body), {
    processedAt: '2030-01-01T00:00:00.000Z',
    expiredCount: 1,
    expiredEventIds: [event.id]
  });

  assert.equal(state.repositories.events.findById(event.id).status, 'expired');
  assert.equal(state.repositories.eventInterests.listByEvent(event.id)[0].status, 'refunded');
  assert.equal(state.ledger.balanceForUser('user-creator').held, 0);
  assert.equal(state.ledger.balanceForUser('user-creator').refunded, 2);
  assert.equal(state.ledger.balanceForUser('user-participant').held, 0);
  assert.equal(state.ledger.balanceForUser('user-participant').refunded, 1);

  const detail = await invoke(handler, {
    url: `/cohorts/${event.id}`,
    method: 'GET',
    headers: { cookie: creatorCookie }
  });
  assert.equal(detail.status, 404);
  assert.doesNotMatch(detail.body, /private-slow-quorum/);

  const feed = await invoke(handler, { url: '/cohorts', method: 'GET' });
  assert.equal(feed.status, 200);
  assert.doesNotMatch(feed.body, /Slow Quorum Cohort/);
});
