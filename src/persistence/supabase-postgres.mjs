import {
  createCohort,
  createInterest,
  createNotificationDelivery,
  hydrateInterest,
  hydrateNotificationDelivery,
} from '../domain/models.mjs';
import { normalizeEmail, serializePublicCohort } from '../domain/validation.mjs';
import {
  RepositoryConflictError,
  RepositoryNotFoundError,
  sortPublicCohorts,
} from './repositories.mjs';

export const TABLES = Object.freeze({
  cohorts: 'cohort15_lofi_cohorts',
  interests: 'cohort15_lofi_interests',
  notificationDeliveries: 'cohort15_lofi_notification_deliveries',
});

export const RPCS = Object.freeze({
  acceptInterest: 'cohort15_lofi_accept_interest',
});

function mapCohortToRow(cohort) {
  return {
    id: cohort.id,
    creator_email: cohort.creatorEmail,
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
    created_at: interest.createdAt,
  };
}

function mapRowToInterest(row) {
  return hydrateInterest({
    id: row.id,
    cohortId: row.cohort_id,
    email: row.email,
    createdAt: row.created_at,
  });
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

  async function interestCountByCohort() {
    const rows = await client.list(TABLES.interests, { select: 'cohort_id' });
    return rows.reduce((counts, row) => {
      counts.set(row.cohort_id, (counts.get(row.cohort_id) ?? 0) + 1);
      return counts;
    }, new Map());
  }

  return Object.freeze({
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
