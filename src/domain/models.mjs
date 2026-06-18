import { createHash, randomUUID } from 'node:crypto';

import { DELIVERY_STATUSES, NOTIFICATION_TYPES } from './constants.mjs';
import {
  assertKnownFields,
  DomainValidationError,
  normalizeCohortSubmission,
  normalizeEmail,
} from './validation.mjs';

const INTEREST_FIELDS = ['id', 'cohortId', 'email', 'createdAt'];
const DELIVERY_FIELDS = [
  'id', 'idempotencyKey', 'cohortId', 'interestId', 'recipientEmail', 'type',
  'status', 'attemptCount', 'providerErrorCode', 'createdAt', 'updatedAt', 'sentAt',
];

function instant(value, field, { nullable = false } = {}) {
  if (nullable && (value === null || value === undefined)) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new DomainValidationError(field, 'must be a valid instant');
  return parsed.toISOString();
}

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DomainValidationError(field, 'is required');
  }
  return value.trim();
}

function allowedEnum(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw new DomainValidationError(field, `must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

export function notificationIdempotencyKey({ type, cohortId, interestId, recipientEmail }) {
  const normalizedType = allowedEnum(type, 'type', NOTIFICATION_TYPES);
  const normalizedCohortId = requiredString(cohortId, 'cohortId');
  if (normalizedType === 'creator_confirmation') {
    return `creator_confirmation:${normalizedCohortId}`;
  }
  if (normalizedType === 'participant_confirmation') {
    return `participant_confirmation:${requiredString(interestId, 'interestId')}`;
  }
  const recipientDigest = createHash('sha256')
    .update(normalizeEmail(recipientEmail, 'recipientEmail'))
    .digest('hex');
  return `quorum_met:${normalizedCohortId}:${recipientDigest}`;
}

export function createCohort(input, { id = randomUUID(), now = new Date() } = {}) {
  const normalized = normalizeCohortSubmission(input, { createdAt: now });
  return Object.freeze({
    id: requiredString(id, 'id'),
    creatorEmail: normalized.creatorEmail,
    title: normalized.title,
    description: normalized.description,
    category: normalized.category,
    topic: normalized.topic,
    targetAudience: normalized.targetAudience,
    targetSkillLevel: normalized.targetSkillLevel,
    additionalDetails: normalized.additionalDetails,
    minQuorum: normalized.minQuorum,
    meetingLink: normalized.meetingLink,
    creatorTimeZone: normalized.creatorTimeZone,
    firstMeetingAt: normalized.firstMeetingAt,
    firstMeetingLocal: normalized.firstMeetingLocal,
    meetingDurationMinutes: normalized.meetingDurationMinutes,
    recurrence: normalized.recurrence,
    meetingCount: normalized.meetingCount,
    createdAt: normalized.createdAt,
    updatedAt: normalized.createdAt,
    expiresAt: normalized.expiresAt,
    quorumMetAt: null,
  });
}

export function createInterest(input, { id = randomUUID(), now = new Date() } = {}) {
  assertKnownFields(input, ['cohortId', 'email'], 'interest');
  return Object.freeze({
    id: requiredString(id, 'id'),
    cohortId: requiredString(input.cohortId, 'cohortId'),
    email: normalizeEmail(input.email),
    createdAt: instant(now, 'createdAt'),
  });
}

export function hydrateInterest(record) {
  assertKnownFields(record, INTEREST_FIELDS, 'interest');
  return Object.freeze({
    id: requiredString(record.id, 'id'),
    cohortId: requiredString(record.cohortId, 'cohortId'),
    email: normalizeEmail(record.email),
    createdAt: instant(record.createdAt, 'createdAt'),
  });
}

export function createNotificationDelivery(input, { id = randomUUID(), now = new Date() } = {}) {
  assertKnownFields(input, [
    'idempotencyKey', 'cohortId', 'interestId', 'recipientEmail', 'type',
    'status', 'attemptCount', 'providerErrorCode', 'sentAt',
  ], 'notificationDelivery');
  const timestamp = instant(now, 'createdAt');
  const type = allowedEnum(input.type, 'type', NOTIFICATION_TYPES);
  const expectedIdempotencyKey = notificationIdempotencyKey({
    type,
    cohortId: input.cohortId,
    interestId: input.interestId,
    recipientEmail: input.recipientEmail,
  });
  if (input.idempotencyKey !== expectedIdempotencyKey) {
    throw new DomainValidationError('idempotencyKey', 'must match the deterministic notification key');
  }
  const attemptCount = input.attemptCount ?? 0;
  if (!Number.isInteger(attemptCount) || attemptCount < 0) {
    throw new DomainValidationError('attemptCount', 'must be a non-negative integer');
  }
  return Object.freeze({
    id: requiredString(id, 'id'),
    idempotencyKey: expectedIdempotencyKey,
    cohortId: requiredString(input.cohortId, 'cohortId'),
    interestId: input.interestId == null ? null : requiredString(input.interestId, 'interestId'),
    recipientEmail: normalizeEmail(input.recipientEmail, 'recipientEmail'),
    type,
    status: allowedEnum(input.status ?? 'pending', 'status', DELIVERY_STATUSES),
    attemptCount,
    providerErrorCode: input.providerErrorCode == null
      ? null
      : requiredString(input.providerErrorCode, 'providerErrorCode'),
    createdAt: timestamp,
    updatedAt: timestamp,
    sentAt: instant(input.sentAt, 'sentAt', { nullable: true }),
  });
}

export function hydrateNotificationDelivery(record) {
  assertKnownFields(record, DELIVERY_FIELDS, 'notificationDelivery');
  const base = createNotificationDelivery({
    idempotencyKey: record.idempotencyKey,
    cohortId: record.cohortId,
    interestId: record.interestId,
    recipientEmail: record.recipientEmail,
    type: record.type,
    status: record.status,
    attemptCount: record.attemptCount,
    providerErrorCode: record.providerErrorCode,
    sentAt: record.sentAt,
  }, { id: record.id, now: record.createdAt });
  return Object.freeze({
    ...base,
    updatedAt: instant(record.updatedAt, 'updatedAt'),
  });
}
