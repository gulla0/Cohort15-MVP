export const APP_NAME = 'Cohort15';

export const FOUNDATION_AREAS = Object.freeze([
  'domain',
  'persistence',
  'server',
  'ui'
]);

export const EVENT_CATEGORIES = Object.freeze([
  'learn',
  'build',
  'practice',
  'accountability',
  'open_source',
  'explore'
]);

export const TARGET_SKILL_LEVELS = Object.freeze([
  'beginner',
  'intermediate',
  'advanced',
  'any'
]);

export const EVENT_STATUSES = Object.freeze([
  'open',
  'active',
  'expired',
  'cancelled',
  'completed'
]);

export const RECURRENCE_VALUES = Object.freeze([
  'none',
  'daily',
  'weekly',
  'biweekly',
  'monthly'
]);

export const SOCIAL_POST_STATUSES = Object.freeze([
  'pending',
  'posted',
  'failed'
]);

export const INTEREST_STATUSES = Object.freeze([
  'active',
  'refunded',
  'consumed'
]);

export const TOKEN_TRANSACTION_TYPES = Object.freeze([
  'hold',
  'consume',
  'refund',
  'purchase',
  'grant'
]);

export const SOCIAL_PLATFORMS = Object.freeze([
  'x',
  'linkedin',
  'discord',
  'telegram'
]);

export const CREATE_EVENT_TOKEN_COST = 2;
export const SHOW_INTEREST_TOKEN_COST = 1;
export const MAX_PARTICIPANTS = 15;
export const DEFAULT_EXPIRY_DAYS = 14;
export const DEFAULT_COHORT_IMAGE_PATH = '/assets/default-cohort.png';

export const ALLOWED_MEETING_LINK_HOSTS = Object.freeze([
  'meet.google.com',
  'zoom.us',
  'zoom.com',
  'teams.microsoft.com',
  'teams.live.com',
  'discord.com',
  'discord.gg',
  'slack.com'
]);

export function getFoundationSummary() {
  return {
    appName: APP_NAME,
    stack: 'Node.js HTTP server with ES modules and dependency-free tests',
    areas: FOUNDATION_AREAS
  };
}
