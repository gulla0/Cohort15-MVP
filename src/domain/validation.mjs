import {
  DEFAULT_EXPIRY_DAYS,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  INTEREST_STATUSES,
  MAX_PARTICIPANTS,
  RECURRENCE_VALUES,
  SHOW_INTEREST_TOKEN_COST,
  SOCIAL_PLATFORMS,
  SOCIAL_POST_STATUSES,
  TARGET_SKILL_LEVELS,
  TOKEN_TRANSACTION_TYPES
} from './constants.mjs';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isWholeNumber(value) {
  return Number.isInteger(value);
}

function assertText(value, fieldName, errors) {
  if (!hasText(value)) {
    errors.push(`${fieldName} is required.`);
  }
}

function assertEnum(value, values, fieldName, errors) {
  if (!values.includes(value)) {
    errors.push(`${fieldName} must be one of: ${values.join(', ')}.`);
  }
}

function assertDate(value, fieldName, errors) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    errors.push(`${fieldName} must be a valid Date.`);
  }
}

function normalizeOptionalText(value) {
  return hasText(value) ? value.trim() : undefined;
}

function normalizeRequiredText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

export function computeDefaultExpiresAt(createdAt) {
  if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) {
    throw new Error('createdAt must be a valid Date.');
  }

  return new Date(createdAt.getTime() + DEFAULT_EXPIRY_DAYS * MS_PER_DAY);
}

export function validateEvent(event) {
  const errors = [];

  assertText(event?.id, 'id', errors);
  assertText(event?.creatorId, 'creatorId', errors);
  assertText(event?.title, 'title', errors);
  assertText(event?.description, 'description', errors);
  assertEnum(event?.category, EVENT_CATEGORIES, 'category', errors);
  assertText(event?.topic, 'topic', errors);
  assertText(event?.targetAudience, 'targetAudience', errors);
  assertEnum(event?.targetSkillLevel, TARGET_SKILL_LEVELS, 'targetSkillLevel', errors);
  assertEnum(event?.status, EVENT_STATUSES, 'status', errors);
  assertText(event?.lockedEventLink, 'lockedEventLink', errors);
  assertDate(event?.firstMeetingAt, 'firstMeetingAt', errors);
  assertEnum(event?.recurrence, RECURRENCE_VALUES, 'recurrence', errors);
  assertDate(event?.expiresAt, 'expiresAt', errors);
  assertEnum(event?.socialPostStatus, SOCIAL_POST_STATUSES, 'socialPostStatus', errors);
  assertDate(event?.createdAt, 'createdAt', errors);
  assertDate(event?.updatedAt, 'updatedAt', errors);

  if (!isWholeNumber(event?.minQuorum) || event.minQuorum < 1) {
    errors.push('minQuorum must be a whole number greater than 0.');
  }

  if (!isWholeNumber(event?.maxParticipants)) {
    errors.push('maxParticipants must be a whole number.');
  } else {
    if (isWholeNumber(event?.minQuorum) && event.maxParticipants < event.minQuorum) {
      errors.push('Max participants cannot be lower than quorum.');
    }

    if (event.maxParticipants > MAX_PARTICIPANTS) {
      errors.push('Max participants cannot be greater than 15.');
    }
  }

  if (!isWholeNumber(event?.meetingDurationMinutes) || event.meetingDurationMinutes <= 0) {
    errors.push('meetingDurationMinutes must be a whole number greater than 0.');
  }

  if (!isWholeNumber(event?.meetingCount)) {
    errors.push('meetingCount must be a whole number.');
  } else {
    if (event.meetingCount < 1) {
      errors.push('Event must have at least one meeting.');
    }

    if (event?.recurrence === 'none' && event.meetingCount !== 1) {
      errors.push('One-time events must have exactly one meeting.');
    }

    if (event?.recurrence && event.recurrence !== 'none' && event.meetingCount < 2) {
      errors.push('Repeating events must have at least two meetings.');
    }
  }

  return errors;
}

export function assertValidEvent(event) {
  const errors = validateEvent(event);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
}

