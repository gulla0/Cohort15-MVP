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
  hydrateInterest,
  hydrateNotificationDelivery,
} from '../domain/models.mjs';
import { normalizeEmail, serializePublicCohort } from '../domain/validation.mjs';
import {
  InsufficientCreditsError,
  RepositoryConflictError,
  RepositoryNotFoundError,
  sortPublicCohorts,
} from './repositories.mjs';

export const TABLES = Object.freeze({
  cohorts: 'cohort15_lofi_cohorts',
  interests: 'cohort15_lofi_interests',
  feedback: 'cohort15_lofi_feedback',
  notificationDeliveries: 'cohort15_lofi_notification_deliveries',
  users: 'cohort15_lofi_users',
  sessions: 'cohort15_lofi_sessions',
  creditTransactions: 'cohort15_lofi_credit_transactions',
  purchases: 'cohort15_lofi_purchases',
  stripeEvents: 'cohort15_lofi_stripe_events',
});

export const RPCS = Object.freeze({
  acceptInterest: 'cohort15_lofi_accept_interest',
  provisionUser: 'cohort15_lofi_provision_user',
  creditBalance: 'cohort15_lofi_credit_balance',
  holdCredits: 'cohort15_lofi_hold_credits',
  consumeCreditHold: 'cohort15_lofi_consume_credit_hold',
  refundCreditHold: 'cohort15_lofi_refund_credit_hold',
  fulfillPurchase: 'cohort15_lofi_fulfill_purchase',
});

function mapCohortToRow(cohort) {
  return {
    id: cohort.id,
    creator_email: cohort.creatorEmail,
    creator_user_id: cohort.creatorUserId ?? null,
    title: cohort.title,
    description: cohort.description,
    category: cohort.category,
    topic: cohort.topic,
    target_audience: cohort.targetAudience,
    target_skill_level: cohort.targetSkillLevel,
    additional_details: cohort.additionalDetails ?? null,
    min_quorum: cohort.minQuorum,
    meeting_link: cohort.meetingLink,
    creator_time_zone: cohort.creatorTimeZone,
    first_meeting_at: cohort.firstMeetingAt,
    first_meeting_local: cohort.firstMeetingLocal,
    meeting_duration_minutes: cohort.meetingDurationMinutes,
    recurrence: cohort.recurrence,
    meeting_count: cohort.meetingCount,
    created_at: cohort.createdAt,
    updated_at: cohort.updatedAt,
    expires_at: cohort.expiresAt,
    quorum_met_at: cohort.quorumMetAt,
  };
}

function mapRowToCohort(row) {
  return createCohort({
    creatorEmail: row.creator_email,
    creatorUserId: row.creator_user_id ?? null,
    title: row.title,
    description: row.description,
    category: row.category,
    topic: row.topic,
    targetAudience: row.target_audience,
    targetSkillLevel: row.target_skill_level,
    additionalDetails: row.additional_details,
    minQuorum: row.min_quorum,
    meetingLink: row.meeting_link,
    creatorTimeZone: row.creator_time_zone,
    firstMeetingLocal: row.first_meeting_local,
    meetingDurationMinutes: row.meeting_duration_minutes,
    recurrence: row.recurrence,
    meetingCount: row.meeting_count,
  }, {
    id: row.id,
    now: row.created_at,
  });
}

