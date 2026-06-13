import { createRepositories } from './repositories.mjs';
import { createCreditLedger } from './credit-ledger.mjs';

export const DEMO_USERS = Object.freeze([
  Object.freeze({
    id: 'user-creator',
    displayName: 'Demo Creator',
    email: 'creator@example.test',
    createdAt: new Date('2026-06-01T12:00:00.000Z')
  }),
  Object.freeze({
    id: 'user-participant',
    displayName: 'Demo Participant',
    email: 'participant@example.test',
    createdAt: new Date('2026-06-01T12:05:00.000Z')
  })
]);

export function createDemoRepositories(options = {}) {
  const repositories = options.repositories ?? createRepositories(options.seed, {
    store: options.store
  });
  const ledger = createCreditLedger(repositories.creditTransactions, {
    now: () => new Date('2026-06-01T12:10:00.000Z')
  });

  for (const user of DEMO_USERS) {
    if (!repositories.users.findById(user.id)) {
      repositories.users.create(user);
    }

    const hasSeedGrant = repositories.creditTransactions.listByUser(user.id).some((transaction) => (
      transaction.type === 'grant' && transaction.source === 'seed_demo_credits'
    ));

    if (!hasSeedGrant) {
      ledger.grant(user.id, 6, 'seed_demo_credits');
    }
  }

  return {
    repositories,
    ledger
  };
}
