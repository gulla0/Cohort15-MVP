import { randomUUID } from 'node:crypto';
import { CREATE_EVENT_CREDIT_COST, SHOW_INTEREST_CREDIT_COST } from '../domain/constants.mjs';
import { validateEventInterest } from '../domain/validation.mjs';

function activeOrCommittedInterests(interests) {
  return interests.filter((interest) => interest.status === 'active' || interest.status === 'consumed');
}

function assertNoValidationErrors(errors) {
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
}

export function createShowInterestService({ repositories, ledger, options = {} }) {
  const now = options.now ?? (() => new Date());
  const createInterestId = options.createInterestId ?? (() => `interest-${randomUUID()}`);

  function activateIfQuorumMet(event) {
    const interests = repositories.eventInterests.listByEvent(event.id);
    const activeInterests = interests.filter((interest) => interest.status === 'active');

    if (activeInterests.length < event.minQuorum) {
      return {
        event,
        activated: false
      };
    }

    const activatedAt = now();
    const activeEvent = repositories.events.save({
      ...event,
      status: 'active',
      updatedAt: activatedAt
    });

    ledger.consumeHeld(event.creatorId, event.id, CREATE_EVENT_CREDIT_COST);

    for (const interest of activeInterests) {
      ledger.consumeHeld(interest.userId, event.id, SHOW_INTEREST_CREDIT_COST);
      repositories.eventInterests.save({
        ...interest,
        status: 'consumed'
      });
    }

    return {
      event: activeEvent,
      activated: true
    };
  }

  function showInterest({ eventId, userId }) {
    const event = repositories.events.findById(eventId);
    if (!event) {
      throw new Error('Cohort was not found.');
    }

    if (event.status !== 'open') {
      throw new Error('Interest can only be shown for open cohorts.');
    }

    if (event.creatorId === userId) {
      throw new Error('Creators cannot show interest in their own cohort.');
    }

    const user = repositories.users.findById(userId);
    if (!user) {
      throw new Error('Participant account was not found.');
    }

    const existingInterest = repositories.eventInterests.findByEventAndUser(event.id, user.id);
    if (existingInterest && existingInterest.status === 'active') {
      throw new Error('Participant already has active interest in this cohort.');
    }

    if (existingInterest && existingInterest.status === 'consumed') {
      throw new Error('Participant already joined this active cohort.');
    }

    const committedInterests = activeOrCommittedInterests(repositories.eventInterests.listByEvent(event.id));
    if (committedInterests.length >= event.maxParticipants) {
      throw new Error('Cohort has reached its participant cap.');
    }

    const interest = {
      id: createInterestId(),
      eventId: event.id,
      userId: user.id,
      creditsHeld: SHOW_INTEREST_CREDIT_COST,
      status: 'active',
      createdAt: now()
    };

    assertNoValidationErrors(validateEventInterest(interest));
    ledger.hold(user.id, event.id, SHOW_INTEREST_CREDIT_COST);
    const savedInterest = repositories.eventInterests.save(interest);
    const quorumResult = activateIfQuorumMet(event);

    return {
      event: quorumResult.event,
      interest: repositories.eventInterests.findById(savedInterest.id),
      participant: user,
      creditHoldAmount: SHOW_INTEREST_CREDIT_COST,
      activated: quorumResult.activated,
      balance: ledger.balanceForUser(user.id)
    };
  }

  return {
    showInterest
  };
}