function hydrateStoredCohort(row) {
  const cohort = mapRowToCohort(row);
  return Object.freeze({
    ...cohort,
    firstMeetingAt: new Date(row.first_meeting_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
    quorumMetAt: row.quorum_met_at == null ? null : new Date(row.quorum_met_at).toISOString(),
  });
}

function mapInterestToRow(interest) {
  return {
    id: interest.id,
    cohort_id: interest.cohortId,
    email: interest.email,
    user_id: interest.userId ?? null,
    created_at: interest.createdAt,
  };
}

function mapRowToInterest(row) {
  return hydrateInterest({
    id: row.id,
    cohortId: row.cohort_id,
    email: row.email,
    userId: row.user_id ?? null,
    createdAt: row.created_at,
  });
}

function mapRowToUser(row) {
  const user = createUser({
    supabaseSubject: row.supabase_subject,
    email: row.email,
  }, { id: row.id, now: row.created_at });
  return Object.freeze({ ...user, updatedAt: new Date(row.updated_at).toISOString() });
}

function mapSessionToRow(session) {
  return {
    id: session.id,
    user_id: session.userId,
    token_digest: session.tokenDigest,
    csrf_digest: session.csrfDigest,
    expires_at: session.expiresAt,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  };
}

function mapRowToSession(row) {
  const session = createSession({
    userId: row.user_id,
    tokenDigest: row.token_digest,
    csrfDigest: row.csrf_digest,
    expiresAt: row.expires_at,
  }, { id: row.id, now: row.created_at });
  return Object.freeze({ ...session, updatedAt: new Date(row.updated_at).toISOString() });
}

function mapRowToCreditTransaction(row) {
  return createCreditTransaction({
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    idempotencyKey: row.idempotency_key,
    cohortId: row.cohort_id,
    purchaseId: row.purchase_id,
    source: row.source,
  }, { id: row.id, now: row.created_at });
}

function mapPurchaseToRow(purchase) {
  return {
    id: purchase.id,
    user_id: purchase.userId,
    package_id: purchase.packageId,
    credits: purchase.credits,
    amount_cents: purchase.amountCents,
    currency: purchase.currency,
    status: purchase.status,
    stripe_checkout_session_id: purchase.stripeCheckoutSessionId,
    stripe_payment_intent_id: purchase.stripePaymentIntentId,
    created_at: purchase.createdAt,
    updated_at: purchase.updatedAt,
    fulfilled_at: purchase.fulfilledAt,
  };
}

function mapRowToPurchase(row) {
  const purchase = createPurchase({
    userId: row.user_id,
    packageId: row.package_id,
    credits: row.credits,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    fulfilledAt: row.fulfilled_at,
  }, { id: row.id, now: row.created_at });
  return Object.freeze({ ...purchase, updatedAt: new Date(row.updated_at).toISOString() });
}

function mapStripeEventToRow(event) {
  return {
    event_id: event.eventId,
    event_type: event.eventType,
    outcome: event.outcome,
    created_at: event.createdAt,
  };
}

function mapRowToStripeEvent(row) {
  return createStripeEvent({
    eventId: row.event_id,
    eventType: row.event_type,
    outcome: row.outcome,
  }, { now: row.created_at });
}

function deriveCreditBalance(rows) {
  const balance = { funded: 0, available: 0, held: 0, consumed: 0, refunded: 0 };
  for (const row of rows) {
    if (row.type === 'grant' || row.type === 'purchase') {
      balance.funded += row.amount;
      balance.available += row.amount;
    } else if (row.type === 'hold') {
      balance.available -= row.amount;
      balance.held += row.amount;
    } else if (row.type === 'consume') {
      balance.held -= row.amount;
      balance.consumed += row.amount;
    } else if (row.type === 'refund') {
      balance.held -= row.amount;
      balance.available += row.amount;
      balance.refunded += row.amount;
    }
  }
  return Object.freeze(balance);
}

function mapDeliveryToRow(delivery) {
  return {
    id: delivery.id,
    idempotency_key: delivery.idempotencyKey,
    cohort_id: delivery.cohortId,
    interest_id: delivery.interestId,
    recipient_email: delivery.recipientEmail,
    type: delivery.type,
    status: delivery.status,
    attempt_count: delivery.attemptCount,
    provider_error_code: delivery.providerErrorCode,
    created_at: delivery.createdAt,
    updated_at: delivery.updatedAt,
    sent_at: delivery.sentAt,
  };
}

function mapFeedbackToRow(feedback) {
  return {
    id: feedback.id,
    session_id: feedback.sessionId,
    path: feedback.path,
    action_context: feedback.actionContext,
    looking_for_group: feedback.lookingForGroup,
    looking_for_instead: feedback.lookingForInstead,
    group_intent: feedback.groupIntent,
    did_create_or_join: feedback.didCreateOrJoin,
    why_or_why_not: feedback.whyOrWhyNot,
    contact_email: feedback.contactEmail,
    contact_x: feedback.contactX,
    contact_linkedin: feedback.contactLinkedin,
    contact_other: feedback.contactOther,
    completion_state: feedback.completionState,
    last_step: feedback.lastStep,
    submitted_on_close: feedback.submittedOnClose,
    created_at: feedback.createdAt,
    updated_at: feedback.updatedAt,
    completed_at: feedback.completedAt,
  };
}

function mapRowToFeedback(row) {
  return hydrateFeedback({
    id: row.id,
    sessionId: row.session_id,
    path: row.path,
    actionContext: row.action_context ?? {},
    lookingForGroup: row.looking_for_group,
    lookingForInstead: row.looking_for_instead,
    groupIntent: row.group_intent,
    didCreateOrJoin: row.did_create_or_join,
    whyOrWhyNot: row.why_or_why_not,
    contactEmail: row.contact_email,
    contactX: row.contact_x,
    contactLinkedin: row.contact_linkedin,
    contactOther: row.contact_other,
    completionState: row.completion_state,
    lastStep: row.last_step,
    submittedOnClose: row.submitted_on_close,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  });
}

function mapRowToDelivery(row) {
  return hydrateNotificationDelivery({
    id: row.id,
    idempotencyKey: row.idempotency_key,
    cohortId: row.cohort_id,
    interestId: row.interest_id,
    recipientEmail: row.recipient_email,
    type: row.type,
    status: row.status,
    attemptCount: row.attempt_count,
    providerErrorCode: row.provider_error_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
  });
}

function encodeQuery(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const entry of value) params.append(key, entry);
    } else {
      params.set(key, value);
    }
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

