import { DomainValidationError } from '../domain/validation.mjs';
const FEEDBACK_ACTION_KEYS = Object.freeze([
  'openedCohortRequest',
  'startedCohortForm',
  'submittedCohortRequest',
  'openedCohortDetail',
  'submittedInterest',
  'readResearch',
]);

function text(value, field, maximum) {
  if (value == null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length > maximum) {
    throw new DomainValidationError(field, `must be at most ${maximum} characters`);
  }
  return normalized;
}

function parseActionContext(value) {
  if (value == null || value === '') return {};
  let parsed;
  try {
    parsed = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw new DomainValidationError('actionContext', 'must be valid JSON');
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DomainValidationError('actionContext', 'must be an object');
  }
  return Object.fromEntries(FEEDBACK_ACTION_KEYS.map((key) => [key, Boolean(parsed[key])]));
}

function path(value) {
  const normalized = text(value, 'path', 2048) ?? '/';
  if (!normalized.startsWith('/') || normalized.includes('\\')) {
    throw new DomainValidationError('path', 'must be a same-site path');
  }
  return normalized;
}

function step(value) {
  const normalized = Number(value ?? 0);
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 6) {
    throw new DomainValidationError('lastStep', 'must be between 0 and 6');
  }
  return normalized;
}

function bool(value) {
  return value === true || value === 'true' || value === '1';
}

function normalize(input) {
  const completionState = input.completionState === 'completed' ? 'completed' : 'partial';
  return {
    sessionId: text(input.sessionId, 'sessionId', 80),
    path: path(input.path),
    actionContext: parseActionContext(input.actionContext),
    lookingForGroup: text(input.lookingForGroup, 'lookingForGroup', 20),
    lookingForInstead: text(input.lookingForInstead, 'lookingForInstead', 1000),
    groupIntent: text(input.groupIntent, 'groupIntent', 20),
    didCreateOrJoin: text(input.didCreateOrJoin, 'didCreateOrJoin', 40),
    whyOrWhyNot: text(input.whyOrWhyNot, 'whyOrWhyNot', 2000),
    contactEmail: text(input.contactEmail, 'contactEmail', 254),
    contactX: text(input.contactX, 'contactX', 200),
    contactLinkedin: text(input.contactLinkedin, 'contactLinkedin', 500),
    contactOther: text(input.contactOther, 'contactOther', 500),
    completionState,
    lastStep: step(input.lastStep),
    submittedOnClose: bool(input.submittedOnClose),
    completedAt: completionState === 'completed' ? new Date().toISOString() : null,
  };
}

export function createFeedbackService({ repositories, limiter } = {}) {
  if (!repositories) throw new TypeError('repositories is required');

  return Object.freeze({
    async submit(input, { clientIp = 'unknown' } = {}) {
      const normalized = normalize(input);
      if (!normalized.sessionId) {
        throw new DomainValidationError('sessionId', 'is required');
      }
      const operation = () => repositories.upsertFeedback(normalized);
      return limiter ? limiter.run(clientIp, operation) : operation();
    },
  });
}
