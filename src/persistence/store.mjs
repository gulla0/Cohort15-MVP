import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DATE_FIELD_PATTERN = /At$/;

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

export function createInMemoryStore(seed = {}) {
  return {
    users: new Map((seed.users ?? []).map((record) => [record.id, cloneRecord(record)])),
    events: new Map((seed.events ?? []).map((record) => [record.id, cloneRecord(record)])),
    eventInterests: new Map((seed.eventInterests ?? []).map((record) => [record.id, cloneRecord(record)])),
    tokenTransactions: new Map((seed.tokenTransactions ?? []).map((record) => [record.id, cloneRecord(record)])),
    socialPosts: new Map((seed.socialPosts ?? []).map((record) => [record.id, cloneRecord(record)]))
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
    tokenTransactions: readRecords(store.tokenTransactions).map(serializeRecord),
    socialPosts: readRecords(store.socialPosts).map(serializeRecord)
  };
}

function readSnapshot(filePath, seed) {
  if (!existsSync(filePath)) {
    return seed;
  }

  const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  return {
    users: (parsed.users ?? []).map(reviveRecord),
    events: (parsed.events ?? []).map(reviveRecord),
    eventInterests: (parsed.eventInterests ?? []).map(reviveRecord),
    tokenTransactions: (parsed.tokenTransactions ?? []).map(reviveRecord),
    socialPosts: (parsed.socialPosts ?? []).map(reviveRecord)
  };
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