function createPostgrestClient({ url, serviceRoleKey, fetchImpl = globalThis.fetch }) {
  if (!url) throw new TypeError('Supabase URL is required');
  if (!serviceRoleKey) throw new TypeError('Supabase service role key is required');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch implementation is required');

  const trimmedUrl = url.replace(/\/$/u, '');
  const baseHeaders = Object.freeze({
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  });

  async function request(path, { method = 'GET', query, headers = {}, body } = {}) {
    const response = await fetchImpl(`${trimmedUrl}${path}${encodeQuery(query)}`, {
      method,
      headers: { ...baseHeaders, ...headers },
      body: body == null ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const error = new Error(payload?.message ?? `PostgREST request failed: ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  return Object.freeze({
    insert(table, row) {
      return request(`/rest/v1/${table}`, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: row,
      });
    },

    list(table, query = {}) {
      return request(`/rest/v1/${table}`, {
        query: { select: '*', ...query },
      });
    },

    async one(table, query = {}) {
      const rows = await request(`/rest/v1/${table}`, {
        headers: { Accept: 'application/vnd.pgrst.object+json' },
        query: { select: '*', ...query },
      }).catch((error) => {
        if (error.status === 406) return null;
        throw error;
      });
      return rows;
    },

    update(table, query, patch) {
      return request(`/rest/v1/${table}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        query,
        body: patch,
      });
    },

    delete(table, query) {
      return request(`/rest/v1/${table}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=representation' },
        query,
      });
    },

    upsert(table, row, { onConflict } = {}) {
      return request(`/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        query: onConflict ? { on_conflict: onConflict } : undefined,
        body: row,
      });
    },

    rpc(name, body) {
      return request(`/rest/v1/rpc/${name}`, {
        method: 'POST',
        body,
      });
    },
  });
}

