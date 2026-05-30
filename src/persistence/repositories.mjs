import {
  assertValidEvent,
  validateEventInterest,
  validateSocialPost,
  validateTokenTransaction
} from '../domain/validation.mjs';
import { createInMemoryStore, readRecord, readRecords, writeRecord } from './store.mjs';

function assertUser(user) {
  const errors = [];

  if (typeof user?.id !== 'string' || user.id.trim().length === 0) {
    errors.push('id is required.');
  }

  if (typeof user?.displayName !== 'string' || user.displayName.trim().length === 0) {
    errors.push('displayName is required.');
  }

  if (typeof user?.email !== 'undefined' && (typeof user.email !== 'string' || user.email.trim().length === 0)) {
    errors.push('email must be non-empty when present.');
  }

  if (!(user?.createdAt instanceof Date) || Number.isNaN(user.createdAt.getTime())) {
    errors.push('createdAt must be a valid Date.');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
}

function assertValidation(errors) {
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
}

function assertUniqueInterest(store, interest) {
  const duplicate = [...store.eventInterests.values()].find((existing) => (
    existing.id !== interest.id
    && existing.eventId === interest.eventId
    && existing.userId === interest.userId
  ));

  if (duplicate) {
    throw new Error('Event interest must be unique by eventId and userId.');
  }
}

export function createRepositories(seed = {}) {
  const store = createInMemoryStore(seed);

  return {
    users: {
      create(user) {
        assertUser(user);
        if (store.users.has(user.id)) {
          throw new Error(`User already exists: ${user.id}`);
        }
        return writeRecord(store.users, user);
      },
      findById(id) {
        return readRecord(store.users, id);
      },
      list() {
        return readRecords(store.users);
      }
    },
    events: {
      save(event) {
        assertValidEvent(event);
        return writeRecord(store.events, event);
      },
      findById(id) {
        return readRecord(store.events, id);
      },
      list() {
        return readRecords(store.events);
      }
    },
    eventInterests: {
      save(interest) {
        assertValidation(validateEventInterest(interest));
        assertUniqueInterest(store, interest);
        return writeRecord(store.eventInterests, interest);
      },
      findById(id) {
        return readRecord(store.eventInterests, id);
      },
      findByEventAndUser(eventId, userId) {
        return readRecords(store.eventInterests).find((interest) => (
          interest.eventId === eventId && interest.userId === userId
        ));
      },
      listByEvent(eventId) {
        return readRecords(store.eventInterests).filter((interest) => interest.eventId === eventId);
      },
      listByUser(userId) {
        return readRecords(store.eventInterests).filter((interest) => interest.userId === userId);
      }
    },
    tokenTransactions: {
      append(transaction) {
        assertValidation(validateTokenTransaction(transaction));
        if (store.tokenTransactions.has(transaction.id)) {
          throw new Error(`Token transaction already exists: ${transaction.id}`);
        }
        return writeRecord(store.tokenTransactions, transaction);
      },
      listByUser(userId) {
        return readRecords(store.tokenTransactions).filter((transaction) => transaction.userId === userId);
      },
      listByEvent(eventId) {
        return readRecords(store.tokenTransactions).filter((transaction) => transaction.eventId === eventId);
      },
      list() {
        return readRecords(store.tokenTransactions);
      }
    },
    socialPosts: {
      save(post) {
        assertValidation(validateSocialPost(post));
        return writeRecord(store.socialPosts, post);
      },
      findById(id) {
        return readRecord(store.socialPosts, id);
      },
      listByEvent(eventId) {
        return readRecords(store.socialPosts).filter((post) => post.eventId === eventId);
      },
      list() {
        return readRecords(store.socialPosts);
      }
    }
  };
}
