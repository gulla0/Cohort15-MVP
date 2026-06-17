import { createInMemoryStore, storeToSnapshot } from './store.mjs';

const DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'expiresAt',
  'firstMeetingAt',
  'postedAt'
]);

export const SUPABASE_POSTGRES_TABLES = Object.freeze({
  users: 'cohort15_users',
  events: 'cohort15_events',
  eventInterests: 'cohort15_event_interests',
  creditTransactions: 'cohort15_credit_transactions',
  socialPosts: 'cohort15_social_posts',
  purchases: 'cohort15_purchases'
});

const FIELD_MAPPINGS = Object.freeze({
  users: Object.freeze({
    id: 'id',
    displayName: 'display_name',
    email: 'email',
    authProvider: 'auth_provider',
    authSubject: 'auth_subject',
    createdAt: 'created_at'
  }),
  events: Object.freeze({
    id: 'id',
    creatorId: 'creator_id',
    title: 'title',
    description: 'description',
    category: 'category',
    topic: 'topic',
    targetAudience: 'target_audience',
    targetSkillLevel: 'target_skill_level',
    additionalDetails: 'additional_details',
    minQuorum: 'min_quorum',
    maxParticipants: 'max_participants',
    status: 'status',
    lockedEventLink: 'locked_event_link',
    imageUrl: 'image_url',
    firstMeetingAt: 'first_meeting_at',
    meetingDurationMinutes: 'meeting_duration_minutes',
    recurrence: 'recurrence',
    meetingCount: 'meeting_count',
    expiresAt: 'expires_at',
    socialPostStatus: 'social_post_status',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }),
  eventInterests: Object.freeze({
    id: 'id',
    eventId: 'event_id',
    userId: 'user_id',
    creditsHeld: 'credits_held',
    status: 'status',
    createdAt: 'created_at'
  }),
  creditTransactions: Object.freeze({
    id: 'id',
    userId: 'user_id',
    eventId: 'event_id',
    amount: 'amount',
    type: 'type',
    source: 'source',
    createdAt: 'created_at'
  }),
  socialPosts: Object.freeze({
    id: 'id',
    eventId: 'event_id',
    platform: 'platform',
    postText: 'post_text',
    postUrl: 'post_url',
    status: 'status',
    createdAt: 'created_at',
    postedAt: 'posted_at'
  }),
  purchases: Object.freeze({
    id: 'id',
    userId: 'user_id',
    provider: 'provider',
    providerCheckoutId: 'provider_checkout_id',
    providerPaymentId: 'provider_payment_id',
    packageCredits: 'package_credits',
    amountCents: 'amount_cents',
    currency: 'currency',
    status: 'status',
    creditTransactionId: 'credit_transaction_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })
});

function normalizeSupabaseUrl(value) {
  return String(value ?? '').replace(/\/+$/, '');
}

function assertConfig({ supabaseUrl, serviceRoleKey, fetchImpl }) {
  if (!normalizeSupabaseUrl(supabaseUrl)) {
    throw new Error('Supabase Postgres persistence requires SUPABASE_URL.');
  }
  if (typeof serviceRoleKey !== 'string' || serviceRoleKey.trim().length === 0) {
    throw new Error('Supabase Postgres persistence requires SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('Supabase Postgres persistence requires fetch.');
  }
}

function headers(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    ...extra
  };
}

function toAppValue(field, value) {
  if (value === null) {
    return undefined;
  }
  if (DATE_FIELDS.has(field) && typeof value === 'string') {
    return new Date(value);
  }
  return value;
}

function fromAppValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

function mapRowToRecord(entity, row) {
  const mapping = FIELD_MAPPINGS[entity];
  return Object.fromEntries(
    Object.entries(mapping)
      .map(([appField, dbField]) => [appField, toAppValue(appField, row[dbField])])
      .filter(([, value]) => typeof value !== 'undefined')
  );
}

function mapRecordToRow(entity, record) {
  const mapping = FIELD_MAPPINGS[entity];
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([appField]) => typeof record[appField] !== 'undefined')
      .map(([appField, dbField]) => [dbField, fromAppValue(record[appField])])
  );
}

function snapshotToDatabaseRows(snapshot) {
  return Object.fromEntries(
    Object.keys(SUPABASE_POSTGRES_TABLES).map((entity) => [
      entity,
      (snapshot[entity] ?? []).map((record) => mapRecordToRow(entity, record))
    ])
  );
}

export function createSupabasePostgresClient({
  supabaseUrl,
  serviceRoleKey,
  fetchImpl = globalThis.fetch
}) {
  assertConfig({ supabaseUrl, serviceRoleKey, fetchImpl });
  const normalizedSupabaseUrl = normalizeSupabaseUrl(supabaseUrl);

  async function request(path, options = {}) {
    const response = await fetchImpl(`${normalizedSupabaseUrl}${path}`, {
      ...options,
      headers: headers(serviceRoleKey, options.headers)
    });

    if (!response.ok) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {
        detail = '';
      }
      throw new Error(`Supabase Postgres request failed (${response.status})${detail ? `: ${detail}` : ''}`);
    }

    if (response.status === 204) {
      return undefined;
    }

    return response.json();
  }

  async function loadSnapshot() {
    const entries = await Promise.all(
      Object.entries(SUPABASE_POSTGRES_TABLES).map(async ([entity, table]) => {
        const rows = await request(`/rest/v1/${table}?select=*`, {
          method: 'GET'
        });
        return [entity, rows.map((row) => mapRowToRecord(entity, row))];
      })
    );

    return Object.fromEntries(entries);
  }

  async function upsertSnapshot(snapshot) {
    const rowsByEntity = snapshotToDatabaseRows(snapshot);

    for (const [entity, table] of Object.entries(SUPABASE_POSTGRES_TABLES)) {
      const rows = rowsByEntity[entity];
      if (rows.length === 0) {
        continue;
      }

      await request(`/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(rows)
      });
    }
  }

  return {
    loadSnapshot,
    upsertSnapshot
  };
}

export async function createSupabasePostgresStore(options) {
  const client = options.client ?? createSupabasePostgresClient(options);
  const store = createInMemoryStore(await client.loadSnapshot());
  let writeQueue = Promise.resolve();

  store.persist = () => {
    const snapshot = storeToSnapshot(store);
    writeQueue = writeQueue.then(() => client.upsertSnapshot(snapshot));
    return writeQueue;
  };

  store.whenIdle = () => writeQueue;

  return store;
}
