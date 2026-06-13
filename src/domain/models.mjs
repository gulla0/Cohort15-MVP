/**
 * @typedef {'learn' | 'build' | 'practice' | 'accountability' | 'open_source' | 'explore'} EventCategory
 * @typedef {'beginner' | 'intermediate' | 'advanced' | 'any'} TargetSkillLevel
 * @typedef {'open' | 'active' | 'expired' | 'cancelled' | 'completed'} EventStatus
 * @typedef {'none' | 'weekly' | 'biweekly' | 'monthly'} Recurrence
 * @typedef {'pending' | 'posted' | 'failed'} SocialPostStatus
 * @typedef {'active' | 'refunded' | 'consumed'} EventInterestStatus
 * @typedef {'hold' | 'consume' | 'refund' | 'purchase' | 'grant'} CreditTransactionType
 * @typedef {'x' | 'linkedin' | 'discord' | 'telegram'} SocialPlatform
 */

/**
 * @typedef {object} Event
 * @property {string} id
 * @property {string} creatorId
 * @property {string} title
 * @property {string} description
 * @property {EventCategory} category
 * @property {string} topic
 * @property {string} targetAudience
 * @property {TargetSkillLevel} targetSkillLevel
 * @property {string | undefined} [additionalDetails]
 * @property {number} minQuorum
 * @property {number} maxParticipants
 * @property {EventStatus} status
 * @property {string} lockedEventLink
 * @property {string} imageUrl
 * @property {Date} firstMeetingAt
 * @property {number} meetingDurationMinutes
 * @property {Recurrence} recurrence
 * @property {number} meetingCount
 * @property {Date} expiresAt
 * @property {SocialPostStatus} socialPostStatus
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} EventInterest
 * @property {string} id
 * @property {string} eventId
 * @property {string} userId
 * @property {number} creditsHeld
 * @property {EventInterestStatus} status
 * @property {Date} createdAt
 */

/**
 * @typedef {object} CreditTransaction
 * @property {string} id
 * @property {string} userId
 * @property {string | undefined} [eventId]
 * @property {number} amount
 * @property {CreditTransactionType} type
 * @property {Date} createdAt
 */

/**
 * @typedef {object} SocialPost
 * @property {string} id
 * @property {string} eventId
 * @property {SocialPlatform} platform
 * @property {string} postText
 * @property {string | undefined} [postUrl]
 * @property {SocialPostStatus} status
 * @property {Date} createdAt
 * @property {Date | undefined} [postedAt]
 */

export {};
