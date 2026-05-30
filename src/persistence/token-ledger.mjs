import { TOKEN_TRANSACTION_TYPES } from '../domain/constants.mjs';

function createTransactionId(type, userId, eventId, sequence) {
  const eventPart = eventId ? `-${eventId}` : '';
  return `txn-${type}-${userId}${eventPart}-${sequence}`;
}

function assertPositiveAmount(amount) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Token amount must be greater than 0.');
  }
}

function assertTransactionType(type) {
  if (!TOKEN_TRANSACTION_TYPES.includes(type)) {
    throw new Error(`Unsupported token transaction type: ${type}`);
  }
}

function totalsFor(transactions) {
  const funding = transactions
    .filter((transaction) => transaction.type === 'grant' || transaction.type === 'purchase')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const holds = transactions
    .filter((transaction) => transaction.type === 'hold')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const consumed = transactions
    .filter((transaction) => transaction.type === 'consume')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const refunded = transactions
    .filter((transaction) => transaction.type === 'refund')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const held = holds - consumed - refunded;

  return {
    grantedOrPurchased: funding,
    held,
    consumed,
    refunded,
    available: funding - consumed - held
  };
}

export function createTokenLedger(transactionRepository, options = {}) {
  const now = options.now ?? (() => new Date());
  let sequence = options.sequenceStart ?? transactionRepository.list().length;

  function append({ userId, eventId, amount, type, source, createdAt = now() }) {
    assertTransactionType(type);
    assertPositiveAmount(amount);
    sequence += 1;
    return transactionRepository.append({
      id: createTransactionId(type, userId, eventId, sequence),
      userId,
      eventId,
      amount,
      type,
      source,
      createdAt
    });
  }

  function balanceForUser(userId) {
    return totalsFor(transactionRepository.listByUser(userId));
  }

  function heldForEventUser(userId, eventId) {
    return totalsFor(transactionRepository.listByUser(userId).filter((transaction) => (
      transaction.eventId === eventId
    ))).held;
  }

  function grant(userId, amount, source = 'demo_grant') {
    return append({ userId, amount, type: 'grant', source });
  }

  function hold(userId, eventId, amount) {
    const balance = balanceForUser(userId);
    if (balance.available < amount) {
      throw new Error(`Insufficient available tokens for ${userId}.`);
    }
    return append({ userId, eventId, amount, type: 'hold' });
  }

  function consumeHeld(userId, eventId, amount) {
    if (heldForEventUser(userId, eventId) < amount) {
      throw new Error(`Insufficient held tokens for ${userId} on ${eventId}.`);
    }
    return append({ userId, eventId, amount, type: 'consume' });
  }

  function refundHeld(userId, eventId, amount) {
    if (heldForEventUser(userId, eventId) < amount) {
      throw new Error(`Insufficient held tokens for ${userId} on ${eventId}.`);
    }
    return append({ userId, eventId, amount, type: 'refund' });
  }

  return {
    balanceForUser,
    grant,
    hold,
    consumeHeld,
    refundHeld
  };
}
