import { randomUUID } from 'node:crypto';

function publicEventUrl(baseUrl, eventId) {
  return `${baseUrl.replace(/\/$/, '')}/cohorts/${encodeURIComponent(eventId)}`;
}

export function buildSocialPostText(event, options = {}) {
  const baseUrl = options.publicBaseUrl ?? 'http://localhost:3000';
  return [
    `New Cohort15 cohort: ${event.title}`,
    `Topic: ${event.topic}`,
    `Skill level: ${event.targetSkillLevel}`,
    event.description,
    `Quorum needed: ${event.minQuorum}`,
    `Public page: ${publicEventUrl(baseUrl, event.id)}`
  ].join('\n');
}

export function createSocialPromotionService({ repositories, options = {} }) {
  const now = options.now ?? (() => new Date());
  const createPostId = options.createPostId ?? (() => `social-post-${randomUUID()}`);
  const platform = options.platform ?? 'x';
  const publicBaseUrl = options.publicBaseUrl ?? 'http://localhost:3000';

  function enqueueForEvent(event) {
    const post = repositories.socialPosts.save({
      id: createPostId(),
      eventId: event.id,
      platform,
      postText: buildSocialPostText(event, { publicBaseUrl }),
      status: 'pending',
      createdAt: now()
    });

    const updatedEvent = repositories.events.save({
      ...event,
      socialPostStatus: post.status,
      updatedAt: event.updatedAt
    });

    return {
      event: updatedEvent,
      post
    };
  }

  return {
    enqueueForEvent
  };
}
