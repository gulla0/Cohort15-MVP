import {
  APPROVED_MEETING_HOSTS,
  CATEGORIES,
  COLLECTION_WINDOW_MS,
  NUMBER_LIMITS,
  RECURRENCES,
  TARGET_SKILL_LEVELS,
  TEXT_LIMITS,
} from './constants.mjs';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;
const LOCAL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/u;
const SUBMISSION_FIELDS = Object.freeze([
  'creatorEmail', 'title', 'description', 'category', 'topic', 'targetAudience',
  'targetSkillLevel', 'additionalDetails', 'minQuorum', 'meetingLink',
  'creatorTimeZone', 'firstMeetingLocal', 'meetingDurationMinutes',
  'recurrence', 'meetingCount',
]);

export class DomainValidationError extends Error {
  constructor(field, rule) {
    super(`${field}: ${rule}`);
    this.name = 'DomainValidationError';
    this.field = field;
    this.rule = rule;
  }
}

function fail(field, rule) {
  throw new DomainValidationError(field, rule);
}

export function assertKnownFields(value, allowedFields, boundary = 'object') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(boundary, 'must be an object');
  }
  const allowed = new Set(allowedFields);
  const unknown = Object.keys(value).find((field) => !allowed.has(field));
  if (unknown) fail(unknown, 'is not allowed');
}

function stringValue(value, field, { optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) return undefined;
    fail(field, 'is required');
  }
  if (typeof value !== 'string') fail(field, 'must be a string');
  const normalized = value.trim();
  if (!normalized) {
    if (optional) return undefined;
    fail(field, 'is required');
  }
  return normalized;
}

function textValue(value, field, { optional = false } = {}) {
  const normalized = stringValue(value, field, { optional });
  if (normalized === undefined) return undefined;
  const length = [...normalized].length;
  const { min, max } = TEXT_LIMITS[field];
  if (length < min) fail(field, `must be at least ${min} characters`);
  if (length > max) fail(field, `must be at most ${max} characters`);
  return normalized;
}

export function normalizeEmail(value, field = 'email') {
  const normalized = stringValue(value, field).toLowerCase();
  if ([...normalized].length > TEXT_LIMITS.email.max) {
    fail(field, `must be at most ${TEXT_LIMITS.email.max} characters`);
  }
  if (!EMAIL_PATTERN.test(normalized)) fail(field, 'must be a valid email address');
  return normalized;
}

function enumValue(value, field, allowed) {
  const normalized = stringValue(value, field);
  if (!allowed.includes(normalized)) fail(field, `must be one of: ${allowed.join(', ')}`);
  return normalized;
}

function integerValue(value, field, { min, max }) {
  const normalized = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(normalized)) fail(field, 'must be an integer');
  if (normalized < min || normalized > max) fail(field, `must be from ${min} through ${max}`);
  return normalized;
}

export function validateTimeZone(value) {
  const timeZone = textValue(value, 'creatorTimeZone');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
  } catch {
    fail('creatorTimeZone', 'must be a valid IANA timezone');
  }
  return timeZone;
}

export function validateMeetingLink(value) {
  const meetingLink = textValue(value, 'meetingLink');
  let parsed;
  try {
    parsed = new URL(meetingLink);
  } catch {
    fail('meetingLink', 'must be a valid URL');
  }
  if (parsed.protocol !== 'https:') fail('meetingLink', 'must use HTTPS');
  if (parsed.username || parsed.password) fail('meetingLink', 'must not contain credentials');
  if (parsed.port) fail('meetingLink', 'must not use a nonstandard port');
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/u, '');
  const approved = APPROVED_MEETING_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
  if (!approved) fail('meetingLink', 'must use an approved meeting host');
  return parsed.toString();
}

function parseLocalDateTime(value) {
  const normalized = stringValue(value, 'firstMeetingLocal');
  const match = LOCAL_DATE_TIME_PATTERN.exec(normalized);
  if (!match) fail('firstMeetingLocal', 'must use YYYY-MM-DDTHH:mm with minute precision');
  const [, year, month, day, hour, minute, second = '00'] = match;
  const parts = {
    year: Number(year), month: Number(month), day: Number(day),
    hour: Number(hour), minute: Number(minute),
  };
  const check = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  if (
    check.getUTCFullYear() !== parts.year
    || check.getUTCMonth() + 1 !== parts.month
    || check.getUTCDate() !== parts.day
    || check.getUTCHours() !== parts.hour
    || check.getUTCMinutes() !== parts.minute
    || Number(second) > 59
  ) fail('firstMeetingLocal', 'must be a real calendar date and time');
  return {
    normalized: `${year}-${month}-${day}T${hour}:${minute}`,
    parts,
  };
}

