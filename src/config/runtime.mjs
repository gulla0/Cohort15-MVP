const PRODUCTION_ENV_VALUES = new Set(['production', 'prod']);
const LOCAL_ENV_VALUES = new Set(['development', 'dev', 'local', 'test']);

const SECRET_NAME_PATTERNS = [
  /SECRET/,
  /KEY/,
  /TOKEN/,
  /PASSWORD/
];

const PRODUCTION_REQUIRED_ENV = Object.freeze([
  'COHORT15_APP_URL',
  'COHORT15_SESSION_SECRET',
  'COHORT15_ADMIN_EMAILS',
  'COHORT15_UPLOAD_MODE',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_6_CREDITS',
  'STRIPE_PRICE_14_CREDITS',
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'X_API_KEY',
  'X_API_SECRET',
  'EMAIL_PROVIDER_API_KEY',
  'EMAIL_FROM_ADDRESS'
]);

const OPTIONAL_ENV = Object.freeze([
  'COHORT15_APP_ENV',
  'COHORT15_COOKIE_DOMAIN',
  'COHORT15_PERSISTENCE_FILE',
  'HOST',
  'NODE_ENV',
  'NODE_VERSION',
  'PORT',
  'SUPABASE_AUTH_CALLBACK_PATH',
  'STRIPE_WEBHOOK_PATH'
]);

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function normalizeAppEnv(env) {
  const explicit = env.COHORT15_APP_ENV?.trim().toLowerCase();
  if (explicit) {
    if (PRODUCTION_ENV_VALUES.has(explicit)) {
      return 'production';
    }
    if (LOCAL_ENV_VALUES.has(explicit)) {
      return explicit === 'test' ? 'test' : 'development';
    }
    throw new Error(`COHORT15_APP_ENV must be one of development, test, or production. Received ${env.COHORT15_APP_ENV}.`);
  }

  if (env.NODE_ENV?.trim().toLowerCase() === 'production') {
    return 'production';
  }

  if (env.NODE_ENV?.trim().toLowerCase() === 'test') {
    return 'test';
  }

  return 'development';
}

function validateUrl(name, value, errors) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      errors.push(`${name} must be an https URL outside local development.`);
    }
  } catch {
    errors.push(`${name} must be a valid URL.`);
  }
}

function validateEmailList(name, value, errors) {
  const emails = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (emails.length === 0) {
    errors.push(`${name} must contain at least one admin email address.`);
    return;
  }

  for (const email of emails) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errors.push(`${name} contains an invalid email address: ${email}.`);
    }
  }
}

function validateUploadMode(value, errors) {
  const allowed = new Set(['disabled', 'local', 'external']);
  if (!allowed.has(value)) {
    errors.push('COHORT15_UPLOAD_MODE must be disabled, local, or external.');
  }
  if (value === 'local') {
    errors.push('COHORT15_UPLOAD_MODE=local is not allowed in production until T026 hardens upload storage.');
  }
}

function validateProductionRuntimeConfig(env) {
  const errors = [];

  for (const name of PRODUCTION_REQUIRED_ENV) {
    if (isBlank(env[name])) {
      errors.push(`${name} is required in production.`);
    }
  }

  if (!isBlank(env.COHORT15_APP_URL)) {
    validateUrl('COHORT15_APP_URL', env.COHORT15_APP_URL, errors);
  }

  if (!isBlank(env.COHORT15_SESSION_SECRET) && env.COHORT15_SESSION_SECRET.trim().length < 32) {
    errors.push('COHORT15_SESSION_SECRET must be at least 32 characters.');
  }

  if (!isBlank(env.COHORT15_ADMIN_EMAILS)) {
    validateEmailList('COHORT15_ADMIN_EMAILS', env.COHORT15_ADMIN_EMAILS, errors);
  }

  if (!isBlank(env.COHORT15_UPLOAD_MODE)) {
    validateUploadMode(env.COHORT15_UPLOAD_MODE.trim().toLowerCase(), errors);
  }

  if (!isBlank(env.COHORT15_PERSISTENCE_FILE)) {
    errors.push('COHORT15_PERSISTENCE_FILE is local-development storage and must not be set in production.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid Cohort15 production configuration:\n- ${errors.join('\n- ')}`);
  }
}

export function loadRuntimeConfig(env = process.env) {
  const appEnv = normalizeAppEnv(env);
  const isProduction = appEnv === 'production';

  if (isProduction) {
    validateProductionRuntimeConfig(env);
  }

  return Object.freeze({
    appEnv,
    isProduction,
    appUrl: env.COHORT15_APP_URL?.trim() || 'http://localhost:3000',
    host: env.HOST?.trim() || '0.0.0.0',
    port: Number.parseInt(env.PORT ?? '3000', 10),
    uploadMode: env.COHORT15_UPLOAD_MODE?.trim().toLowerCase() || 'local',
    auth: Object.freeze({
      supabaseUrl: env.SUPABASE_URL?.trim(),
      supabaseAuthCallbackPath: env.SUPABASE_AUTH_CALLBACK_PATH?.trim() || '/auth/callback'
    }),
    stripe: Object.freeze({
      webhookPath: env.STRIPE_WEBHOOK_PATH?.trim() || '/stripe/webhook',
      price6Credits: env.STRIPE_PRICE_6_CREDITS?.trim(),
      price14Credits: env.STRIPE_PRICE_14_CREDITS?.trim()
    }),
    adminEmails: (env.COHORT15_ADMIN_EMAILS ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  });
}

export function listRuntimeEnvVars() {
  return Object.freeze({
    requiredInProduction: PRODUCTION_REQUIRED_ENV,
    optional: OPTIONAL_ENV,
    secretPatterns: SECRET_NAME_PATTERNS.map((pattern) => pattern.source)
  });
}
