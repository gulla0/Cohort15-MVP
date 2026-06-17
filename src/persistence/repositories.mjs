import {
  assertValidEvent,
  validateEventInterest,
  validateSocialPost,
  validateCreditTransaction
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

  if (typeof user?.authProvider !== 'undefined' && (typeof user.authProvider !== 'string' || user.authProvider.trim().length === 0)) {
    errors.push('authProvider must be non-empty when present.');
  }

  if (typeof user?.authSubject !== 'undefined' && (typeof user.authSubject !== 'string' || user.authSubject.trim().length === 0)) {
    errors.push('authSubject must be non-empty when present.');
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

function assertPurchase(purchase) {
  const errors = [];

  for (const field of ['id', 'userId', 'provider', 'status']) {
    if (typeof purchase?.[field] !== 'string' || purchase[field].trim().length === 0) {
      errors.push(`${field} is required.`);
    }
  }

  if (typeof purchase?.providerCheckoutId !== 'undefined' && (typeof purchase.providerCheckoutId !== 'string' || purchase.providerCheckoutId.trim().length === 0)) {
    errors.push('providerCheckoutId must be non-empty when present.');
  }

  if (typeof purchase?.providerPaymentId !== 'undefined' && (typeof purchase.providerPaymentId !== 'string' || purchase.providerPaymentId.trim().length === 0)) {
    errors.push('providerPaymentId must be non-empty when present.');
  }

  if (!Number.isInteger(purchase?.packageCredits) || purchase.packageCredits <= 0) {
    errors.push('packageCredits must be a positive integer.');
  }

  if (!Number.isInteger(purchase?.amountCents) || purchase.amountCents <= 0) {
    errors.push('amountCents must be a positive integer.');
  }

  if (typeof purchase?.currency !== 'string' || purchase.currency.trim().length === 0) {
    errors.push('currency is required.');
  }

  if (typeof purchase?.creditTransactionId !== 'undefined' && (typeof purchase.creditTransactionId !== 'string' || purchase.creditTransactionId.trim().length === 0)) {
    errors.push('creditTransactionId must be non-empty when present.');
  }

  if (!(purchase?.createdAt instanceof Date) || Number.isNaN(purchase.createdAt.getTime())) {
    errors.push('createdAt must be a valid Date.');
  }

  if (!(purchase?.updatedAt instanceof Date) || Number.isNaN(purchase.updatedAt.getTime())) {
    errors.push('updatedAt must be a valid Date.');
  }

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

export function createRepositories(seed = {}, options = {}) {
  const store = options.store ?? createInMemoryStore(seed);

  function persist() {
    store.persist?.();
  }

  return {
    users: {
      create(user) {
        assertUser(user);
        if (store.users.has(user.id)) {
          throw new Error(`User already exists: ${user.id}`);
        }
        const savedUser = writeRecord(store.users, user);
        persist();
        return savedUser;
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
        const savedEvent = writeRecord(store.events, event);
        persist();
        return savedEvent;
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
        const savedInterest = writeRecord(store.eventInterests, interest);
        persist();
        return savedInterest;
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
    creditTransactions: {
      append(transaction) {
        assertValidation(validateCreditTransaction(transaction));
        if (store.creditTransactions.has(transaction.id)) {
          throw new Error(`Credit transaction already exists: ${transaction.id}`);
        }
        const savedTransaction = writeRecord(store.creditTransactions, transaction);
        persist();
        return savedTransaction;
      },
      listByUser(userId) {
        return readRecords(store.creditTransactions).filter((transaction) => transaction.userId === userId);
      },
      listByEvent(eventId) {
        return readRecords(store.creditTransactions).filter((transaction) => transaction.eventId === eventId);
      },
      list() {
        return readRecords(store.creditTransactions);
      }
    },
    socialPosts: {
      save(post) {
        assertValidation(validateSocialPost(post));
        const savedPost = writeRecord(store.socialPosts, post);
        persist();
        return savedPost;
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
    },
    purchases: {
      save(purchase) {
        assertPurchase(purchase);
        const savedPurchase = writeRecord(store.purchases, purchase);
        persist();
        return savedPurchase;
      },
      findById(id) {
        return readRecord(store.purchases, id);
      },
      findByProviderCheckoutId(providerCheckoutId) {
        return readRecords(store.purchases).find((purchase) => (
          purchase.providerCheckoutId === providerCheckoutId
        ));
      },
      listByUser(userId) {
        return readRecords(store.purchases).filter((purchase) => purchase.userId === userId);
      },
      list() {
        return readRecords(store.purchases);
      }
    }
  };
}
