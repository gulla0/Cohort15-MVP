import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoRepositories } from '../src/persistence/seeds.mjs';
import { createCohortService } from '../src/services/create-cohort.mjs';
import { buildSocialPostText } from '../src/services/social-promotion.mjs';

const now = new Date('2026-06-01T12:00:00.000Z');

function validInput(overrides = {}) {
  return {
    creatorId: 'user-creator',
    title: 'Beginner TypeScript Build Cohort',
    description: 'Build small TypeScript projects together.',
    category: 'build',
    topic: 'TypeScript',
    targetAudience: 'Beginner developers who know basic JavaScript.',
    targetSkillLevel: 'beginner',
    minQuorum: '5',
    maxParticipants: '8',
    lockedEventLink: 'https://meet.example/private-room',
    firstMeetingAt: '2026-06-20T18:00:00.000Z',
    meetingDurationMinutes: '90',
    recurrence: 'weekly',
    meetingCount: '4',
    ...overrides
  };
}

function createServiceFixture() {
  const state = createDemoRepositories();
  const service = createCohortService({
    ...state,
    options: {
      now: () => now,
      createEventId: () => 'event-created',
      createSocialPostId: () => 'social-post-created',
      publicBaseUrl: 'https://cohort15.example'
    }
  });

  return {
    ...state,
    service
  };
}

test('social post text includes public cohort details and excludes private links', () => {
  const event = {
    id: 'event-created',
    title: 'Beginner TypeScript Build Cohort',
    topic: 'TypeScript',
    targetSkillLevel: 'beginner',
    description: 'Build small TypeScript projects together.',
    minQuorum: 5,
    lockedEventLink: 'https://meet.example/private-room'
  };

  const postText = buildSocialPostText(event, { publicBaseUrl: 'https://cohort15.example' });

  assert.match(postText, /Beginner TypeScript Build Cohort/);
  assert.match(postText, /Topic: TypeScript/);
  assert.match(postText, /Skill level: beginner/);
  assert.match(postText, /Build small TypeScript projects together/);
  assert.match(postText, /Quorum needed: 5/);
  assert.match(postText, /https:\/\/cohort15\.example\/cohorts\/event-created/);
  assert.doesNotMatch(postText, /private-room/);
});

test('creating a cohort writes a local social-promotion outbox record', () => {
  const { repositories, service } = createServiceFixture();

  const result = service.create(validInput());

  assert.equal(result.socialPost.id, 'social-post-created');
  assert.equal(result.socialPost.eventId, 'event-created');
  assert.equal(result.socialPost.platform, 'x');
  assert.equal(result.socialPost.status, 'pending');
  assert.equal(result.event.socialPostStatus, 'pending');
  assert.equal(repositories.events.findById('event-created').socialPostStatus, 'pending');

  const posts = repositories.socialPosts.listByEvent('event-created');
  assert.equal(posts.length, 1);
  assert.match(posts[0].postText, /Beginner TypeScript Build Cohort/);
  assert.match(posts[0].postText, /https:\/\/cohort15\.example\/cohorts\/event-created/);
  assert.doesNotMatch(posts[0].postText, /meet\.example/);
});
