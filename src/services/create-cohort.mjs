import { randomUUID } from 'node:crypto';
import { CREATE_EVENT_TOKEN_COST } from '../domain/constants.mjs';
import { buildEvent } from '../domain/validation.mjs';
import { createSocialPromotionService } from './social-promotion.mjs';

function parseInteger(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return Number.NaN;
  }

  return Number.parseInt(value, 10);
}

function parseDate(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  return new Date(value);
}

function normalizeCreateInput(input, options) {
  const createdAt = options.now();

  return {
    id: options.createEventId(),
    creatorId: input.creatorId,
    title: input.title,
    description: input.description,
    category: input.category,
    topic: input.topic,
    targetAudience: input.targetAudience,
    targetSkillLevel: input.targetSkillLevel,
    additionalDetails: input.additionalDetails,
    minQuorum: parseInteger(input.minQuorum),
    maxParticipants: parseInteger(input.maxParticipants),
    lockedEventLink: input.lockedEventLink,
    firstMeetingAt: parseDate(input.firstMeetingAt),
    meetingDurationMinutes: parseInteger(input.meetingDurationMinutes),
    recurrence: input.recurrence,
    meetingCount: parseInteger(input.meetingCount),
    createdAt
  };
}

export function createCohortService({ repositories, ledger, options = {} }) {
  const now = options.now ?? (() => new Date());
  const createEventId = options.createEventId ?? (() => `event-${randomUUID()}`);
  const socialPromotionService = options.socialPromotionService ?? createSocialPromotionService({
    repositories,
    options: {
      now,
      createPostId: options.createSocialPostId,
      publicBaseUrl: options.publicBaseUrl
    }
  });

  function create(input) {
    const event = buildEvent(normalizeCreateInput(input, { now, createEventId }));
    const creator = repositories.users.findById(event.creatorId);

    if (!creator) {
      throw new Error('Creator account was not found.');
    }

    ledger.hold(event.creatorId, event.id, CREATE_EVENT_TOKEN_COST);
    const savedEvent = repositories.events.save(event);
    const promotion = socialPromotionService.enqueueForEvent(savedEvent);

    return {
      event: promotion.event,
      creator,
      socialPost: promotion.post,
      tokenHoldAmount: CREATE_EVENT_TOKEN_COST,
      balance: ledger.balanceForUser(event.creatorId)
    };
  }

  return {
    create
  };
}