export function buildEvent(input) {
  const createdAt = input.createdAt ?? new Date();
  const event = {
    id: normalizeRequiredText(input.id),
    creatorId: normalizeRequiredText(input.creatorId),
    title: normalizeRequiredText(input.title),
    description: normalizeRequiredText(input.description),
    category: input.category,
    topic: normalizeRequiredText(input.topic),
    targetAudience: normalizeRequiredText(input.targetAudience),
    targetSkillLevel: input.targetSkillLevel,
    additionalDetails: normalizeOptionalText(input.additionalDetails),
    minQuorum: input.minQuorum,
    maxParticipants: input.maxParticipants,
    status: input.status ?? 'open',
    lockedEventLink: normalizeRequiredText(input.lockedEventLink),
    firstMeetingAt: input.firstMeetingAt,
    meetingDurationMinutes: input.meetingDurationMinutes,
    recurrence: input.recurrence,
    meetingCount: input.meetingCount,
    expiresAt: input.expiresAt ?? computeDefaultExpiresAt(createdAt),
    socialPostStatus: input.socialPostStatus ?? 'pending',
    createdAt,
    updatedAt: input.updatedAt ?? createdAt
  };

  assertValidEvent(event);
  return event;
}

export function canViewLockedEventLink(event, viewer = {}) {
  if (event?.status !== 'active') {
    return false;
  }

  if (viewer.userId === event.creatorId) {
    return true;
  }

  return Array.isArray(viewer.interestedUserIds) && viewer.interestedUserIds.includes(viewer.userId);
}

export function serializeEventForViewer(event, viewer = {}) {
  const publicEvent = {
    ...event,
    lockedEventLink: undefined,
    linkVisibility: event.status === 'active' ? 'authorized_only' : 'locked_until_quorum'
  };

  if (canViewLockedEventLink(event, viewer)) {
    publicEvent.lockedEventLink = event.lockedEventLink;
    publicEvent.linkVisibility = 'visible';
  }

  return publicEvent;
}

export function validateEventInterest(interest) {
  const errors = [];

  assertText(interest?.id, 'id', errors);
  assertText(interest?.eventId, 'eventId', errors);
  assertText(interest?.userId, 'userId', errors);
  assertEnum(interest?.status, INTEREST_STATUSES, 'status', errors);
  assertDate(interest?.createdAt, 'createdAt', errors);

  if (interest?.tokensHeld !== SHOW_INTEREST_TOKEN_COST) {
    errors.push(`tokensHeld must be ${SHOW_INTEREST_TOKEN_COST}.`);
  }

  return errors;
}

export function validateTokenTransaction(transaction) {
  const errors = [];

  assertText(transaction?.id, 'id', errors);
  assertText(transaction?.userId, 'userId', errors);
  assertEnum(transaction?.type, TOKEN_TRANSACTION_TYPES, 'type', errors);
  assertDate(transaction?.createdAt, 'createdAt', errors);

  if (typeof transaction?.eventId !== 'undefined' && !hasText(transaction.eventId)) {
    errors.push('eventId must be non-empty when present.');
  }

  if (typeof transaction?.amount !== 'number' || !Number.isFinite(transaction.amount) || transaction.amount === 0) {
    errors.push('amount must be a non-zero finite number.');
  }

  return errors;
}

export function validateSocialPost(post) {
  const errors = [];

  assertText(post?.id, 'id', errors);
  assertText(post?.eventId, 'eventId', errors);
  assertEnum(post?.platform, SOCIAL_PLATFORMS, 'platform', errors);
  assertText(post?.postText, 'postText', errors);
  assertEnum(post?.status, SOCIAL_POST_STATUSES, 'status', errors);
  assertDate(post?.createdAt, 'createdAt', errors);

  if (typeof post?.postUrl !== 'undefined' && !hasText(post.postUrl)) {
    errors.push('postUrl must be non-empty when present.');
  }

  if (typeof post?.postedAt !== 'undefined') {
    assertDate(post.postedAt, 'postedAt', errors);
  }

  return errors;
}
