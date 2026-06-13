import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DATE_FIELD_PATTERN = /At$/;
const LEGACY_VOCABULARY = ['to', 'ken'].join('');
const LEGACY_CREDIT_TRANSACTIONS_KEY = `${LEGACY_VOCABULARY}Transactions`;
const LEGACY_CREDITS_HELD_KEY = `${LEGACY_VOCABULARY}sHeld`;
const LEGACY_SEED_SOURCE = `seed_demo_${LEGACY_VOCABULARY}s`;

function cloneDate(value) {
  return value instanceof Date ? new Date(value.getTime()) : value;
}

function cloneRecord(record) {
  if (record === undefined) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, cloneDate(value)])
  );
}

function cloneRecords(records) {
  return records.map((record) => cloneRecord(record));
}

function normalizeInterestRecord(record) {
  const normalized = cloneRecord(record);
  if (
    normalized
    && typeof normalized.creditsHeld === 'undefined'
    && typeof normalized[LEGACY_CREDITS_HELD_KEY] !== 'undefined'
  ) {
    normalized.creditsHeld = normalized[LEGACY_CREDITS_HELD_KEY];
    delete normalized[LEGACY_CREDITS_HELD_KEY];
  }
  return normalized;
}

function normalizeCreditTransactionRecord(record) {
  const normalized = cloneRecord(record);
  if (normalized?.source === LEGACY_SEED_SOURCE) {
    normalized.source = 'seed_demo_credits';
  }
  return normalized;
}

function normalizeSnapshot(snapshot = {}) {
  return {
    users: (snapshot.users ?? []).map(cloneRecord),
    events: (snapshot.events ?? []).map(cloneRecord),
    eventInterests: (snapshot.eventInterests ?? []).map(normalizeInterestRecord),
    creditTransactions: (snapshot.creditTransactions ?? snapshot[LEGACY_CREDIT_TRANSACTIONS_KEY] ?? [])
      .map(normalizeCreditTransactionRecord),
    socialPosts: (snapshot.socialPosts ?? []).map(cloneRecord)
  };
}

export function createInMemoryStore(seed = {}) {
  const normalizedSeed = normalizeSnapshot(seed);
  return {
    users: new Map(normalizedSeed.users.map((record) => [record.id, cloneRecord(record)])),
    events: new Map(normalizedSeed.events.map((record) => [record.id, cloneRecord(record)])),
    eventInterests: new Map(normalizedSeed.eventInterests.map((record) => [record.id, cloneRecord(record)])),
    creditTransactions: new Map(normalizedSeed.creditTransactions.map((record) => [record.id, cloneRecord(record)])),
    socialPosts: new Map(normalizedSeed.socialPosts.map((record) => [record.id, cloneRecord(record)]))
  };
}

function serializeRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value
    ])
  );
}

function reviveRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      DATE_FIELD_PATTERN.test(key) && typeof value === 'string' ? new Date(value) : value
    ])
  );
}

function storeToSnapshot(store) {
  return {
    users: readRecords(store.users).map(serializeRecord),
    events: readRecords(store.events).map(serializeRecord),
    eventInterests: readRecords(store.eventInterests).map(serializeRecord),
    creditTransactions: readRecords(store.creditTransactions).map(serializeRecord),
    socialPosts: readRecords(store.socialPosts).map(serializeRecord)
  };
}

function readSnapshot(filePath, seed) {
  if (!existsSync(filePath)) {
    return normalizeSnapshot(seed);
  }

  const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  return normalizeSnapshot({
    users: (parsed.users ?? []).map(reviveRecord),
    events: (parsed.events ?? []).map(reviveRecord),
    eventInterests: (parsed.eventInterests ?? []).map(reviveRecord),
    creditTransactions: (parsed.creditTransactions ?? []).map(reviveRecord),
    [LEGACY_CREDIT_TRANSACTIONS_KEY]: (parsed[LEGACY_CREDIT_TRANSACTIONS_KEY] ?? []).map(reviveRecord),
    socialPosts: (parsed.socialPosts ?? []).map(reviveRecord)
  });
}

export function createJsonFileStore(filePath, seed = {}) {
  const store = createInMemoryStore(readSnapshot(filePath, seed));

  store.persist = () => {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `${JSON.stringify(storeToSnapshot(store), null, 2)}\n`, 'utf8');
  };

  if (!existsSync(filePath)) {
    store.persist();
  }

  return store;
}

export function readRecord(table, id) {
  return cloneRecord(table.get(id));
}

export function readRecords(table) {
  return cloneRecords([...table.values()]);
}

export function writeRecord(table, record) {
  table.set(record.id, cloneRecord(record));
  return cloneRecord(record);
}
