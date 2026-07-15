import {
  createCohort,
  createCreditTransaction,
  createFeedback,
  createInterest,
  createNotificationDelivery,
  createPurchase,
  createSession,
  createStripeEvent,
  createUser,
  hydrateFeedback,
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

export class InsufficientCreditsError extends RepositoryConflictError {
  constructor(balance, required) {
    super('insufficient_credits', `requires ${required} credits; ${balance.available} available`);
    this.name = 'InsufficientCreditsError';
    this.balance = balance;
    this.required = required;
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

  function requireUser(id) {
    const user = store.getUser(id);
    if (!user) throw new RepositoryNotFoundError('user', id);
    return user;
  }

  function creditBalance(userId) {
    const totals = { funded: 0, available: 0, held: 0, consumed: 0, refunded: 0 };
    for (const transaction of store.listCreditTransactionsByUserId(userId)) {
      if (transaction.type === 'grant' || transaction.type === 'purchase') totals.funded += transaction.amount;
      if (transaction.type === 'hold') totals.held += transaction.amount;
      if (transaction.type === 'consume') {
        totals.held -= transaction.amount;
        totals.consumed += transaction.amount;
      }
      if (transaction.type === 'refund') {
        totals.held -= transaction.amount;
        totals.refunded += transaction.amount;
      }
    }
    totals.available = totals.funded - totals.held - totals.consumed;
    if (totals.available < 0 || totals.held < 0) throw new Error('credit ledger invariant violated');
    return Object.freeze(totals);
  }

  function requireHold(userId, holdId) {
    const hold = store.getCreditTransaction(holdId);
    if (!hold || hold.type !== 'hold' || hold.userId !== userId) {
      throw new RepositoryConflictError('invalid_hold', 'credit hold does not belong to user');
    }
    return hold;
  }

  function settledAmount(holdId) {
    let total = 0;
    for (const transaction of store.listCreditTransactionsByUserId(store.getCreditTransaction(holdId)?.userId)) {
      if ((transaction.type === 'consume' || transaction.type === 'refund') && transaction.source === holdId) total += transaction.amount;
    }
    return total;
  }

  function findCohortHold(userId, cohortId, source) {
    return store.listCreditTransactionsByUserId(userId).find((transaction) => (
      transaction.type === 'hold' && transaction.cohortId === cohortId && transaction.source === source
    ));
  }

  function insertSettlement(type, hold, cohortId, timestamp, id = randomUUID()) {
    if (!hold || settledAmount(hold.id) !== 0) return null;
    const transaction = createCreditTransaction({
      userId: hold.userId,
      type,
      amount: hold.amount,
      idempotencyKey: `${type}:${hold.id}`,
      cohortId,
      purchaseId: null,
      source: hold.id,
    }, { id, now: timestamp });
    if (!store.insertCreditTransaction(transaction)) {
      return store.getCreditTransactionByIdempotencyKey(transaction.idempotencyKey);
    }
    return transaction;
  }

  async function settleExpiredCreditHolds(userId, currentNow = now()) {
    requireUser(userId);
    return store.withLock(`credits:${userId}`, async () => {
      const refunded = [];
      for (const hold of store.listCreditTransactionsByUserId(userId)) {
        if (hold.type !== 'hold' || settledAmount(hold.id) !== 0 || !hold.cohortId) continue;
        const cohort = store.getCohort(hold.cohortId);
        if (!cohort || cohort.quorumMetAt != null || collectionStatus(cohort, currentNow) !== 'expired') continue;
        const transaction = insertSettlement('refund', hold, cohort.id, currentNow);
        if (transaction) refunded.push(transaction);
      }
      return Object.freeze({ refunded: Object.freeze(refunded), balance: creditBalance(userId) });
    });
  }

  return Object.freeze({
    async provisionUser(input, options = {}) {
      const normalizedEmail = normalizeEmail(input.email);
      return store.withLock(`identity:${input.supabaseSubject}:${normalizedEmail}`, async () => {
        const bySubject = store.getUserBySupabaseSubject(input.supabaseSubject);
        const byEmail = store.getUserByEmail(normalizedEmail);
        if ((bySubject && bySubject.email !== normalizedEmail)
          || (byEmail && byEmail.supabaseSubject !== input.supabaseSubject)) {
          throw new RepositoryConflictError('identity_conflict', 'verified identity conflicts with an existing account');
        }
        let user = bySubject ?? byEmail;
        let created = false;
        if (!user) {
          user = createUser({ supabaseSubject: input.supabaseSubject, email: normalizedEmail }, {
            id: options.id ?? randomUUID(), now: options.now ?? now(),
          });
          if (!store.insertUser(user)) throw new RepositoryConflictError('identity_conflict');
          created = true;
        }
        const key = `signup_grant:${user.id}`;
        let grant = store.getCreditTransactionByIdempotencyKey(key);
        let grantCreated = false;
        if (!grant) {
          grant = createCreditTransaction({
            userId: user.id, type: 'grant', amount: 2, idempotencyKey: key,
            source: 'signup_grant', cohortId: null, purchaseId: null,
          }, { id: options.grantId ?? randomUUID(), now: options.now ?? now() });
          if (!store.insertCreditTransaction(grant)) {
            grant = store.getCreditTransactionByIdempotencyKey(key);
            if (!grant) throw new RepositoryConflictError('duplicate_credit_transaction');
          }
          else grantCreated = true;
        }
        return Object.freeze({ user, created, grant, grantCreated });
      });
    },

    async getUserById(id) { return requireUser(id); },
    async getUserBySupabaseSubject(subject) {
      const user = store.getUserBySupabaseSubject(subject);
      if (!user) throw new RepositoryNotFoundError('user', subject);
      return user;
    },
    async getUserByEmail(email) {
      const normalized = normalizeEmail(email);
      const user = store.getUserByEmail(normalized);
      if (!user) throw new RepositoryNotFoundError('user', normalized);
      return user;
    },

    async createSession(input, options = {}) {
      requireUser(input.userId);
      const session = createSession(input, { id: options.id ?? randomUUID(), now: options.now ?? now() });
      if (!store.insertSession(session)) throw new RepositoryConflictError('duplicate_session');
      return session;
    },
    async getSessionByTokenDigest(tokenDigest, options = {}) {
      const session = store.getSessionByTokenDigest(tokenDigest);
      if (!session || Date.parse(session.expiresAt) <= new Date(options.now ?? now()).valueOf()) {
        if (session) store.deleteSessionByTokenDigest(tokenDigest);
        throw new RepositoryNotFoundError('session', tokenDigest);
      }
      return Object.freeze({ ...session, user: requireUser(session.userId) });
    },
    async deleteSessionByTokenDigest(tokenDigest) { return store.deleteSessionByTokenDigest(tokenDigest); },

    async getCreditBalance(userId, options = {}) {
      return (await settleExpiredCreditHolds(userId, options.now ?? now())).balance;
    },
    async settleExpiredCreditHolds(userId, options = {}) {
      return settleExpiredCreditHolds(userId, options.now ?? now());
    },
    async listCreditTransactionsByUserId(userId) { requireUser(userId); return store.listCreditTransactionsByUserId(userId); },

    async holdCredits(input, options = {}) {
      requireUser(input.userId);
      return store.withLock(`credits:${input.userId}`, async () => {
        const existing = store.getCreditTransactionByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          if (existing.userId !== input.userId || existing.type !== 'hold' || existing.amount !== input.amount) {
            throw new RepositoryConflictError('idempotency_mismatch');
          }
          return Object.freeze({ transaction: existing, created: false, balance: creditBalance(input.userId) });
        }
        const balance = creditBalance(input.userId);
        if (!Number.isInteger(input.amount) || input.amount <= 0) {
          createCreditTransaction({ ...input, type: 'hold' }, { id: options.id ?? randomUUID(), now: options.now ?? now() });
        }
        if (balance.available < input.amount) throw new InsufficientCreditsError(balance, input.amount);
        const transaction = createCreditTransaction({
          userId: input.userId, type: 'hold', amount: input.amount,
          idempotencyKey: input.idempotencyKey, cohortId: input.cohortId ?? null,
          purchaseId: null, source: input.source ?? null,
        }, { id: options.id ?? randomUUID(), now: options.now ?? now() });
        if (!store.insertCreditTransaction(transaction)) throw new RepositoryConflictError('duplicate_credit_transaction');
        return Object.freeze({ transaction, created: true, balance: creditBalance(input.userId) });
      });
    },

    async consumeCreditHold(input, options = {}) {
      requireUser(input.userId);
      return store.withLock(`credits:${input.userId}`, async () => {
        const existing = store.getCreditTransactionByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          if (existing.userId !== input.userId || existing.type !== 'consume' || existing.source !== input.holdId) {
            throw new RepositoryConflictError('idempotency_mismatch');
          }
          return Object.freeze({ transaction: existing, created: false, balance: creditBalance(input.userId) });
        }
        const hold = requireHold(input.userId, input.holdId);
        if (settledAmount(hold.id) !== 0) throw new RepositoryConflictError('hold_settled');
        const transaction = createCreditTransaction({
          userId: input.userId, type: 'consume', amount: hold.amount,
          idempotencyKey: input.idempotencyKey, cohortId: input.cohortId ?? hold.cohortId,
          purchaseId: null, source: hold.id,
        }, { id: options.id ?? randomUUID(), now: options.now ?? now() });
        store.insertCreditTransaction(transaction);
        return Object.freeze({ transaction, created: true, balance: creditBalance(input.userId) });
      });
    },

    async refundCreditHold(input, options = {}) {
      requireUser(input.userId);
      return store.withLock(`credits:${input.userId}`, async () => {
        const existing = store.getCreditTransactionByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          if (existing.userId !== input.userId || existing.type !== 'refund' || existing.source !== input.holdId) {
            throw new RepositoryConflictError('idempotency_mismatch');
          }
          return Object.freeze({ transaction: existing, created: false, balance: creditBalance(input.userId) });
        }
        const hold = requireHold(input.userId, input.holdId);
        if (settledAmount(hold.id) !== 0) throw new RepositoryConflictError('hold_settled');
        const transaction = createCreditTransaction({
          userId: input.userId, type: 'refund', amount: hold.amount,
          idempotencyKey: input.idempotencyKey, cohortId: input.cohortId ?? hold.cohortId,
          purchaseId: null, source: hold.id,
        }, { id: options.id ?? randomUUID(), now: options.now ?? now() });
        store.insertCreditTransaction(transaction);
        return Object.freeze({ transaction, created: true, balance: creditBalance(input.userId) });
      });
    },

    async createPendingPurchase(input, options = {}) {
      requireUser(input.userId);
      const purchase = createPurchase({ ...input, status: 'pending' }, { id: options.id ?? randomUUID(), now: options.now ?? now() });
      if (!store.insertPurchase(purchase)) throw new RepositoryConflictError('duplicate_purchase');
      return purchase;
    },
    async setPurchaseCheckoutSession(purchaseId, stripeCheckoutSessionId, options = {}) {
      return store.withLock(`purchase:${purchaseId}`, async () => {
        const purchase = store.getPurchase(purchaseId);
        if (!purchase) throw new RepositoryNotFoundError('purchase', purchaseId);
        if (purchase.stripeCheckoutSessionId != null && purchase.stripeCheckoutSessionId !== stripeCheckoutSessionId) {
          throw new RepositoryConflictError('purchase_mismatch');
        }
        const updated = Object.freeze({
          ...purchase, stripeCheckoutSessionId,
          updatedAt: new Date(options.now ?? now()).toISOString(),
        });
        if (!store.updatePurchase(updated)) throw new RepositoryConflictError('duplicate_checkout_session');
        return updated;
      });
    },
    async getPurchaseById(id) {
      const purchase = store.getPurchase(id);
      if (!purchase) throw new RepositoryNotFoundError('purchase', id);
      return purchase;
    },
    async getPurchaseByStripeCheckoutSessionId(id) {
      const purchase = store.getPurchaseByStripeCheckoutSessionId(id);
      if (!purchase) throw new RepositoryNotFoundError('purchase', id);
      return purchase;
    },

    async fulfillPurchase(input, options = {}) {
      return store.withLock(`purchase:${input.purchaseId}`, async () => {
        const purchase = store.getPurchase(input.purchaseId);
        if (!purchase) throw new RepositoryNotFoundError('purchase', input.purchaseId);
        const matches = purchase.userId === input.userId
          && purchase.packageId === input.packageId
          && purchase.credits === input.credits
          && purchase.amountCents === input.amountCents
          && purchase.currency === String(input.currency).toLowerCase()
          && purchase.stripeCheckoutSessionId === input.stripeCheckoutSessionId;
        if (!matches) throw new RepositoryConflictError('purchase_mismatch');
        const key = `purchase:${purchase.id}`;
        const prior = store.getCreditTransactionByIdempotencyKey(key);
        if (purchase.status === 'fulfilled') {
          return Object.freeze({ purchase, transaction: prior, fulfilled: false });
        }
        const transaction = createCreditTransaction({
          userId: purchase.userId, type: 'purchase', amount: purchase.credits,
          idempotencyKey: key, cohortId: null, purchaseId: purchase.id, source: 'stripe',
        }, { id: options.transactionId ?? randomUUID(), now: options.now ?? now() });
        if (!store.insertCreditTransaction(transaction)) throw new RepositoryConflictError('duplicate_credit_transaction');
        const timestamp = new Date(options.now ?? now()).toISOString();
        const fulfilled = Object.freeze({
          ...purchase, status: 'fulfilled', stripePaymentIntentId: input.stripePaymentIntentId ?? null,
          fulfilledAt: timestamp, updatedAt: timestamp,
        });
        store.updatePurchase(fulfilled);
        return Object.freeze({ purchase: fulfilled, transaction, fulfilled: true });
      });
    },

    async recordStripeEvent(input, options = {}) {
      return store.withLock(`stripe-event:${input.eventId}`, async () => {
        const existing = store.getStripeEvent(input.eventId);
        if (existing) return Object.freeze({ event: existing, created: false });
        const event = createStripeEvent(input, { now: options.now ?? now() });
        store.insertStripeEvent(event);
        return Object.freeze({ event, created: true });
      });
    },
    async getStripeEventById(eventId) {
      const event = store.getStripeEvent(eventId);
      if (!event) throw new RepositoryNotFoundError('stripeEvent', eventId);
      return event;
    },

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

    async createFundedCohort(input, actor, options = {}) {
      const user = requireUser(actor.userId);
      if (normalizeEmail(actor.email) !== user.email) throw new RepositoryConflictError('identity_conflict');
      const timestamp = options.now ?? now();
      const cohort = createCohort({ ...input, creatorEmail: user.email, creatorUserId: user.id }, {
        id: options.id ?? randomUUID(), now: timestamp,
      });
      const hold = createCreditTransaction({
        userId: user.id, type: 'hold', amount: 2,
        idempotencyKey: `cohort:${cohort.id}:creator_hold`, cohortId: cohort.id,
        purchaseId: null, source: 'cohort_creation',
      }, { id: options.holdId ?? randomUUID(), now: timestamp });
      await settleExpiredCreditHolds(user.id, timestamp);
      return store.withLock(`credits:${user.id}`, async () => {
        const balance = creditBalance(user.id);
        if (balance.available < 2) throw new InsufficientCreditsError(balance, 2);
        if (store.getCreditTransactionByIdempotencyKey(hold.idempotencyKey)) {
          throw new RepositoryConflictError('duplicate_cohort');
        }
        if (!store.insertCohort(cohort)) throw new RepositoryConflictError('duplicate_cohort');
        if (!store.insertCreditTransaction(hold)) throw new RepositoryConflictError('duplicate_credit_transaction');
        return Object.freeze({ cohort, hold, balance: creditBalance(user.id) });
      });
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
        if (interest.userId != null && interest.userId === cohort.creatorUserId) {
          throw new RepositoryConflictError('creator_user', 'creator account cannot count toward quorum');
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
        if (interest.userId != null && store.getInterestByCohortAndUserId(interest.cohortId, interest.userId)) {
          throw new RepositoryConflictError('duplicate_user', 'account already counted for cohort');
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

    async acceptFundedInterest(input, actor, options = {}) {
      const user = requireUser(actor.userId);
      if (normalizeEmail(actor.email) !== user.email) throw new RepositoryConflictError('identity_conflict');
      const timestamp = options.now ?? now();
      const interest = createInterest({ cohortId: input.cohortId, email: user.email, userId: user.id }, {
        id: options.id ?? randomUUID(), now: timestamp,
      });
      const hold = createCreditTransaction({
        userId: user.id, type: 'hold', amount: 1,
        idempotencyKey: `cohort:${interest.cohortId}:interest:${user.id}`,
        cohortId: interest.cohortId, purchaseId: null, source: 'cohort_interest',
      }, { id: options.holdId ?? randomUUID(), now: timestamp });

      await settleExpiredCreditHolds(user.id, timestamp);

      return store.withCohortLock(interest.cohortId, async () => {
        const cohort = await requireCohort(interest.cohortId);
        if (user.email === cohort.creatorEmail || user.id === cohort.creatorUserId) {
          throw new RepositoryConflictError('creator_user');
        }
        if (cohort.quorumMetAt != null) throw new RepositoryConflictError('already_met');
        if (collectionStatus(cohort, timestamp) !== 'active') throw new RepositoryConflictError('expired');
        if (store.getInterestByCohortAndEmail(cohort.id, user.email)
          || store.getInterestByCohortAndUserId(cohort.id, user.id)) {
          throw new RepositoryConflictError('duplicate_user');
        }

        return store.withLock(`credits:${user.id}`, async () => {
          const balance = creditBalance(user.id);
          if (balance.available < 1) throw new InsufficientCreditsError(balance, 1);
          if (!store.insertCreditTransaction(hold)) throw new RepositoryConflictError('duplicate_credit_transaction');
          if (!store.insertInterest(interest)) throw new RepositoryConflictError('duplicate_user');

          const interestCount = store.countInterestsByCohortId(cohort.id);
          const reachedQuorum = interestCount >= cohort.minQuorum;
          const storedCohort = reachedQuorum
            ? store.updateCohort({ ...cohort, quorumMetAt: interest.createdAt, updatedAt: interest.createdAt })
            : cohort;
          const consumed = [];
          if (reachedQuorum) {
            const accountActions = [
              ...(cohort.creatorUserId ? [{ userId: cohort.creatorUserId, source: 'cohort_creation' }] : []),
              ...store.listInterestsByCohortId(cohort.id)
                .filter((item) => item.userId != null)
                .map((item) => ({ userId: item.userId, source: 'cohort_interest' })),
            ];
            for (const action of accountActions) {
              const actionHold = findCohortHold(action.userId, cohort.id, action.source);
              const transaction = insertSettlement('consume', actionHold, cohort.id, timestamp);
              if (transaction) consumed.push(transaction);
            }
          }
          return Object.freeze({
            interest, cohort: storedCohort, interestCount, reachedQuorum, hold,
            consumed: Object.freeze(consumed), balance: creditBalance(user.id),
          });
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

    async upsertFeedback(input, options = {}) {
      const prior = store.getFeedbackBySessionId(input.sessionId);
      const feedback = createFeedback(input, {
        id: prior?.id ?? options.id ?? randomUUID(),
        now: prior?.createdAt ?? options.now ?? now(),
      });
      const currentNow = new Date(options.updatedAt ?? options.now ?? now()).toISOString();
      return hydrateFeedback(store.upsertFeedback({
        ...feedback,
        createdAt: prior?.createdAt ?? feedback.createdAt,
        updatedAt: currentNow,
        completedAt: feedback.completionState === 'completed'
          ? feedback.completedAt ?? currentNow
          : null,
      }));
    },

    async getFeedbackBySessionId(sessionId) {
      const feedback = store.getFeedbackBySessionId(sessionId);
      if (!feedback) throw new RepositoryNotFoundError('feedback', sessionId);
      return hydrateFeedback(feedback);
    },

    async listFeedback() {
      return store.listFeedback().map(hydrateFeedback);
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
