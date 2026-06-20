import { DomainValidationError, normalizeEmail } from '../domain/validation.mjs';

export class InterestHoneypotSubmissionError extends Error {
  constructor() {
    super('Invalid submission');
    this.name = 'InterestHoneypotSubmissionError';
  }
}

export function createShowInterestService({
  repositories,
  limiter,
  notifications = null,
  logger = console,
} = {}) {
  if (!repositories?.acceptInterest) throw new TypeError('repositories are required');
  if (!limiter?.run) throw new TypeError('limiter is required');

  return Object.freeze({
    async show(cohortId, input, { clientIp } = {}) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new DomainValidationError('interest', 'must be an object');
      }
      const unknown = Object.keys(input).find((field) => !['email', 'website'].includes(field));
      if (unknown) throw new DomainValidationError(unknown, 'is not allowed');
      if (typeof (input.website ?? '') !== 'string' || (input.website ?? '').trim()) {
        throw new InterestHoneypotSubmissionError();
      }

      const email = normalizeEmail(input.email);
      const result = await limiter.run(clientIp, () => repositories.acceptInterest({ cohortId, email }));
      if (notifications) {
        try {
          await notifications.interestAccepted(result);
        } catch {
          logger.error('notification_processing_failed', {
            operation: 'interest_accepted',
            cohortId: result.cohort.id,
          });
        }
      }
      return result;
    },
  });
}
