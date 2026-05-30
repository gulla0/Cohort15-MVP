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
