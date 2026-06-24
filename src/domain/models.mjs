import { createHash, randomUUID } from 'node:crypto';

import { DELIVERY_STATUSES, NOTIFICATION_TYPES } from './constants.mjs';
import {
  assertKnownFields,
  DomainValidationError,
  normalizeCohortSubmission,
  normalizeEmail,
} from './validation.mjs';

const INTEREST_FIELDS = ['id', 'cohortId', 'email', 'createdAt'];
const FEEDBACK_FIELDS = [
  'id', 'sessionId', 'path', 'actionContext', 'lookingForGroup', 'lookingForInstead',
  'groupIntent', 'didCreateOrJoin', 'whyOrWhyNot', 'contactEmail', 'contactX',
  'contactLinkedin', 'contactOther', 'completionState', 'lastStep', 'submittedOnClose',
  'createdAt', 'updatedAt', 'completedAt',
];
const DELIVERY_FIELDS = [
  'id', 'idempotencyKey', 'cohortId', 'interestId', 'recipientEmail', 'type',
  'status', 'attemptCount', 'providerErrorCode', 'createdAt', 'updatedAt', 'sentAt',
];

export const FEEDBACK_LOOKING_FOR_GROUP_VALUES = Object.freeze(['yes', 'no', 'not_sure']);
export const FEEDBACK_GROUP_INTENT_VALUES = Object.freeze(['create', 'join', 'both']);
export const FEEDBACK_DID_CREATE_OR_JOIN_VALUES = Object.freeze([
  'created', 'joined', 'both', 'not_yet', 'tried_but_stopped',
]);
export const FEEDBACK_COMPLETION_STATES = Object.freeze(['partial', 'completed']);

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

function optionalEnum(value, field, allowed) {
  if (value === null || value === undefined || value === '') return null;
  return allowedEnum(value, field, allowed);
}

function optionalTrimmedString(value, field, { maximum = 500 } = {}) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length > maximum) {
    throw new DomainValidationError(field, `must be at most ${maximum} characters`);
  }
  return normalized;
}

function normalizedPath(value) {
  const path = optionalTrimmedString(value, 'path', { maximum: 2048 }) ?? '/';
  if (!path.startsWith('/') || path.includes('\\')) {
    throw new DomainValidationError('path', 'must be a same-site path');
  }
  return path;
}

function normalizedFeedbackContext(value) {
  if (value === null || value === undefined || value === '') return Object.freeze({});
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new DomainValidationError('actionContext', 'must be an object');
  }
  const allowed = new Set([
    'openedCohortRequest', 'startedCohortForm', 'submittedCohortRequest',
    'openedCohortDetail', 'submittedInterest', 'readResearch',
  ]);
  const context = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!allowed.has(key)) continue;
    context[key] = Boolean(entry);
  }
  return Object.freeze(context);
}

function nullableEmail(value, field) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return normalizeEmail(value, field);
}

function normalizedStep(value) {
  const step = Number(value ?? 0);
  if (!Number.isInteger(step) || step < 0 || step > 6) {
    throw new DomainValidationError('lastStep', 'must be between 0 and 6');
  }
  return step;
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

export function createFeedback(input, { id = randomUUID(), now = new Date() } = {}) {
  assertKnownFields(input, [
    'sessionId', 'path', 'actionContext', 'lookingForGroup', 'lookingForInstead',
    'groupIntent', 'didCreateOrJoin', 'whyOrWhyNot', 'contactEmail', 'contactX',
    'contactLinkedin', 'contactOther', 'completionState', 'lastStep', 'submittedOnClose',
    'completedAt',
  ], 'feedback');
  const timestamp = instant(now, 'createdAt');
  const completionState = allowedEnum(input.completionState ?? 'partial', 'completionState', FEEDBACK_COMPLETION_STATES);
  const completedAt = completionState === 'completed'
    ? instant(input.completedAt ?? timestamp, 'completedAt')
    : null;
  return Object.freeze({
    id: requiredString(id, 'id'),
    sessionId: requiredString(input.sessionId, 'sessionId'),
    path: normalizedPath(input.path),
    actionContext: normalizedFeedbackContext(input.actionContext),
    lookingForGroup: optionalEnum(input.lookingForGroup, 'lookingForGroup', FEEDBACK_LOOKING_FOR_GROUP_VALUES),
    lookingForInstead: optionalTrimmedString(input.lookingForInstead, 'lookingForInstead', { maximum: 1000 }),
    groupIntent: optionalEnum(input.groupIntent, 'groupIntent', FEEDBACK_GROUP_INTENT_VALUES),
    didCreateOrJoin: optionalEnum(input.didCreateOrJoin, 'didCreateOrJoin', FEEDBACK_DID_CREATE_OR_JOIN_VALUES),
    whyOrWhyNot: optionalTrimmedString(input.whyOrWhyNot, 'whyOrWhyNot', { maximum: 2000 }),
    contactEmail: nullableEmail(input.contactEmail, 'contactEmail'),
    contactX: optionalTrimmedString(input.contactX, 'contactX', { maximum: 200 }),
    contactLinkedin: optionalTrimmedString(input.contactLinkedin, 'contactLinkedin', { maximum: 500 }),
    contactOther: optionalTrimmedString(input.contactOther, 'contactOther', { maximum: 500 }),
    completionState,
    lastStep: normalizedStep(input.lastStep),
    submittedOnClose: Boolean(input.submittedOnClose),
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt,
  });
}

export function hydrateFeedback(record) {
  assertKnownFields(record, FEEDBACK_FIELDS, 'feedback');
  const base = createFeedback({
    sessionId: record.sessionId,
    path: record.path,
    actionContext: record.actionContext,
    lookingForGroup: record.lookingForGroup,
    lookingForInstead: record.lookingForInstead,
    groupIntent: record.groupIntent,
    didCreateOrJoin: record.didCreateOrJoin,
    whyOrWhyNot: record.whyOrWhyNot,
    contactEmail: record.contactEmail,
    contactX: record.contactX,
    contactLinkedin: record.contactLinkedin,
    contactOther: record.contactOther,
    completionState: record.completionState,
    lastStep: record.lastStep,
    submittedOnClose: record.submittedOnClose,
    completedAt: record.completedAt,
  }, { id: record.id, now: record.createdAt });
  return Object.freeze({
    ...base,
    updatedAt: instant(record.updatedAt, 'updatedAt'),
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
