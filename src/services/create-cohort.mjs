import { DomainValidationError } from '../domain/validation.mjs';

const SUBMISSION_FIELDS = [
  'creatorEmail', 'title', 'description', 'category', 'topic', 'targetAudience',
  'targetSkillLevel', 'additionalDetails', 'minQuorum', 'meetingLink',
  'creatorTimeZone', 'firstMeetingLocal', 'meetingDurationMinutes', 'recurrence',
  'meetingCount',
];

export class HoneypotSubmissionError extends Error {
  constructor() {
    super('Invalid submission');
    this.name = 'HoneypotSubmissionError';
  }
}

export function createCohortService({ repositories, limiter, notifications = null }) {
  if (!repositories?.createCohort) throw new TypeError('repositories are required');
  if (!limiter?.run) throw new TypeError('limiter is required');

  return Object.freeze({
    async create(input, { clientIp } = {}) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new DomainValidationError('cohort', 'must be an object');
      }
      if (typeof (input.website ?? '') !== 'string' || (input.website ?? '').trim()) {
        throw new HoneypotSubmissionError();
      }

      const unknown = Object.keys(input).find(
        (field) => field !== 'website' && !SUBMISSION_FIELDS.includes(field),
      );
      if (unknown) throw new DomainValidationError(unknown, 'is not allowed');

      const submission = Object.fromEntries(SUBMISSION_FIELDS.map((field) => [field, input[field]]));
      const cohort = await limiter.run(clientIp, () => repositories.createCohort(submission));
      if (notifications) {
        try { await notifications.cohortCreated(cohort); } catch { /* submission already succeeded */ }
      }
      return cohort;
    },
  });
}
