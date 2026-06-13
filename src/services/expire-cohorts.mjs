import { CREATE_EVENT_CREDIT_COST } from '../domain/constants.mjs';

function expiredOpenEvents(events, now) {
  return events.filter((event) => (
    event.status === 'open'
    && event.expiresAt.getTime() <= now.getTime()
  ));
}

function activeInterests(interests) {
  return interests.filter((interest) => interest.status === 'active');
}

export function createExpireCohortsService({ repositories, ledger, options = {} }) {
  const now = options.now ?? (() => new Date());

  function expireCohort(event, processedAt = now()) {
    if (!event) {
      throw new Error('Cohort was not found.');
    }

    if (event.status !== 'open') {
      return {
        event,
        expired: false,
        refundedInterests: []
      };
    }

    if (event.expiresAt.getTime() > processedAt.getTime()) {
      return {
        event,
        expired: false,
        refundedInterests: []
      };
    }

    ledger.refundHeld(event.creatorId, event.id, CREATE_EVENT_CREDIT_COST);

    const refundedInterests = activeInterests(repositories.eventInterests.listByEvent(event.id))
      .map((interest) => {
        ledger.refundHeld(interest.userId, event.id, interest.creditsHeld);
        return repositories.eventInterests.save({
          ...interest,
          status: 'refunded'
        });
      });

    const expiredEvent = repositories.events.save({
      ...event,
      status: 'expired',
      updatedAt: processedAt
    });

    return {
      event: expiredEvent,
      expired: true,
      refundedInterests
    };
  }

  function expireCohortById(eventId, processedAt = now()) {
    const event = repositories.events.findById(eventId);
    return expireCohort(event, processedAt);
  }

  function expireDueCohorts(processedAt = now()) {
    const results = expiredOpenEvents(repositories.events.list(), processedAt)
      .map((event) => expireCohort(event, processedAt));

    return {
      processedAt,
      expiredCount: results.filter((result) => result.expired).length,
      results
    };
  }

  return {
    expireCohortById,
    expireDueCohorts
  };
}
