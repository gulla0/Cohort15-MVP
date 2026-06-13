import { serializeEventForViewer } from '../domain/validation.mjs';

const PUBLIC_FEED_STATUSES = new Set(['open', 'active']);

function eligibleLinkViewerIds(interests) {
  return interests
    .filter((interest) => interest.status === 'active' || interest.status === 'consumed')
    .map((interest) => interest.userId);
}

function summarizeCapacity(event, interests) {
  const committedCount = interests
    .filter((interest) => interest.status === 'active' || interest.status === 'consumed')
    .length;
  const openSpots = Math.max(event.maxParticipants - committedCount, 0);
  const quorumRemaining = Math.max(event.minQuorum - committedCount, 0);

  return {
    committedCount,
    minQuorum: event.minQuorum,
    maxParticipants: event.maxParticipants,
    openSpots,
    quorumRemaining,
    isFull: openSpots === 0
  };
}

function serializeWithInterest(repositories, event, viewerId) {
  const interests = repositories.eventInterests.listByEvent(event.id);
  const interestedUserIds = eligibleLinkViewerIds(interests);

  return {
    ...serializeEventForViewer(event, {
    userId: viewerId,
    interestedUserIds
    }),
    capacity: summarizeCapacity(event, interests)
  };
}

export function createEventBrowsingService({ repositories }) {
  function listPublicEvents() {
    return repositories.events
      .list()
      .filter((event) => PUBLIC_FEED_STATUSES.has(event.status))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map((event) => serializeWithInterest(repositories, event));
  }

  function getPublicEvent(eventId, viewerId) {
    const event = repositories.events.findById(eventId);

    if (!event || !PUBLIC_FEED_STATUSES.has(event.status)) {
      return undefined;
    }

    return serializeWithInterest(repositories, event, viewerId);
  }

  return {
    getPublicEvent,
    listPublicEvents
  };
}
