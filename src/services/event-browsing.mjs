const VALID_STATUSES = new Set(['all', 'active', 'expired']);

export function normalizeBrowseStatus(value) {
  return VALID_STATUSES.has(value) ? value : 'all';
}

export function createEventBrowsingService({ repositories } = {}) {
  if (!repositories) throw new TypeError('repositories is required');

  return Object.freeze({
    async list({ status = 'all', now } = {}) {
      const normalizedStatus = normalizeBrowseStatus(status);
      const cohorts = await repositories.listPublicCohorts({ now });
      return Object.freeze({
        status: normalizedStatus,
        cohorts: Object.freeze(normalizedStatus === 'all'
          ? cohorts
          : cohorts.filter((cohort) => cohort.collectionStatus === normalizedStatus)),
      });
    },

    async getById(id, { now } = {}) {
      return repositories.getPublicCohortById(id, { now });
    },
  });
}
