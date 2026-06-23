import {
  createCohort,
  createInterest,
  createNotificationDelivery,
  hydrateNotificationDelivery,
} from '../domain/models.mjs';
import {
  collectionStatus,
  normalizeEmail,
  serializePublicCohort,
} from '../domain/validation.mjs';

export class RepositoryConflictError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'RepositoryConflictError';
    this.code = code;
  }
}

export class RepositoryNotFoundError extends Error {
  constructor(entity, id) {
    super(`${entity} not found: ${id}`);
    this.name = 'RepositoryNotFoundError';
    this.entity = entity;
    this.id = id;
  }
}

function comparePublicCohorts(left, right) {
  const leftActive = left.collectionStatus === 'active';
  const rightActive = right.collectionStatus === 'active';
  if (leftActive !== rightActive) return leftActive ? -1 : 1;

  if (leftActive) {
    const created = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    if (created !== 0) return created;
  } else {
    const expired = Date.parse(right.expiresAt) - Date.parse(left.expiresAt);
    if (expired !== 0) return expired;
  }

  return left.id.localeCompare(right.id);
}

export function sortPublicCohorts(cohorts) {
  return [...cohorts].sort(comparePublicCohorts);
}

export function createLocalRepositories({
  store,
  now = () => new Date(),
  randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
  if (!store) throw new TypeError('store is required');

  async function requireCohort(id) {
    const cohort = store.getCohort(id);
    if (!cohort) throw new RepositoryNotFoundError('cohort', id);
    return cohort;
  }

  function buildPublicCohort(cohort, currentNow) {
    return serializePublicCohort(cohort, {
      interestCount: store.countInterestsByCohortId(cohort.id),
      now: currentNow,
    });
  }

  return Object.freeze({
    async createCohort(input, options = {}) {
      const cohort = createCohort(input, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      if (!store.insertCohort(cohort)) {
        throw new RepositoryConflictError('duplicate_cohort', `cohort already exists: ${cohort.id}`);
      }
      return cohort;
    },

    async getCohortById(id) {
      return requireCohort(id);
    },

    async listCohorts() {
      return store.listCohorts();
    },

    async getPublicCohortById(id, options = {}) {
      return buildPublicCohort(await requireCohort(id), options.now ?? now());
    },

    async listPublicCohorts(options = {}) {
      const currentNow = options.now ?? now();
      return sortPublicCohorts(store.listCohorts().map((cohort) => buildPublicCohort(cohort, currentNow)));
    },

    async acceptInterest(input, options = {}) {
      const interest = createInterest(input, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });

      return store.withCohortLock(interest.cohortId, async () => {
        const cohort = await requireCohort(interest.cohortId);
        if (interest.email === cohort.creatorEmail) {
          throw new RepositoryConflictError('creator_email', 'creator email cannot count toward quorum');
        }
        if (cohort.quorumMetAt != null) {
          throw new RepositoryConflictError('already_met', 'cohort already reached quorum');
        }
        if (collectionStatus(cohort, interest.createdAt) !== 'active') {
          throw new RepositoryConflictError('expired', 'cohort collection window has closed');
        }
        if (store.getInterestByCohortAndEmail(interest.cohortId, interest.email)) {
          throw new RepositoryConflictError('duplicate_email', 'email already counted for cohort');
        }
        if (!store.insertInterest(interest)) {
          throw new RepositoryConflictError('duplicate_email', 'email already counted for cohort');
        }

        const interestCount = store.countInterestsByCohortId(interest.cohortId);
        let storedCohort = cohort;
        let reachedQuorum = false;
        if (interestCount >= cohort.minQuorum && cohort.quorumMetAt == null) {
          storedCohort = store.updateCohort({
            ...cohort,
            quorumMetAt: interest.createdAt,
            updatedAt: interest.createdAt,
          });
          reachedQuorum = true;
        }

        return Object.freeze({
          interest,
          cohort: storedCohort,
          interestCount,
          reachedQuorum,
        });
      });
    },

    async listInterestsByCohortId(cohortId) {
      await requireCohort(cohortId);
      return store.listInterestsByCohortId(cohortId);
    },

    async countInterestsByCohortId(cohortId) {
      await requireCohort(cohortId);
      return store.countInterestsByCohortId(cohortId);
    },

    async ensureNotificationDelivery(input, options = {}) {
      const delivery = createNotificationDelivery(input, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      const existing = store.getNotificationDeliveryByIdempotencyKey(delivery.idempotencyKey);
      if (existing) {
        return Object.freeze({ delivery: existing, created: false });
      }
      if (!store.insertNotificationDelivery(delivery)) {
        return Object.freeze({
          delivery: store.getNotificationDeliveryByIdempotencyKey(delivery.idempotencyKey),
          created: false,
        });
      }
      return Object.freeze({ delivery, created: true });
    },

    async recordNotificationOutcome(idempotencyKey, outcome, options = {}) {
      const delivery = store.getNotificationDeliveryByIdempotencyKey(idempotencyKey);
      if (!delivery) throw new RepositoryNotFoundError('notificationDelivery', idempotencyKey);

      const currentNow = new Date(options.now ?? now()).toISOString();
      const nextStatus = outcome.status ?? delivery.status;
      const updated = hydrateNotificationDelivery({
        ...delivery,
        status: nextStatus,
        attemptCount: outcome.attemptCount ?? delivery.attemptCount,
        providerErrorCode: outcome.providerErrorCode ?? null,
        sentAt: nextStatus === 'sent'
          ? outcome.sentAt ?? delivery.sentAt ?? currentNow
          : outcome.sentAt ?? null,
        updatedAt: currentNow,
      });

      return store.updateNotificationDelivery(updated);
    },

    async getNotificationDeliveryByIdempotencyKey(idempotencyKey) {
      const delivery = store.getNotificationDeliveryByIdempotencyKey(idempotencyKey);
      if (!delivery) throw new RepositoryNotFoundError('notificationDelivery', idempotencyKey);
      return delivery;
    },

    async listNotificationDeliveriesByCohortId(cohortId) {
      await requireCohort(cohortId);
      return store.listNotificationDeliveriesByCohortId(cohortId);
    },

    normalizeEmail,
  });
}