export function createSupabasePostgresRepositories({
  url,
  serviceRoleKey,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  randomUUID = () => globalThis.crypto.randomUUID(),
} = {}) {
  const client = createPostgrestClient({ url, serviceRoleKey, fetchImpl });

  async function requireCohort(id) {
    const row = await client.one(TABLES.cohorts, { id: `eq.${id}` });
    if (!row) throw new RepositoryNotFoundError('cohort', id);
    return hydrateStoredCohort(row);
  }

  async function requireUser(id) {
    const row = await client.one(TABLES.users, { id: `eq.${id}` });
    if (!row) throw new RepositoryNotFoundError('user', id);
    return mapRowToUser(row);
  }

  async function requirePurchase(id) {
    const row = await client.one(TABLES.purchases, { id: `eq.${id}` });
    if (!row) throw new RepositoryNotFoundError('purchase', id);
    return mapRowToPurchase(row);
  }

  async function requireCreditTransaction(id) {
    const row = await client.one(TABLES.creditTransactions, { id: `eq.${id}` });
    if (!row) throw new RepositoryNotFoundError('creditTransaction', id);
    return mapRowToCreditTransaction(row);
  }

  async function atomicRpc(name, body) {
    try {
      const payload = await client.rpc(name, body);
      const result = Array.isArray(payload) ? payload[0] : payload;
      if (!result) throw new Error(`${name} RPC returned no rows`);
      return result;
    } catch (error) {
      const message = `${error.payload?.code ?? ''} ${error.payload?.message ?? error.message}`;
      for (const code of [
        'identity_conflict', 'invalid_hold', 'hold_settled', 'duplicate_purchase',
        'duplicate_checkout_session', 'duplicate_credit_transaction', 'idempotency_mismatch',
        'purchase_mismatch',
      ]) {
        if (message.includes(code)) throw new RepositoryConflictError(code, code);
      }
      throw error;
    }
  }

  async function interestCountByCohort() {
    const rows = await client.list(TABLES.interests, { select: 'cohort_id' });
    return rows.reduce((counts, row) => {
      counts.set(row.cohort_id, (counts.get(row.cohort_id) ?? 0) + 1);
      return counts;
    }, new Map());
  }

  async function settleCreditHold(type, input, options = {}) {
    await requireUser(input.userId);
    const result = await atomicRpc(
      type === 'consume' ? RPCS.consumeCreditHold : RPCS.refundCreditHold,
      {
        p_transaction_id: options.id ?? randomUUID(),
        p_user_id: input.userId,
        p_hold_transaction_id: input.holdId,
        p_idempotency_key: input.idempotencyKey,
        p_cohort_id: input.cohortId ?? null,
        p_now: new Date(options.now ?? now()).toISOString(),
      },
    );
    const [transaction, balance] = await Promise.all([
      requireCreditTransaction(result.transaction_id),
      createSupabaseBalance(input.userId),
    ]);
    return Object.freeze({ transaction, created: Boolean(result.created), balance });
  }

  async function createSupabaseBalance(userId) {
    await requireUser(userId);
    const payload = await client.rpc(RPCS.creditBalance, { p_user_id: userId });
    const row = Array.isArray(payload) ? payload[0] : payload;
    if (!row) return deriveCreditBalance([]);
    return Object.freeze({
      funded: Number(row.funded),
      available: Number(row.available),
      held: Number(row.held),
      consumed: Number(row.consumed),
      refunded: Number(row.refunded),
    });
  }

  return Object.freeze({
    async provisionUser(input, options = {}) {
      const user = createUser(input, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      const result = await atomicRpc(RPCS.provisionUser, {
        p_user_id: user.id,
        p_grant_transaction_id: options.grantId ?? randomUUID(),
        p_supabase_subject: user.supabaseSubject,
        p_email: user.email,
        p_now: user.createdAt,
      });
      const [storedUser, grant] = await Promise.all([
        requireUser(result.user_id),
        requireCreditTransaction(result.grant_transaction_id),
      ]);
      return Object.freeze({
        user: storedUser,
        created: Boolean(result.user_created),
        grant,
        grantCreated: Boolean(result.grant_created),
      });
    },

    async getUserById(id) {
      return requireUser(id);
    },

    async getUserBySupabaseSubject(supabaseSubject) {
      const row = await client.one(TABLES.users, { supabase_subject: `eq.${supabaseSubject}` });
      if (!row) throw new RepositoryNotFoundError('user', supabaseSubject);
      return mapRowToUser(row);
    },

    async getUserByEmail(email) {
      const normalized = normalizeEmail(email);
      const row = await client.one(TABLES.users, { email: `eq.${normalized}` });
      if (!row) throw new RepositoryNotFoundError('user', normalized);
      return mapRowToUser(row);
    },

    async createSession(input, options = {}) {
      await requireUser(input.userId);
      const session = createSession(input, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      try {
        const [row] = await client.insert(TABLES.sessions, mapSessionToRow(session));
        return mapRowToSession(row);
      } catch (error) {
        if (error.status === 409) throw new RepositoryConflictError('duplicate_session', 'duplicate_session');
        throw error;
      }
    },

    async getSessionByTokenDigest(tokenDigest, options = {}) {
      const row = await client.one(TABLES.sessions, { token_digest: `eq.${tokenDigest}` });
      if (!row) throw new RepositoryNotFoundError('session', tokenDigest);
      if (Date.parse(row.expires_at) <= new Date(options.now ?? now()).valueOf()) {
        await client.delete(TABLES.sessions, { token_digest: `eq.${tokenDigest}` });
        throw new RepositoryNotFoundError('session', tokenDigest);
      }
      const session = mapRowToSession(row);
      return Object.freeze({ ...session, user: await requireUser(session.userId) });
    },

    async deleteSessionByTokenDigest(tokenDigest) {
      const [row] = await client.delete(TABLES.sessions, { token_digest: `eq.${tokenDigest}` });
      return Boolean(row);
    },

    async getCreditBalance(userId) {
      return createSupabaseBalance(userId);
    },

    async listCreditTransactionsByUserId(userId) {
      await requireUser(userId);
      const rows = await client.list(TABLES.creditTransactions, {
        user_id: `eq.${userId}`,
        order: 'created_at.asc,id.asc',
      });
      return rows.map(mapRowToCreditTransaction);
    },

    async holdCredits(input, options = {}) {
      await requireUser(input.userId);
      const transaction = createCreditTransaction({ ...input, type: 'hold' }, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      let result;
      try {
        result = await atomicRpc(RPCS.holdCredits, {
          p_transaction_id: transaction.id,
          p_user_id: transaction.userId,
          p_amount: transaction.amount,
          p_idempotency_key: transaction.idempotencyKey,
          p_cohort_id: transaction.cohortId,
          p_source: transaction.source,
          p_now: transaction.createdAt,
        });
      } catch (error) {
        const message = `${error.payload?.message ?? error.message}`;
        if (message.includes('insufficient_credits')) {
          throw new InsufficientCreditsError(await createSupabaseBalance(input.userId), input.amount);
        }
        throw error;
      }
      const [storedTransaction, balance] = await Promise.all([
        requireCreditTransaction(result.transaction_id),
        createSupabaseBalance(input.userId),
      ]);
      return Object.freeze({
        transaction: storedTransaction,
        created: Boolean(result.created),
        balance,
      });
    },

    async consumeCreditHold(input, options = {}) {
      return settleCreditHold('consume', input, options);
    },

    async refundCreditHold(input, options = {}) {
      return settleCreditHold('refund', input, options);
    },

    async createPendingPurchase(input, options = {}) {
      await requireUser(input.userId);
      const purchase = createPurchase({ ...input, status: 'pending' }, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      try {
        const [row] = await client.insert(TABLES.purchases, mapPurchaseToRow(purchase));
        return mapRowToPurchase(row);
      } catch (error) {
        if (error.status === 409) throw new RepositoryConflictError('duplicate_purchase', 'duplicate_purchase');
        throw error;
      }
    },

    async setPurchaseCheckoutSession(purchaseId, stripeCheckoutSessionId, options = {}) {
      const existing = await requirePurchase(purchaseId);
      if (existing.stripeCheckoutSessionId != null
        && existing.stripeCheckoutSessionId !== stripeCheckoutSessionId) {
        throw new RepositoryConflictError('purchase_mismatch', 'purchase_mismatch');
      }
      try {
        const [row] = await client.update(TABLES.purchases, { id: `eq.${purchaseId}` }, {
          stripe_checkout_session_id: stripeCheckoutSessionId,
          updated_at: new Date(options.now ?? now()).toISOString(),
        });
        return mapRowToPurchase(row);
      } catch (error) {
        if (error.status === 409) {
          throw new RepositoryConflictError('duplicate_checkout_session', 'duplicate_checkout_session');
        }
        throw error;
      }
    },

    async getPurchaseById(id) {
      return requirePurchase(id);
    },

    async getPurchaseByStripeCheckoutSessionId(checkoutSessionId) {
      const row = await client.one(TABLES.purchases, {
        stripe_checkout_session_id: `eq.${checkoutSessionId}`,
      });
      if (!row) throw new RepositoryNotFoundError('purchase', checkoutSessionId);
      return mapRowToPurchase(row);
    },

    async fulfillPurchase(input, options = {}) {
      await requirePurchase(input.purchaseId);
      const result = await atomicRpc(RPCS.fulfillPurchase, {
        p_purchase_id: input.purchaseId,
        p_user_id: input.userId,
        p_checkout_session_id: input.stripeCheckoutSessionId,
        p_payment_intent_id: input.stripePaymentIntentId,
        p_package_id: input.packageId,
        p_credits: input.credits,
        p_amount_cents: input.amountCents,
        p_currency: input.currency,
        p_transaction_id: options.transactionId ?? randomUUID(),
        p_now: new Date(options.now ?? now()).toISOString(),
      });
      const [purchase, transaction] = await Promise.all([
        requirePurchase(result.purchase_id),
        requireCreditTransaction(result.credit_transaction_id),
      ]);
      return Object.freeze({ purchase, transaction, fulfilled: Boolean(result.fulfilled) });
    },

    async recordStripeEvent(input, options = {}) {
      const event = createStripeEvent(input, { now: options.now ?? now() });
      try {
        const [row] = await client.insert(TABLES.stripeEvents, mapStripeEventToRow(event));
        return Object.freeze({ event: mapRowToStripeEvent(row), created: true });
      } catch (error) {
        if (error.status !== 409) throw error;
        const row = await client.one(TABLES.stripeEvents, { event_id: `eq.${event.eventId}` });
        if (!row) throw error;
        return Object.freeze({ event: mapRowToStripeEvent(row), created: false });
      }
    },

    async getStripeEventById(eventId) {
      const row = await client.one(TABLES.stripeEvents, { event_id: `eq.${eventId}` });
      if (!row) throw new RepositoryNotFoundError('stripeEvent', eventId);
      return mapRowToStripeEvent(row);
    },

    async createCohort(input, options = {}) {
      const cohort = createCohort(input, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      try {
        const [row] = await client.insert(TABLES.cohorts, mapCohortToRow(cohort));
        return hydrateStoredCohort(row);
      } catch (error) {
        if (error.status === 409) {
          throw new RepositoryConflictError('duplicate_cohort', `cohort already exists: ${cohort.id}`);
        }
        throw error;
      }
    },

    async getCohortById(id) {
      return requireCohort(id);
    },

    async listCohorts() {
      const rows = await client.list(TABLES.cohorts);
      return rows.map(hydrateStoredCohort);
    },

    async getPublicCohortById(id, options = {}) {
      const cohort = await requireCohort(id);
      const count = (await client.list(TABLES.interests, { select: 'cohort_id', cohort_id: `eq.${id}` })).length;
      return serializePublicCohort(cohort, {
        interestCount: count,
        now: options.now ?? now(),
      });
    },

    async listPublicCohorts(options = {}) {
      const [cohorts, counts] = await Promise.all([this.listCohorts(), interestCountByCohort()]);
      return sortPublicCohorts(cohorts.map((cohort) => serializePublicCohort(cohort, {
        interestCount: counts.get(cohort.id) ?? 0,
        now: options.now ?? now(),
      })));
    },

    async acceptInterest(input, options = {}) {
      const interest = createInterest(input, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      const [result] = await client.rpc(RPCS.acceptInterest, {
        p_cohort_id: interest.cohortId,
        p_interest_id: interest.id,
        p_email: normalizeEmail(interest.email),
        p_now: interest.createdAt,
      });

      if (!result) throw new Error('accept interest RPC returned no rows');
      if (result.conflict_code === 'not_found') {
        throw new RepositoryNotFoundError('cohort', interest.cohortId);
      }
      if (result.conflict_code) {
        throw new RepositoryConflictError(result.conflict_code, result.conflict_code);
      }

      const cohort = await requireCohort(interest.cohortId);
      return Object.freeze({
        interest: mapRowToInterest({
          id: result.interest_id,
          cohort_id: interest.cohortId,
          email: interest.email,
          created_at: result.interest_created_at,
        }),
        cohort,
        interestCount: result.interest_count,
        reachedQuorum: result.reached_quorum,
      });
    },

    async listInterestsByCohortId(cohortId) {
      await requireCohort(cohortId);
      const rows = await client.list(TABLES.interests, { cohort_id: `eq.${cohortId}` });
      return rows.map(mapRowToInterest);
    },

    async countInterestsByCohortId(cohortId) {
      await requireCohort(cohortId);
      const rows = await client.list(TABLES.interests, { select: 'id', cohort_id: `eq.${cohortId}` });
      return rows.length;
    },

    async upsertFeedback(input, options = {}) {
      const existing = await client.one(TABLES.feedback, {
        session_id: `eq.${input.sessionId}`,
      });
      const feedback = createFeedback(input, {
        id: existing?.id ?? options.id ?? randomUUID(),
        now: existing?.created_at ?? options.now ?? now(),
      });
      const currentNow = new Date(options.updatedAt ?? options.now ?? now()).toISOString();
      const [row] = await client.upsert(TABLES.feedback, mapFeedbackToRow({
        ...feedback,
        createdAt: existing?.created_at ?? feedback.createdAt,
        updatedAt: currentNow,
        completedAt: feedback.completionState === 'completed'
          ? feedback.completedAt ?? currentNow
          : null,
      }), { onConflict: 'session_id' });
      return mapRowToFeedback(row);
    },

    async getFeedbackBySessionId(sessionId) {
      const row = await client.one(TABLES.feedback, { session_id: `eq.${sessionId}` });
      if (!row) throw new RepositoryNotFoundError('feedback', sessionId);
      return mapRowToFeedback(row);
    },

    async listFeedback() {
      const rows = await client.list(TABLES.feedback);
      return rows.map(mapRowToFeedback);
    },

    async ensureNotificationDelivery(input, options = {}) {
      const delivery = createNotificationDelivery(input, {
        id: options.id ?? randomUUID(),
        now: options.now ?? now(),
      });
      try {
        const [row] = await client.insert(TABLES.notificationDeliveries, mapDeliveryToRow(delivery));
        return Object.freeze({ delivery: mapRowToDelivery(row), created: true });
      } catch (error) {
        if (error.status !== 409) throw error;
        const existing = await client.one(TABLES.notificationDeliveries, {
          idempotency_key: `eq.${delivery.idempotencyKey}`,
        });
        if (!existing) throw error;
        return Object.freeze({ delivery: mapRowToDelivery(existing), created: false });
      }
    },

    async recordNotificationOutcome(idempotencyKey, outcome, options = {}) {
      const existing = await client.one(TABLES.notificationDeliveries, {
        idempotency_key: `eq.${idempotencyKey}`,
      });
      if (!existing) throw new RepositoryNotFoundError('notificationDelivery', idempotencyKey);

      const currentNow = new Date(options.now ?? now()).toISOString();
      const nextStatus = outcome.status ?? existing.status;
      const [row] = await client.update(TABLES.notificationDeliveries, {
        idempotency_key: `eq.${idempotencyKey}`,
      }, {
        status: nextStatus,
        attempt_count: outcome.attemptCount ?? existing.attempt_count,
        provider_error_code: outcome.providerErrorCode ?? null,
        sent_at: nextStatus === 'sent'
          ? outcome.sentAt ?? existing.sent_at ?? currentNow
          : outcome.sentAt ?? null,
        updated_at: currentNow,
      });

      return mapRowToDelivery(row);
    },

    async getNotificationDeliveryByIdempotencyKey(idempotencyKey) {
      const row = await client.one(TABLES.notificationDeliveries, {
        idempotency_key: `eq.${idempotencyKey}`,
      });
      if (!row) throw new RepositoryNotFoundError('notificationDelivery', idempotencyKey);
      return mapRowToDelivery(row);
    },

    async listNotificationDeliveriesByCohortId(cohortId) {
      await requireCohort(cohortId);
      const rows = await client.list(TABLES.notificationDeliveries, { cohort_id: `eq.${cohortId}` });
      return rows.map(mapRowToDelivery);
    },
  });
}
