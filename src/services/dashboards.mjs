import { serializeEventForViewer } from '../domain/validation.mjs';

function tokenSummary(transactions, userId, eventId) {
  const userEventTransactions = transactions.filter((transaction) => (
    transaction.userId === userId && transaction.eventId === eventId
  ));

  return {
    held: userEventTransactions
      .filter((transaction) => transaction.type === 'hold')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
    consumed: userEventTransactions
      .filter((transaction) => transaction.type === 'consume')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
    refunded: userEventTransactions
      .filter((transaction) => transaction.type === 'refund')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  };
}

function activeOrConsumedParticipantIds(interests) {
  return interests
    .filter((interest) => interest.status === 'active' || interest.status === 'consumed')
    .map((interest) => interest.userId);
}

function serializeForDashboard(repositories, event, userId) {
  return serializeEventForViewer(event, {
    userId,
    interestedUserIds: activeOrConsumedParticipantIds(repositories.eventInterests.listByEvent(event.id))
  });
}

export function createDashboardService({ repositories, ledger }) {
  function getCreatorDashboard(userId) {
    const user = repositories.users.findById(userId);
    if (!user) {
      throw new Error('Creator account was not found.');
    }

    const transactions = repositories.tokenTransactions.list();
    const cohorts = repositories.events
      .list()
      .filter((event) => event.creatorId === userId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((event) => ({
        event: serializeForDashboard(repositories, event, userId),
        tokenSummary: tokenSummary(transactions, userId, event.id),
        interestCount: repositories.eventInterests.listByEvent(event.id).length
      }));

    return {
      user,
      balance: ledger.balanceForUser(userId),
      cohorts
    };
  }

  function getParticipantDashboard(userId) {
    const user = repositories.users.findById(userId);
    if (!user) {
      throw new Error('Participant account was not found.');
    }

    const transactions = repositories.tokenTransactions.list();
    const interests = repositories.eventInterests
      .listByUser(userId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((interest) => {
        const event = repositories.events.findById(interest.eventId);
        return {
          interest,
          event: serializeForDashboard(repositories, event, userId),
          tokenSummary: tokenSummary(transactions, userId, interest.eventId)
        };
      });

    return {
      user,
      balance: ledger.balanceForUser(userId),
      interests
    };
  }

  return {
    getCreatorDashboard,
    getParticipantDashboard
  };
}
