import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createRequestHandler } from '../src/server/app.mjs';

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
    lockedEventLink: 'https://meet.example/private-ai-build',
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

test('MVP success path creates, promotes, unlocks, and exposes dashboards without leaking locked links early', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state);

  const createResponse = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    body: encodeForm(validCreateInput())
  });
  assert.equal(createResponse.status, 201);
  assert.match(createResponse.body, /Cohort created/);
  assert.match(createResponse.body, /Creator dashboard/);
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
  assert.match(publicDetail.body, /<option value="user-participant" selected>Demo Participant<\/option>/);
  assert.match(publicDetail.body, /src="\/assets\/default-cohort\.png"/);
  assert.doesNotMatch(publicDetail.body, /private-ai-build/);

  const interestResponse = await invoke(handler, {
    url: `/cohorts/${event.id}/interest`,
    method: 'POST',
    body: encodeForm({ userId: 'user-participant' })
  });
  assert.equal(interestResponse.status, 200);
  assert.match(interestResponse.body, /Quorum met/);
  assert.match(interestResponse.body, /Open participant dashboard/);
  assert.match(interestResponse.body, /https:\/\/meet\.example\/private-ai-build/);

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

  const creatorDashboard = await invoke(handler, {
    url: '/dashboard/creator?userId=user-creator',
    method: 'GET'
  });
  assert.equal(creatorDashboard.status, 200);
  assert.match(creatorDashboard.body, /Practical AI Build Cohort/);
  assert.match(creatorDashboard.body, /src="\/assets\/default-cohort\.png"/);
  assert.match(creatorDashboard.body, /https:\/\/meet\.example\/private-ai-build/);

  const participantDashboard = await invoke(handler, {
    url: '/dashboard/participant?userId=user-participant',
    method: 'GET'
  });
  assert.equal(participantDashboard.status, 200);
  assert.match(participantDashboard.body, /Seat confirmed/);
  assert.match(participantDashboard.body, /https:\/\/meet\.example\/private-ai-build/);
});

test('MVP expiry path refunds held creator and participant tokens and removes expired cohorts from public discovery', async () => {
  const state = createDemoRepositories();
  const handler = createRequestHandler(state);

  const createResponse = await invoke(handler, {
    url: '/cohorts/new',
    method: 'POST',
    body: encodeForm(validCreateInput({
      title: 'Slow Quorum Cohort',
      minQuorum: '2',
      lockedEventLink: 'https://meet.example/private-slow-quorum'
    }))
  });
  assert.equal(createResponse.status, 201);

  const [event] = state.repositories.events.list();
  const interestResponse = await invoke(handler, {
    url: `/cohorts/${event.id}/interest`,
    method: 'POST',
    body: encodeForm({ userId: 'user-participant' })
  });
  assert.equal(interestResponse.status, 200);
  assert.equal(state.repositories.events.findById(event.id).status, 'open');
  assert.equal(state.ledger.balanceForUser('user-creator').held, 2);
  assert.equal(state.ledger.balanceForUser('user-participant').held, 1);

  const expireResponse = await invoke(handler, {
    url: `/admin/expire-cohorts?now=${encodeURIComponent('2030-01-01T00:00:00.000Z')}`,
    method: 'POST'
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
    url: `/cohorts/${event.id}?viewerId=user-creator`,
    method: 'GET'
  });
  assert.equal(detail.status, 404);
  assert.doesNotMatch(detail.body, /private-slow-quorum/);

  const feed = await invoke(handler, { url: '/cohorts', method: 'GET' });
  assert.equal(feed.status, 200);
  assert.doesNotMatch(feed.body, /Slow Quorum Cohort/);
});
