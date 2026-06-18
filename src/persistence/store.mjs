export function createLofiStore() {
  const cohorts = new Map();
  const interestsById = new Map();
  const interestsByCohort = new Map();
  const interestKeys = new Map();
  const deliveriesById = new Map();
  const deliveriesByKey = new Map();
  const locks = new Map();

  function clone(record) {
    return record == null ? record : { ...record };
  }

  function interestKey(cohortId, email) {
    return `${cohortId}:${email}`;
  }

  async function withCohortLock(cohortId, operation) {
    const prior = locks.get(cohortId) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => {
      release = resolve;
    });
    const queued = prior.then(() => current);
    locks.set(cohortId, queued);
    await prior;
    try {
      return await operation();
    } finally {
      release();
      if (locks.get(cohortId) === queued) locks.delete(cohortId);
    }
  }

  return Object.freeze({
    insertCohort(record) {
      if (cohorts.has(record.id)) return false;
      cohorts.set(record.id, clone(record));
      return true;
    },

    getCohort(id) {
      return clone(cohorts.get(id));
    },

    listCohorts() {
      return [...cohorts.values()].map(clone);
    },

    updateCohort(record) {
      cohorts.set(record.id, clone(record));
      return clone(record);
    },

    async withCohortLock(cohortId, operation) {
      return withCohortLock(cohortId, operation);
    },

    insertInterest(record) {
      const key = interestKey(record.cohortId, record.email);
      if (interestKeys.has(key) || interestsById.has(record.id)) return false;
      interestsById.set(record.id, clone(record));
      interestKeys.set(key, record.id);
      const existing = interestsByCohort.get(record.cohortId) ?? [];
      interestsByCohort.set(record.cohortId, [...existing, record.id]);
      return true;
    },

    getInterestByCohortAndEmail(cohortId, email) {
      const id = interestKeys.get(interestKey(cohortId, email));
      return clone(id == null ? null : interestsById.get(id));
    },

    listInterestsByCohortId(cohortId) {
      const ids = interestsByCohort.get(cohortId) ?? [];
      return ids.map((id) => clone(interestsById.get(id)));
    },

    countInterestsByCohortId(cohortId) {
      return (interestsByCohort.get(cohortId) ?? []).length;
    },

    insertNotificationDelivery(record) {
      if (deliveriesByKey.has(record.idempotencyKey) || deliveriesById.has(record.id)) {
        return false;
      }
      deliveriesById.set(record.id, clone(record));
      deliveriesByKey.set(record.idempotencyKey, record.id);
      return true;
    },

    getNotificationDeliveryByIdempotencyKey(idempotencyKey) {
      const id = deliveriesByKey.get(idempotencyKey);
      return clone(id == null ? null : deliveriesById.get(id));
    },

    updateNotificationDelivery(record) {
      deliveriesById.set(record.id, clone(record));
      deliveriesByKey.set(record.idempotencyKey, record.id);
      return clone(record);
    },

    listNotificationDeliveriesByCohortId(cohortId) {
      return [...deliveriesById.values()]
        .filter((delivery) => delivery.cohortId === cohortId)
        .map(clone);
    },
  });
}
