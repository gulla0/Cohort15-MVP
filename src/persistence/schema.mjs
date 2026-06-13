export const SCHEMA_VERSION = 1;

export const TABLES = Object.freeze({
  users: Object.freeze({
    primaryKey: 'id',
    fields: Object.freeze(['id', 'displayName', 'email', 'createdAt'])
  }),
  events: Object.freeze({
    primaryKey: 'id',
    fields: Object.freeze([
      'id',
      'creatorId',
      'title',
      'description',
      'category',
      'topic',
      'targetAudience',
      'targetSkillLevel',
      'additionalDetails',
      'minQuorum',
      'maxParticipants',
      'status',
      'lockedEventLink',
      'imageUrl',
      'firstMeetingAt',
      'meetingDurationMinutes',
      'recurrence',
      'meetingCount',
      'expiresAt',
      'socialPostStatus',
      'createdAt',
      'updatedAt'
    ])
  }),
  eventInterests: Object.freeze({
    primaryKey: 'id',
    unique: Object.freeze(['eventId', 'userId']),
    fields: Object.freeze(['id', 'eventId', 'userId', 'creditsHeld', 'status', 'createdAt'])
  }),
  creditTransactions: Object.freeze({
    primaryKey: 'id',
    indexes: Object.freeze(['userId', 'eventId', 'type']),
    fields: Object.freeze(['id', 'userId', 'eventId', 'amount', 'type', 'source', 'createdAt'])
  }),
  socialPosts: Object.freeze({
    primaryKey: 'id',
    indexes: Object.freeze(['eventId', 'platform', 'status']),
    fields: Object.freeze(['id', 'eventId', 'platform', 'postText', 'postUrl', 'status', 'createdAt', 'postedAt'])
  })
});

export const FUTURE_CREDIT_SOURCES = Object.freeze([
  'purchase'
]);
