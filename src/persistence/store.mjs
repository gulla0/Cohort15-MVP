export function createLofiStore() {
  const cohorts = new Map();
  const interestsById = new Map();
  const interestsByCohort = new Map();
  const interestKeys = new Map();
  const interestUserKeys = new Map();
  const feedbackById = new Map();
  const feedbackBySession = new Map();
  const deliveriesById = new Map();
  const deliveriesByKey = new Map();
  const usersById = new Map();
  const usersBySubject = new Map();
  const usersByEmail = new Map();
  const sessionsById = new Map();
  const sessionsByTokenDigest = new Map();
  const creditTransactionsById = new Map();
  const creditTransactionsByKey = new Map();
  const creditTransactionsByUser = new Map();
  const purchasesById = new Map();
  const purchasesByCheckoutSession = new Map();
  const stripeEventsById = new Map();
  const locks = new Map();

  function clone(record) {
    return record == null ? record : { ...record };
  }

  function interestKey(cohortId, email) {
    return `${cohortId}:${email}`;
  }

  function interestUserKey(cohortId, userId) { return `${cohortId}:${userId}`; }

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

  async function withLock(key, operation) {
    return withCohortLock(`record:${key}`, operation);
  }

  return Object.freeze({
    insertCohort(record) {
      if (cohorts.has(record.id)) return false;
      cohorts.set(record.id, clone({ ...record, creatorUserId: record.creatorUserId ?? null }));
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

    async withLock(key, operation) {
      return withLock(key, operation);
    },

    insertInterest(record) {
      const key = interestKey(record.cohortId, record.email);
      const userKey = record.userId == null ? null : interestUserKey(record.cohortId, record.userId);
      if (interestKeys.has(key) || (userKey != null && interestUserKeys.has(userKey)) || interestsById.has(record.id)) return false;
      interestsById.set(record.id, clone({ ...record, userId: record.userId ?? null }));
      interestKeys.set(key, record.id);
      if (userKey != null) interestUserKeys.set(userKey, record.id);
      const existing = interestsByCohort.get(record.cohortId) ?? [];
      interestsByCohort.set(record.cohortId, [...existing, record.id]);
      return true;
    },

    getInterestByCohortAndEmail(cohortId, email) {
      const id = interestKeys.get(interestKey(cohortId, email));
      return clone(id == null ? null : interestsById.get(id));
    },

    getInterestByCohortAndUserId(cohortId, userId) {
      const id = interestUserKeys.get(interestUserKey(cohortId, userId));
      return clone(id == null ? null : interestsById.get(id));
    },

    listInterestsByCohortId(cohortId) {
      const ids = interestsByCohort.get(cohortId) ?? [];
      return ids.map((id) => clone(interestsById.get(id)));
    },

    countInterestsByCohortId(cohortId) {
      return (interestsByCohort.get(cohortId) ?? []).length;
    },

    upsertFeedback(record) {
      const existingId = feedbackBySession.get(record.sessionId);
      const id = existingId ?? record.id;
      const existing = existingId == null ? null : feedbackById.get(existingId);
      const next = {
        ...record,
        id,
        createdAt: existing?.createdAt ?? record.createdAt,
      };
      feedbackById.set(id, clone(next));
      feedbackBySession.set(record.sessionId, id);
      return clone(next);
    },

    getFeedbackBySessionId(sessionId) {
      const id = feedbackBySession.get(sessionId);
      return clone(id == null ? null : feedbackById.get(id));
    },

    listFeedback() {
      return [...feedbackById.values()].map(clone);
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

    insertUser(record) {
      if (usersById.has(record.id) || usersBySubject.has(record.supabaseSubject) || usersByEmail.has(record.email)) return false;
      usersById.set(record.id, clone(record));
      usersBySubject.set(record.supabaseSubject, record.id);
      usersByEmail.set(record.email, record.id);
      return true;
    },

    getUser(id) { return clone(usersById.get(id)); },
    getUserBySupabaseSubject(subject) { return clone(usersById.get(usersBySubject.get(subject))); },
    getUserByEmail(email) { return clone(usersById.get(usersByEmail.get(email))); },

    insertSession(record) {
      if (sessionsById.has(record.id) || sessionsByTokenDigest.has(record.tokenDigest)) return false;
      sessionsById.set(record.id, clone(record));
      sessionsByTokenDigest.set(record.tokenDigest, record.id);
      return true;
    },
    getSessionByTokenDigest(digest) { return clone(sessionsById.get(sessionsByTokenDigest.get(digest))); },
    deleteSessionByTokenDigest(digest) {
      const id = sessionsByTokenDigest.get(digest);
      if (id == null) return false;
      sessionsByTokenDigest.delete(digest);
      sessionsById.delete(id);
      return true;
    },

    insertCreditTransaction(record) {
      if (creditTransactionsById.has(record.id) || creditTransactionsByKey.has(record.idempotencyKey)) return false;
      creditTransactionsById.set(record.id, clone(record));
      creditTransactionsByKey.set(record.idempotencyKey, record.id);
      const ids = creditTransactionsByUser.get(record.userId) ?? [];
      creditTransactionsByUser.set(record.userId, [...ids, record.id]);
      return true;
    },
    getCreditTransaction(id) { return clone(creditTransactionsById.get(id)); },
    getCreditTransactionByIdempotencyKey(key) { return clone(creditTransactionsById.get(creditTransactionsByKey.get(key))); },
    listCreditTransactionsByUserId(userId) {
      return (creditTransactionsByUser.get(userId) ?? []).map((id) => clone(creditTransactionsById.get(id)));
    },

    insertPurchase(record) {
      if (purchasesById.has(record.id)) return false;
      if (record.stripeCheckoutSessionId != null && purchasesByCheckoutSession.has(record.stripeCheckoutSessionId)) return false;
      purchasesById.set(record.id, clone(record));
      if (record.stripeCheckoutSessionId != null) purchasesByCheckoutSession.set(record.stripeCheckoutSessionId, record.id);
      return true;
    },
    getPurchase(id) { return clone(purchasesById.get(id)); },
    getPurchaseByStripeCheckoutSessionId(id) { return clone(purchasesById.get(purchasesByCheckoutSession.get(id))); },
    updatePurchase(record) {
      const prior = purchasesById.get(record.id);
      if (!prior) return null;
      const owner = record.stripeCheckoutSessionId == null ? null : purchasesByCheckoutSession.get(record.stripeCheckoutSessionId);
      if (owner != null && owner !== record.id) return null;
      if (prior.stripeCheckoutSessionId != null && prior.stripeCheckoutSessionId !== record.stripeCheckoutSessionId) {
        purchasesByCheckoutSession.delete(prior.stripeCheckoutSessionId);
      }
      purchasesById.set(record.id, clone(record));
      if (record.stripeCheckoutSessionId != null) purchasesByCheckoutSession.set(record.stripeCheckoutSessionId, record.id);
      return clone(record);
    },

    insertStripeEvent(record) {
      if (stripeEventsById.has(record.eventId)) return false;
      stripeEventsById.set(record.eventId, clone(record));
      return true;
    },
    getStripeEvent(eventId) { return clone(stripeEventsById.get(eventId)); },
  });
}
