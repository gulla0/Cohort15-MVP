export const CATEGORIES = Object.freeze([
  'learn',
  'build',
  'practice',
  'accountability',
  'open_source',
  'explore',
]);

export const TARGET_SKILL_LEVELS = Object.freeze([
  'beginner',
  'intermediate',
  'advanced',
  'any',
]);

export const RECURRENCES = Object.freeze([
  'none',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
]);

export const NOTIFICATION_TYPES = Object.freeze([
  'creator_confirmation',
  'participant_confirmation',
  'quorum_met',
]);

export const DELIVERY_STATUSES = Object.freeze(['pending', 'sent', 'failed']);

export const APPROVED_MEETING_HOSTS = Object.freeze([
  'meet.google.com',
  'zoom.us',
  'zoom.com',
  'teams.microsoft.com',
  'teams.live.com',
  'discord.com',
  'discord.gg',
  'slack.com',
]);

export const COLLECTION_WINDOW_HOURS = 168;
export const COLLECTION_WINDOW_MS = COLLECTION_WINDOW_HOURS * 60 * 60 * 1000;

export const TEXT_LIMITS = Object.freeze({
  title: Object.freeze({ min: 3, max: 120 }),
  description: Object.freeze({ min: 20, max: 2_000 }),
  topic: Object.freeze({ min: 2, max: 100 }),
  targetAudience: Object.freeze({ min: 2, max: 500 }),
  additionalDetails: Object.freeze({ min: 0, max: 2_000 }),
  email: Object.freeze({ min: 1, max: 254 }),
  creatorTimeZone: Object.freeze({ min: 1, max: 100 }),
  meetingLink: Object.freeze({ min: 1, max: 2_048 }),
});

export const NUMBER_LIMITS = Object.freeze({
  minQuorum: Object.freeze({ min: 1, max: 15 }),
  meetingDurationMinutes: Object.freeze({ min: 15, max: 480 }),
  recurringMeetingCount: Object.freeze({ min: 2, max: 52 }),
});