const formatterCache = new Map();
function formatter(timeZone) {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }));
  }
  return formatterCache.get(timeZone);
}

function zonedParts(instantMs, timeZone) {
  const values = {};
  for (const part of formatter(timeZone).formatToParts(new Date(instantMs))) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }
  return values;
}

function sameLocal(left, right) {
  return ['year', 'month', 'day', 'hour', 'minute'].every((key) => left[key] === right[key]);
}

function possibleOffsets(localEpoch, timeZone) {
  const offsets = new Set();
  for (let hours = -48; hours <= 48; hours += 6) {
    const instant = localEpoch + hours * 60 * 60 * 1000;
    const local = zonedParts(instant, timeZone);
    const representedAsUtc = Date.UTC(
      local.year, local.month - 1, local.day, local.hour, local.minute, local.second,
    );
    offsets.add(representedAsUtc - instant);
  }
  return [...offsets];
}

function resolvePartsToInstant(parts, timeZone) {
  const localEpoch = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const offsets = possibleOffsets(localEpoch, timeZone);
  const exact = offsets
    .map((offset) => localEpoch - offset)
    .filter((instant) => sameLocal(zonedParts(instant, timeZone), parts))
    .sort((left, right) => left - right);
  if (exact.length) return new Date(exact[0]);

  const positiveGaps = [];
  for (const before of offsets) {
    for (const after of offsets) {
      if (after > before) positiveGaps.push(after - before);
    }
  }
  for (const gap of [...new Set(positiveGaps)].sort((left, right) => left - right)) {
    const shifted = new Date(localEpoch + gap);
    const shiftedParts = {
      year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(), hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes(),
    };
    const resolved = offsets
      .map((offset) => Date.UTC(
        shiftedParts.year, shiftedParts.month - 1, shiftedParts.day,
        shiftedParts.hour, shiftedParts.minute,
      ) - offset)
      .filter((instant) => sameLocal(zonedParts(instant, timeZone), shiftedParts))
      .sort((left, right) => left - right);
    if (resolved.length) return new Date(resolved[0]);
  }
  fail('firstMeetingLocal', 'cannot be resolved in the creator timezone');
}

