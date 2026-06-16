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

function normalizeSearchTerm(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function searchWords(value) {
  return normalizeSearchTerm(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function publicSearchValues(event) {
  return [
    event.title,
    event.description,
    event.category,
    event.topic,
    event.targetAudience,
    event.targetSkillLevel,
    event.additionalDetails
  ]
    .filter((value) => typeof value === 'string' && value.length > 0);
}

function publicSearchText(event) {
  return publicSearchValues(event).join(' ').toLowerCase();
}

function publicSearchTokens(event) {
  return searchWords(publicSearchValues(event).join(' '));
}

function editDistance(left, right) {
  if (Math.abs(left.length - right.length) > 2) {
    return 3;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }

    for (let index = 0; index < previous.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
}

function fuzzyThreshold(word) {
  if (word.length <= 2) {
    return 0;
  }

  return word.length <= 4 ? 1 : 2;
}

function scoreSearchWord(word, haystack, tokens) {
  if (tokens.includes(word)) {
    return 100;
  }

  if (haystack.includes(word)) {
    return 80;
  }

  let bestFuzzyScore = 0;
  for (const token of tokens) {
    const distance = editDistance(word, token);
    if (distance > fuzzyThreshold(word)) {
      continue;
    }

    bestFuzzyScore = Math.max(bestFuzzyScore, 60 - (distance * 10));
  }

  return bestFuzzyScore;
}

function scoreSearchMatch(event, query) {
  const words = searchWords(query);

  if (words.length === 0) {
    return undefined;
  }

  const haystack = publicSearchText(event);
  const tokens = publicSearchTokens(event);
  let score = 0;

  for (const word of words) {
    const wordScore = scoreSearchWord(word, haystack, tokens);
    if (wordScore === 0) {
      return undefined;
    }

    score += wordScore;
  }

  return score;
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
  function listPublicEvents(options = {}) {
    const hasSearch = searchWords(options.search).length > 0;

    return repositories.events
      .list()
      .filter((event) => PUBLIC_FEED_STATUSES.has(event.status))
      .map((event) => ({
        event,
        searchScore: scoreSearchMatch(event, options.search)
      }))
      .filter((result) => !hasSearch || typeof result.searchScore === 'number')
      .sort((left, right) => {
        if (hasSearch && left.searchScore !== right.searchScore) {
          return right.searchScore - left.searchScore;
        }

        return right.event.createdAt.getTime() - left.event.createdAt.getTime();
      })
      .map((result) => result.event)
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
