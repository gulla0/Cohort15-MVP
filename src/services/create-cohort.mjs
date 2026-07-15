import { DomainValidationError } from '../domain/validation.mjs';

const SUBMISSION_FIELDS = [
  'title', 'description', 'category', 'topic', 'targetAudience',
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
  if (!repositories?.createFundedCohort || !repositories?.createCohort) throw new TypeError('repositories are required');
  if (!limiter?.run) throw new TypeError('limiter is required');

  return Object.freeze({
    async create(input, { clientIp, actor } = {}) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new DomainValidationError('cohort', 'must be an object');
      }
      if (typeof (input.website ?? '') !== 'string' || (input.website ?? '').trim()) {
        throw new HoneypotSubmissionError();
      }

      const unknown = Object.keys(input).find(
        (field) => !['website', 'creatorEmail'].includes(field) && !SUBMISSION_FIELDS.includes(field),
      );
      if (unknown) throw new DomainValidationError(unknown, 'is not allowed');

      const submission = Object.fromEntries(SUBMISSION_FIELDS.map((field) => [field, input[field]]));
      const cohort = await limiter.run(clientIp, async () => {
        if (actor?.userId && actor?.email) {
          return (await repositories.createFundedCohort(submission, actor)).cohort;
        }
        // Retained only for internal legacy-data fixtures; HTTP mutations always supply an actor.
        return repositories.createCohort({ ...submission, creatorEmail: input.creatorEmail });
      });
      if (notifications) {
        try { await notifications.cohortCreated(cohort); } catch { /* submission already succeeded */ }
      }
      return cohort;
    },
  });
}
