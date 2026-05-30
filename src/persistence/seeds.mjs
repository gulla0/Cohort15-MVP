import { createRepositories } from './repositories.mjs';
import { createTokenLedger } from './token-ledger.mjs';

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

export function createDemoRepositories() {
  const repositories = createRepositories();
  const ledger = createTokenLedger(repositories.tokenTransactions, {
    now: () => new Date('2026-06-01T12:10:00.000Z')
  });

  for (const user of DEMO_USERS) {
    repositories.users.create(user);
    ledger.grant(user.id, 6, 'seed_demo_tokens');
  }

  return {
    repositories,
    ledger
  };
}