export function localDateTimeToInstant(value, timeZone) {
  const { parts } = typeof value === 'string' ? parseLocalDateTime(value) : value;
  return resolvePartsToInstant(parts, validateTimeZone(timeZone));
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function meetingLocalParts(first, recurrence, index) {
  const base = new Date(Date.UTC(first.year, first.month - 1, first.day, first.hour, first.minute));
  if (recurrence === 'daily') base.setUTCDate(base.getUTCDate() + index);
  if (recurrence === 'weekly') base.setUTCDate(base.getUTCDate() + index * 7);
  if (recurrence === 'biweekly') base.setUTCDate(base.getUTCDate() + index * 14);
  if (recurrence === 'monthly') {
    const monthIndex = first.month - 1 + index;
    const year = first.year + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12 + 1;
    return { ...first, year, month, day: Math.min(first.day, daysInMonth(year, month)) };
  }
  return {
    year: base.getUTCFullYear(), month: base.getUTCMonth() + 1, day: base.getUTCDate(),
    hour: first.hour, minute: first.minute,
  };
}

export function generateMeetingStarts(cohort) {
  const { parts } = parseLocalDateTime(cohort.firstMeetingLocal);
  const timeZone = validateTimeZone(cohort.creatorTimeZone);
  return Array.from({ length: cohort.meetingCount }, (_, index) => (
    resolvePartsToInstant(meetingLocalParts(parts, cohort.recurrence, index), timeZone).toISOString()
  ));
}

export function finalMeetingEndsAt(cohort) {
  const starts = generateMeetingStarts(cohort);
  return new Date(
    Date.parse(starts.at(-1)) + cohort.meetingDurationMinutes * 60 * 1000,
  ).toISOString();
}

export function normalizeCohortSubmission(input, { createdAt = new Date() } = {}) {
  assertKnownFields(input, SUBMISSION_FIELDS, 'cohort');
  const acceptedAt = new Date(createdAt);
  if (Number.isNaN(acceptedAt.valueOf())) fail('createdAt', 'must be a valid instant');
  const creatorTimeZone = validateTimeZone(input.creatorTimeZone);
  const { normalized: firstMeetingLocal } = parseLocalDateTime(input.firstMeetingLocal);
  const firstMeetingAt = localDateTimeToInstant(firstMeetingLocal, creatorTimeZone);
  const expiresAt = new Date(acceptedAt.valueOf() + COLLECTION_WINDOW_MS);
  if (firstMeetingAt <= expiresAt) fail('firstMeetingAt', 'must be later than expiresAt');

  const recurrence = enumValue(input.recurrence, 'recurrence', RECURRENCES);
  const meetingCount = recurrence === 'none'
    ? integerValue(input.meetingCount, 'meetingCount', { min: 1, max: 1 })
    : integerValue(input.meetingCount, 'meetingCount', NUMBER_LIMITS.recurringMeetingCount);

  return Object.freeze({
    creatorEmail: normalizeEmail(input.creatorEmail, 'creatorEmail'),
    title: textValue(input.title, 'title'),
    description: textValue(input.description, 'description'),
    category: enumValue(input.category, 'category', CATEGORIES),
    topic: textValue(input.topic, 'topic'),
    targetAudience: textValue(input.targetAudience, 'targetAudience'),
    targetSkillLevel: enumValue(input.targetSkillLevel, 'targetSkillLevel', TARGET_SKILL_LEVELS),
    additionalDetails: textValue(input.additionalDetails, 'additionalDetails', { optional: true }),
    minQuorum: integerValue(input.minQuorum, 'minQuorum', NUMBER_LIMITS.minQuorum),
    meetingLink: validateMeetingLink(input.meetingLink),
    creatorTimeZone,
    firstMeetingAt: firstMeetingAt.toISOString(),
    firstMeetingLocal,
    meetingDurationMinutes: integerValue(
      input.meetingDurationMinutes,
      'meetingDurationMinutes',
      NUMBER_LIMITS.meetingDurationMinutes,
    ),
    recurrence,
    meetingCount,
    createdAt: acceptedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

export function collectionStatus(cohort, now = new Date()) {
  return new Date(now) < new Date(cohort.expiresAt) ? 'active' : 'expired';
}

export function quorumStatus(cohort) {
  return cohort.quorumMetAt == null ? 'gathering' : 'met';
}

export function acceptsInterest(cohort, now = new Date()) {
  return collectionStatus(cohort, now) === 'active' && quorumStatus(cohort) === 'gathering';
}

export function serializePublicCohort(cohort, { interestCount = 0, now = new Date() } = {}) {
  const finalEndsAt = finalMeetingEndsAt(cohort);
  const result = {
    id: cohort.id,
    title: cohort.title,
    description: cohort.description,
    category: cohort.category,
    topic: cohort.topic,
    targetAudience: cohort.targetAudience,
    targetSkillLevel: cohort.targetSkillLevel,
    ...(cohort.additionalDetails === undefined ? {} : { additionalDetails: cohort.additionalDetails }),
    minQuorum: cohort.minQuorum,
    creatorTimeZone: cohort.creatorTimeZone,
    firstMeetingAt: cohort.firstMeetingAt,
    firstMeetingLocal: cohort.firstMeetingLocal,
    meetingDurationMinutes: cohort.meetingDurationMinutes,
    recurrence: cohort.recurrence,
    meetingCount: cohort.meetingCount,
    createdAt: cohort.createdAt,
    updatedAt: cohort.updatedAt,
    expiresAt: cohort.expiresAt,
    quorumMetAt: cohort.quorumMetAt,
    finalMeetingEndsAt: finalEndsAt,
    interestCount,
    collectionStatus: collectionStatus(cohort, now),
    quorumStatus: quorumStatus(cohort),
  };
  if (cohort.quorumMetAt != null && new Date(now) < new Date(finalEndsAt)) {
    result.meetingLink = cohort.meetingLink;
  }
  return Object.freeze(result);
}
